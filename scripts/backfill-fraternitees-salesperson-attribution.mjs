import { createHash, createDecipheriv } from "node:crypto";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ORGANIZATION_ID = "f662ab60-bd86-4bfe-8b6c-404feffb84a4";
const ORGANIZATION_ID = process.env.ORGANIZATION_ID ?? DEFAULT_ORGANIZATION_ID;
const START_YEAR = Number.parseInt(process.env.PRINTAVO_OWNER_START_YEAR ?? "2026", 10);
const MIN_YEAR = Number.parseInt(process.env.PRINTAVO_OWNER_MIN_YEAR ?? "2000", 10);
const PAGE_LIMIT = Number.parseInt(process.env.PRINTAVO_OWNER_PAGE_LIMIT ?? "8", 10);
const PAGE_DELAY_MS = Number.parseInt(process.env.PRINTAVO_OWNER_PAGE_DELAY_MS ?? "2500", 10);
const CHECKPOINT_PATH =
  process.env.PRINTAVO_OWNER_CHECKPOINT_PATH ?? "/tmp/map-app-fraternitees-salesperson-backfill.json";
const PRINTAVO_ENDPOINT = "https://www.printavo.com/api/v2";

const CHANGE_REQUEST_IDS = [
  "72942898-9437-4b27-9ff9-c82a816996c6",
  "dcf65394-8912-46d9-aed9-46a0e29afa4c",
  "ff79f3b6-aef3-49c9-a2e9-8a3a2ed95d8b",
  "fbabdb21-59be-460c-8b7d-c19d8422a94e",
  "50584ccf-d3c6-4e5b-8d1b-41ba3858a596",
];

function loadEnvFile(path) {
  if (!fs.existsSync(path)) {
    return;
  }

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) {
      continue;
    }
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(process.env.MAP_APP_ENV_FILE ?? ".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function decryptText(ciphertext) {
  const [ivPart, tagPart, payloadPart] = ciphertext.split(".");
  const key = createHash("sha256").update(process.env.APP_ENCRYPTION_KEY ?? "").digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(payloadPart, "base64url")), decipher.final()]).toString("utf8");
}

function readCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    return { year: START_YEAR, cursor: null, scanned: 0, updated: 0 };
  }

  return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
}

function writeCheckpoint(checkpoint) {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2));
}

function normalizeSalesRepName(value) {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : null;
}

async function readPrintavoCredentials() {
  const { data: installation, error: installationError } = await supabase
    .from("integration_installation")
    .select("id")
    .eq("organization_id", ORGANIZATION_ID)
    .eq("provider", "printavo")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (installationError) {
    throw installationError;
  }
  if (!installation) {
    throw new Error("No active Printavo integration installation found.");
  }

  const { data: secret, error: secretError } = await supabase
    .from("integration_secret")
    .select("ciphertext")
    .eq("organization_id", ORGANIZATION_ID)
    .eq("installation_id", installation.id)
    .eq("key_name", "credentials")
    .maybeSingle();
  if (secretError) {
    throw secretError;
  }
  if (!secret?.ciphertext) {
    throw new Error("No Printavo credential secret found.");
  }

  const credentials = JSON.parse(decryptText(secret.ciphertext));
  if (!credentials.email || !credentials.apiKey) {
    throw new Error("Stored Printavo credentials are incomplete.");
  }
  return credentials;
}

async function printavoGraphql(credentials, query, variables) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const response = await fetch(PRINTAVO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        email: credentials.email,
        token: credentials.apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });
    const raw = await response.text();
    let payload = {};
    try {
      payload = JSON.parse(raw);
    } catch {}

    if (response.ok && !payload.errors) {
      return payload.data;
    }

    const message =
      (payload.errors ?? []).map((error) => error.message).join("; ") || payload.message || raw.slice(0, 200);
    if (response.status === 429 && attempt < 8) {
      const retryAfterSeconds = Number(response.headers.get("retry-after")) || 60 * attempt;
      console.log(JSON.stringify({ rateLimited: true, retryAfterSeconds, attempt }));
      await sleep(retryAfterSeconds * 1000);
      continue;
    }

    throw new Error(`Printavo ${response.status}: ${message}`);
  }
}

async function fetchOrdersMissingSalesRep() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("order_record")
      .select("organization_id,provider,external_order_id,source_payload")
      .eq("organization_id", ORGANIZATION_ID)
      .eq("provider", "printavo")
      .is("sales_rep_name", null)
      .range(from, from + 999);
    if (error) {
      throw error;
    }

    rows.push(...(data ?? []));
    if (!data || data.length < 1000) {
      break;
    }
  }

  return new Map(rows.map((row) => [row.external_order_id, row]));
}

async function updateOrderOwner(existing, owner) {
  const ownerName = normalizeSalesRepName(owner?.name);
  if (!ownerName) {
    return false;
  }

  const ownerId = normalizeSalesRepName(owner?.id);
  const ownerEmail = normalizeSalesRepName(owner?.email);
  const { error } = await supabase.from("order_record").upsert(
    {
      organization_id: existing.organization_id,
      provider: existing.provider,
      external_order_id: existing.external_order_id,
      sales_rep_name: ownerName,
      source_payload: {
        ...existing.source_payload,
        salesRepExternalId: ownerId,
        salesRepName: ownerName,
        salesRepEmail: ownerEmail,
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,provider,external_order_id" },
  );
  if (error) {
    throw error;
  }

  return true;
}

async function countAttribution() {
  const [orders, ordersWithRep, accountsWithRep, openRequests] = await Promise.all([
    supabase
      .from("order_record")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ORGANIZATION_ID)
      .eq("provider", "printavo"),
    supabase
      .from("order_record")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ORGANIZATION_ID)
      .eq("provider", "printavo")
      .not("sales_rep_name", "is", null),
    supabase
      .from("account")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ORGANIZATION_ID)
      .not("sales_rep_names", "eq", "{}"),
    supabase
      .from("change_request")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ORGANIZATION_ID)
      .in("id", CHANGE_REQUEST_IDS)
      .neq("status", "resolved"),
  ]);

  for (const result of [orders, ordersWithRep, accountsWithRep, openRequests]) {
    if (result.error) {
      throw result.error;
    }
  }

  return {
    orders: orders.count ?? 0,
    ordersWithSalesRep: ordersWithRep.count ?? 0,
    accountsWithSalesRep: accountsWithRep.count ?? 0,
    targetChangeRequestsStillOpen: openRequests.count ?? 0,
  };
}

async function runPrintavoOwnerBackfill() {
  const credentials = await readPrintavoCredentials();
  let missingById = await fetchOrdersMissingSalesRep();
  let checkpoint = readCheckpoint();
  console.log(JSON.stringify({ phase: "printavo-owner-backfill-start", missingSalesRepRows: missingById.size, checkpoint }));

  for (let year = checkpoint.year; year >= MIN_YEAR && missingById.size > 0; year -= 1) {
    let after = checkpoint.year === year ? checkpoint.cursor : null;
    let hasNextPage = true;
    let pages = 0;

    while (hasNextPage && missingById.size > 0 && pages < PAGE_LIMIT) {
      const data = await printavoGraphql(
        credentials,
        `query PrintavoOwnerBackfill($after: String, $afterDate: ISO8601DateTime, $beforeDate: ISO8601DateTime) {
          orders(first: 25, after: $after, sortDescending: true, sortOn: VISUAL_ID, inProductionAfter: $afterDate, inProductionBefore: $beforeDate) {
            nodes {
              __typename
              ... on Invoice { id owner { id name email } }
              ... on Quote { id owner { id name email } }
            }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        {
          after,
          afterDate: `${year}-01-01T00:00:00.000Z`,
          beforeDate: `${year + 1}-01-01T00:00:00.000Z`,
        },
      );

      let pageUpdates = 0;
      for (const order of data.orders.nodes ?? []) {
        const existing = missingById.get(order.id);
        if (existing && (await updateOrderOwner(existing, order.owner))) {
          missingById.delete(order.id);
          pageUpdates += 1;
          checkpoint.updated += 1;
        }
      }

      checkpoint.scanned += data.orders.nodes?.length ?? 0;
      after = data.orders.pageInfo.endCursor;
      hasNextPage = data.orders.pageInfo.hasNextPage;
      checkpoint = { ...checkpoint, year, cursor: hasNextPage ? after : null, updatedAt: new Date().toISOString() };
      writeCheckpoint(checkpoint);
      pages += 1;

      console.log(JSON.stringify({ phase: "printavo-owner-page", year, pages, pageUpdates, checkpoint, remainingMissing: missingById.size }));

      if (hasNextPage && pages < PAGE_LIMIT) {
        await sleep(PAGE_DELAY_MS);
      }
    }

    if (hasNextPage && pages >= PAGE_LIMIT) {
      console.log(JSON.stringify({ phase: "printavo-owner-backfill-paused", year, checkpoint }));
      return;
    }

    checkpoint = { ...checkpoint, year: year - 1, cursor: null };
    writeCheckpoint(checkpoint);
    missingById = await fetchOrdersMissingSalesRep();
  }

  console.log(JSON.stringify({ phase: "printavo-owner-backfill-finished", remainingMissing: missingById.size, checkpoint }));
}

async function aggregateAccountSalespeople() {
  const repsByAccount = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("order_record")
      .select("account_id,sales_rep_name,order_created_at")
      .eq("organization_id", ORGANIZATION_ID)
      .eq("provider", "printavo")
      .not("account_id", "is", null)
      .not("sales_rep_name", "is", null)
      .order("order_created_at", { ascending: false })
      .range(from, from + 999);
    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      const accountId = row.account_id;
      const repName = normalizeSalesRepName(row.sales_rep_name);
      if (!accountId || !repName) {
        continue;
      }

      const reps = repsByAccount.get(accountId) ?? [];
      if (!reps.includes(repName)) {
        reps.push(repName);
      }
      repsByAccount.set(accountId, reps);
    }

    if (!data || data.length < 1000) {
      break;
    }
  }

  let updated = 0;
  for (const [accountId, salesRepNames] of repsByAccount) {
    const { data: account, error: readError } = await supabase
      .from("account")
      .select("custom_fields")
      .eq("organization_id", ORGANIZATION_ID)
      .eq("id", accountId)
      .maybeSingle();
    if (readError) {
      throw readError;
    }

    const customFields = account?.custom_fields && typeof account.custom_fields === "object" ? account.custom_fields : {};
    const { error } = await supabase
      .from("account")
      .update({
        sales_rep_names: salesRepNames,
        custom_fields: {
          ...customFields,
          primarySalesRepName: salesRepNames[0] ?? null,
          salesRepNames,
        },
      })
      .eq("organization_id", ORGANIZATION_ID)
      .eq("id", accountId);
    if (error) {
      throw error;
    }
    updated += 1;
  }

  console.log(JSON.stringify({ phase: "aggregate-account-salespeople", updatedAccounts: updated }));
}

async function markChangeRequestsResolved() {
  const resolvedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("change_request")
    .update({
      status: "resolved",
      classifier_notes:
        "Implemented in issue #313: noindex/mobile zoom protections verified, calendar-year and grade override requests already present, and sales/date/salesperson sort controls added with production attribution backfill.",
      updated_at: resolvedAt,
    })
    .eq("organization_id", ORGANIZATION_ID)
    .in("id", CHANGE_REQUEST_IDS)
    .select("id,status,title");
  if (error) {
    throw error;
  }

  console.log(JSON.stringify({ phase: "mark-change-requests-resolved", resolvedAt, rows: data }));
}

async function main() {
  const mode = process.argv[2] ?? "all";
  console.log(JSON.stringify({ phase: "before", counts: await countAttribution() }));
  if (mode === "all" || mode === "printavo") {
    await runPrintavoOwnerBackfill();
  }
  if (mode === "all" || mode === "aggregate") {
    await aggregateAccountSalespeople();
  }
  if (mode === "all" || mode === "resolve-change-requests") {
    await markChangeRequestsResolved();
  }
  console.log(JSON.stringify({ phase: "after", counts: await countAttribution() }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
