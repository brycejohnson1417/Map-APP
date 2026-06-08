import { createHash, createDecipheriv } from "node:crypto";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ORGANIZATION_ID = process.env.ORGANIZATION_ID ?? "f662ab60-bd86-4bfe-8b6c-404feffb84a4";
const START_YEAR = Number.parseInt(process.env.PRINTAVO_OWNER_START_YEAR ?? "2026", 10);
const MIN_YEAR = Number.parseInt(process.env.PRINTAVO_OWNER_MIN_YEAR ?? "2000", 10);
const PAGE_DELAY_MS = Number.parseInt(process.env.PRINTAVO_OWNER_PAGE_DELAY_MS ?? "2500", 10);
const CHECKPOINT_PATH = process.env.PRINTAVO_OWNER_CHECKPOINT_PATH ?? "/tmp/map-app-printavo-owner-backfill.json";
const PRINTAVO_ENDPOINT = "https://www.printavo.com/api/v2";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) {
    return;
  }
  const lines = fs.readFileSync(path, "utf8").split(/\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) {
      continue;
    }
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase env vars are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function readCredentials() {
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
      const retryAfter = Number(response.headers.get("retry-after")) || 60 * attempt;
      console.log(JSON.stringify({ rateLimited: true, retryAfterSeconds: retryAfter, attempt }));
      await sleep(retryAfter * 1000);
      continue;
    }

    throw new Error(`Printavo ${response.status}: ${message}`);
  }
}

async function fetchMissingRows() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("order_record")
      .select("organization_id,provider,external_order_id,source_payload")
      .eq("organization_id", ORGANIZATION_ID)
      .eq("provider", "printavo")
      .is("source_payload->>ownerName", null)
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
  const ownerName = typeof owner?.name === "string" && owner.name.trim() ? owner.name.trim() : null;
  if (!ownerName) {
    return false;
  }

  const ownerId = typeof owner.id === "string" && owner.id.trim() ? owner.id.trim() : null;
  const ownerEmail = typeof owner.email === "string" && owner.email.trim() ? owner.email.trim() : null;
  const { error } = await supabase.from("order_record").upsert(
    {
      organization_id: existing.organization_id,
      provider: existing.provider,
      external_order_id: existing.external_order_id,
      sales_rep_name: ownerName,
      source_payload: {
        ...existing.source_payload,
        ownerId,
        ownerName,
        ownerEmail,
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

async function countOwnerRows() {
  const [{ count: ownerName }, { count: salesRepName }] = await Promise.all([
    supabase
      .from("order_record")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ORGANIZATION_ID)
      .eq("provider", "printavo")
      .not("source_payload->>ownerName", "is", null),
    supabase
      .from("order_record")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ORGANIZATION_ID)
      .eq("provider", "printavo")
      .not("sales_rep_name", "is", null),
  ]);
  return { ownerName, salesRepName };
}

async function run() {
  const credentials = await readCredentials();
  let missingById = await fetchMissingRows();
  let checkpoint = readCheckpoint();
  console.log(JSON.stringify({ starting: true, missingOwnerRows: missingById.size, checkpoint, counts: await countOwnerRows() }));

  for (let year = checkpoint.year; year >= MIN_YEAR && missingById.size > 0; year -= 1) {
    let after = checkpoint.year === year ? checkpoint.cursor : null;
    let hasNextPage = true;
    let pages = 0;

    while (hasNextPage && missingById.size > 0) {
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

      if (pageUpdates || pages % 10 === 0 || !hasNextPage) {
        console.log(
          JSON.stringify({
            year,
            pages,
            pageUpdates,
            scanned: checkpoint.scanned,
            updated: checkpoint.updated,
            remainingMissing: missingById.size,
            cursor: checkpoint.cursor ? "saved" : null,
          }),
        );
      }

      if (hasNextPage) {
        await sleep(PAGE_DELAY_MS);
      }
    }

    checkpoint = { ...checkpoint, year: year - 1, cursor: null };
    writeCheckpoint(checkpoint);
    missingById = await fetchMissingRows();
    console.log(JSON.stringify({ completedYear: year, remainingMissing: missingById.size, counts: await countOwnerRows() }));
  }

  console.log(JSON.stringify({ done: true, remainingMissing: missingById.size, checkpoint, counts: await countOwnerRows() }));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
