import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnvValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  if (quoted) {
    return trimmed.slice(1, -1);
  }

  return trimmed.replace(/\s+#.*$/, "");
}

function loadLocalEnv() {
  const envFiles = [".env.local", ".env"];

  for (const relativePath of envFiles) {
    const fullPath = resolve(repoRoot, relativePath);
    if (!existsSync(fullPath)) {
      continue;
    }

    const content = readFileSync(fullPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const exportPrefix = trimmed.startsWith("export ") ? "export " : "";
      const normalized = exportPrefix ? trimmed.slice(exportPrefix.length) : trimmed;
      const separatorIndex = normalized.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = normalized.slice(0, separatorIndex).trim();
      if (!key || process.env[key]?.trim()) {
        continue;
      }

      process.env[key] = parseEnvValue(normalized.slice(separatorIndex + 1));
    }
  }
}

loadLocalEnv();

function usage() {
  console.log(`Usage:
  node scripts/mapapp.mjs health check <org>
  node scripts/mapapp.mjs sync live <org> [--dry-run] [--companies] [--contacts] [--orders] [--limit=100] [--from=YYYY-MM-DD]
  node scripts/mapapp.mjs migration apply <org>
  node scripts/mapapp.mjs migration dry-run <org>
  node scripts/mapapp.mjs migration validate <org>`);
}

function requiredTenantFiles(org) {
  return [
    `docs/tenants/${org}/REQUIREMENTS.md`,
    `docs/tenants/${org}/MIGRATION.md`,
    `docs/tenants/${org}/FIELD_MAPPINGS.md`,
    `docs/tenants/${org}/BASELINE.md`,
    `docs/tenants/${org}/ACCEPTANCE.md`,
    `docs/tenants/${org}/LEGACY_SYSTEM.md`,
    `docs/tenants/${org}/DATA_MIGRATION.md`,
    `docs/tenants/${org}/CREDENTIALS.md`,
    `docs/tenants/${org}/MIGRATION_LOG.md`,
    `tenants/${org}/field-mappings.json`,
    "docs/agents/MIGRATION_PLAYBOOK.md",
    "docs/SETUP.md",
    ".env.example",
  ];
}

function requiredEnvKeys() {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_ACCESS_TOKEN",
    "APP_ENCRYPTION_KEY",
    "NEON_SOURCE_DATABASE_URL",
    "NOTION_TOKEN",
    "NABIS_API_KEY",
    "GOOGLE_MAPS_BROWSER_API_KEY",
    "GOOGLE_MAPS_SERVER_API_KEY",
  ];
}

function fileContainsTodo(path) {
  const content = readFileSync(resolve(repoRoot, path), "utf8");
  return /\bTODO\b/i.test(content);
}

function collectTenantFileChecks(org) {
  return requiredTenantFiles(org).map((relativePath) => {
    const fullPath = resolve(repoRoot, relativePath);
    const exists = existsSync(fullPath);
    return {
      label: `file:${relativePath}`,
      ok: exists,
      detail: exists ? "present" : "missing",
    };
  });
}

function collectEnvChecks() {
  return requiredEnvKeys().map((key) => ({
    label: `env:${key}`,
    ok: Boolean(process.env[key]?.trim()),
    detail: process.env[key]?.trim() ? "present" : "missing",
  }));
}

function collectTodoChecks(org) {
  const todoSensitiveFiles = [
    `docs/tenants/${org}/MIGRATION.md`,
    `docs/tenants/${org}/FIELD_MAPPINGS.md`,
    `docs/tenants/${org}/BASELINE.md`,
    `docs/tenants/${org}/ACCEPTANCE.md`,
    `docs/tenants/${org}/LEGACY_SYSTEM.md`,
    `docs/tenants/${org}/DATA_MIGRATION.md`,
    `docs/tenants/${org}/CREDENTIALS.md`,
    `tenants/${org}/field-mappings.json`,
  ];

  return todoSensitiveFiles
    .filter((relativePath) => existsSync(resolve(repoRoot, relativePath)))
    .map((relativePath) => ({
      label: `todo:${relativePath}`,
      ok: !fileContainsTodo(relativePath),
      detail: fileContainsTodo(relativePath) ? "contains TODO markers" : "no TODO markers detected",
    }));
}

function collectMigrationEvidenceChecks(org) {
  const checks = [];
  const fieldMappingPath = resolve(repoRoot, `tenants/${org}/field-mappings.json`);
  if (existsSync(fieldMappingPath)) {
    try {
      const parsed = JSON.parse(readFileSync(fieldMappingPath, "utf8"));
      const crmCount = Array.isArray(parsed.crm) ? parsed.crm.length : 0;
      const ordersCount = Array.isArray(parsed.orders) ? parsed.orders.length : 0;
      const legacyCount = Array.isArray(parsed.legacy) ? parsed.legacy.length : 0;
      checks.push({
        label: `evidence:field-mappings:${org}`,
        ok: crmCount + ordersCount + legacyCount > 0,
        detail: `crm=${crmCount}, orders=${ordersCount}, legacy=${legacyCount}`,
      });
    } catch (error) {
      checks.push({
        label: `evidence:field-mappings:${org}`,
        ok: false,
        detail: error instanceof Error ? error.message : "invalid JSON",
      });
    }
  }

  const baselinePath = resolve(repoRoot, `docs/tenants/${org}/BASELINE.md`);
  if (existsSync(baselinePath)) {
    const baseline = readFileSync(baselinePath, "utf8");
    const numericMatches = baseline.match(/\b\d+(\.\d+)?\s?(ms|s|kb|mb|gb|%|rows|pins)?\b/gi) ?? [];
    checks.push({
      label: `evidence:baseline:${org}`,
      ok: !/\bTODO\b/i.test(baseline) && numericMatches.length >= 5,
      detail: `numeric-matches=${numericMatches.length}`,
    });
  }

  const dataMigrationPath = resolve(repoRoot, `docs/tenants/${org}/DATA_MIGRATION.md`);
  if (existsSync(dataMigrationPath)) {
    const dataMigration = readFileSync(dataMigrationPath, "utf8");
    const selectStatements = dataMigration.match(/\bselect\b/gi) ?? [];
    checks.push({
      label: `evidence:data-migration:${org}`,
      ok: !/\bTODO\b/i.test(dataMigration) && selectStatements.length >= 2,
      detail: `select-statements=${selectStatements.length}`,
    });
  }

  const legacySystemPath = resolve(repoRoot, `docs/tenants/${org}/LEGACY_SYSTEM.md`);
  if (existsSync(legacySystemPath)) {
    const legacySystem = readFileSync(legacySystemPath, "utf8");
    const hasCommit = /reference commit:\s*`?[0-9a-f]{40}`?/i.test(legacySystem);
    checks.push({
      label: `evidence:legacy-system:${org}`,
      ok: !/\bTODO\b/i.test(legacySystem) && hasCommit,
      detail: hasCommit ? "commit reference present" : "missing commit reference",
    });
  }

  return checks;
}

async function checkRuntimeHealth() {
  const baseUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!baseUrl) {
    return [
      {
        label: "runtime:health",
        ok: false,
        detail: "NEXT_PUBLIC_APP_URL or APP_URL is missing",
      },
    ];
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/runtime/health`);
    const body = await response.text();
    return [
      {
        label: "runtime:health",
        ok: response.ok,
        detail: response.ok ? body : `status ${response.status}: ${body}`,
      },
    ];
  } catch (error) {
    return [
      {
        label: "runtime:health",
        ok: false,
        detail: error instanceof Error ? error.message : "health check request failed",
      },
    ];
  }
}

function printResults(title, checks) {
  console.log(`\n${title}`);
  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label} — ${check.detail}`);
  }
}

function exitFromChecks(checks) {
  process.exit(checks.every((check) => check.ok) ? 0 : 1);
}

async function collectLegacyNeonCounts() {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: process.env.NEON_SOURCE_DATABASE_URL,
    connectionTimeoutMillis: 15_000,
    query_timeout: 30_000,
  });

  const tables = [
    "Account",
    "Contact",
    "ActivityLog",
    "NabisRetailer",
    "NabisOrder",
    "AccountIdentityMapping",
    "Territory",
    "TerritoryMarker",
    "AuditEvent",
    "TerritoryStoreReadModel",
    "TerritoryCheckInMirror",
    "TerritoryStoreSyncJob",
  ];

  await client.connect();
  try {
    const counts = {};
    for (const table of tables) {
      const result = await client.query(`select count(*)::int as count from public."${table}"`);
      counts[table] = Number(result.rows[0]?.count ?? 0);
    }

    return counts;
  } finally {
    await client.end();
  }
}

async function collectSupabaseRuntimeCounts() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init = {}) =>
        fetch(input, {
          ...init,
          signal: init.signal ?? AbortSignal.timeout(15_000),
        }),
    },
  });

  const tables = [
    "organization",
    "organization_member",
    "integration_installation",
    "integration_secret",
    "field_mapping",
    "account",
    "account_identity",
    "contact",
    "activity",
    "order_record",
    "territory_boundary",
    "territory_marker",
    "sync_cursor",
    "sync_job",
    "audit_event",
  ];

  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    counts[table] = count ?? 0;
  }

  return counts;
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== ""));
}

function toDateOnly(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

function toIso(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

function normalizeIdentity(value) {
  return String(value ?? "").trim();
}

function providerForIdentityType(identityType) {
  if (identityType === "NOTION_PAGE_ID") {
    return "notion";
  }

  if (identityType === "NABIS_RETAILER_ID") {
    return "nabis";
  }

  return "csv_import";
}

function chunkArray(values, size = 400) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function insertChunks(supabase, table, rows, options = {}) {
  if (!rows.length) {
    return [];
  }

  const inserted = [];
  for (const chunk of chunkArray(rows, options.size ?? 400)) {
    let request = supabase.from(table).insert(chunk);
    if (options.select) {
      request = request.select(options.select);
    }

    const { data, error } = await request;
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    if (data) {
      inserted.push(...data);
    }
  }

  return inserted;
}

async function getLegacyClient() {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: process.env.NEON_SOURCE_DATABASE_URL,
    connectionTimeoutMillis: 15_000,
    query_timeout: 60_000,
  });

  await client.connect();
  return client;
}

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init = {}) =>
        fetch(input, {
          ...init,
          signal: init.signal ?? AbortSignal.timeout(60_000),
        }),
    },
  });
}

async function fetchLegacyRows(client) {
  const accounts = await client.query('select * from public."Account" order by "createdAt"');
  const contacts = await client.query('select * from public."Contact" order by "createdAt"');
  const activities = await client.query('select * from public."ActivityLog" order by "createdAt"');
  const orders = await client.query('select * from public."NabisOrder" order by "createdAt"');
  const identities = await client.query('select * from public."AccountIdentityMapping" where "active" = true order by "createdAt"');
  const territories = await client.query('select * from public."Territory" order by "createdAt"');
  const markers = await client.query('select * from public."TerritoryMarker" order by "createdAt"');
  const territoryPins = await client.query('select * from public."TerritoryStoreReadModel" order by "name"');

  return {
    accounts: accounts.rows,
    contacts: contacts.rows,
    activities: activities.rows,
    orders: orders.rows,
    identities: identities.rows,
    territories: territories.rows,
    markers: markers.rows,
    territoryPins: territoryPins.rows,
  };
}

async function getOrganizationOrThrow(supabase, orgSlug) {
  const { data, error } = await supabase.from("organization").select("*").eq("slug", orgSlug).single();
  if (error) {
    throw new Error(`organization:${orgSlug}: ${error.message}`);
  }

  return data;
}

async function clearMigratedRuntime(supabase, organizationId) {
  const tables = [
    "order_record",
    "activity",
    "contact",
    "account_identity",
    "territory_marker",
    "territory_boundary",
    "account",
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("organization_id", organizationId);
    if (error) {
      throw new Error(`clear:${table}: ${error.message}`);
    }
  }
}

function buildReadModelLookups(territoryPins) {
  const byNotionPageId = new Map();
  const byLicenseNumber = new Map();

  for (const pin of territoryPins) {
    if (pin.notionPageId) {
      byNotionPageId.set(pin.notionPageId, pin);
    }

    if (pin.licenseNumber) {
      byLicenseNumber.set(pin.licenseNumber, pin);
    }
  }

  return { byNotionPageId, byLicenseNumber };
}

function mapAccountRow(organizationId, account, readModel) {
  return {
    organization_id: organizationId,
    name: account.name,
    display_name: account.name,
    account_status: String(account.status ?? readModel?.statusKey ?? readModel?.status ?? "unknown"),
    lead_status: readModel?.pinKind ?? null,
    referral_source: readModel?.referralSource ?? null,
    vendor_day_status: account.vendorDaySuppressed ? "suppressed" : null,
    licensed_location_id: account.licensedLocationId ?? null,
    license_number: account.licenseNumber ?? readModel?.licenseNumber ?? null,
    address_line_1: account.address1 ?? readModel?.locationAddress ?? null,
    address_line_2: account.address2 ?? null,
    city: account.city ?? readModel?.city ?? null,
    state: account.state ?? readModel?.state ?? null,
    postal_code: account.zipcode ?? null,
    latitude: account.geoLat ?? readModel?.lat ?? null,
    longitude: account.geoLng ?? readModel?.lng ?? null,
    sales_rep_names: normalizeArray(readModel?.repNames),
    last_contacted_at: toDateOnly(account.lastContactedAt ?? readModel?.lastCheckIn),
    crm_updated_at: toIso(account.updatedAt ?? readModel?.lastEditedTime),
    external_updated_at: toIso(readModel?.lastEditedTime ?? account.updatedAt),
    custom_fields: compactObject({
      legacyAccountId: account.id,
      legacyOrgId: account.orgId,
      nabisRetailerId: account.nabisRetailerId,
      notionPageId: account.notionPageId,
      phone: account.phone ?? readModel?.phoneNumber,
      email: readModel?.email,
      daysOverdue: readModel?.daysOverdue,
      followUpDate: toDateOnly(readModel?.followUpDate),
      notes: readModel?.notes,
      locationSource: readModel?.locationSource,
      locationPrecision: readModel?.locationPrecision,
      vendorDaySuppressionReason: account.vendorDaySuppressionReason,
    }),
    source_payload: {
      source: "legacy.account",
      legacy: compactObject({
        id: account.id,
        orgId: account.orgId,
        status: account.status,
      }),
    },
  };
}

function mapPinOnlyAccountRow(organizationId, pin) {
  return {
    organization_id: organizationId,
    name: pin.name,
    display_name: pin.name,
    account_status: String(pin.statusKey ?? pin.status ?? "territory_pin"),
    lead_status: pin.pinKind ?? null,
    referral_source: pin.referralSource ?? null,
    licensed_location_id: null,
    license_number: pin.licenseNumber ?? null,
    city: pin.city ?? null,
    state: pin.state ?? null,
    latitude: pin.lat,
    longitude: pin.lng,
    sales_rep_names: normalizeArray(pin.repNames),
    last_contacted_at: toDateOnly(pin.lastCheckIn),
    crm_updated_at: toIso(pin.lastEditedTime),
    external_updated_at: toIso(pin.lastEditedTime),
    custom_fields: compactObject({
      legacyTerritoryReadModelId: pin.id,
      legacyOrgId: pin.orgId,
      notionPageId: pin.notionPageId,
      phone: pin.phoneNumber,
      email: pin.email,
      daysOverdue: pin.daysOverdue,
      followUpDate: toDateOnly(pin.followUpDate),
      notes: pin.notes,
      locationLabel: pin.locationLabel,
      locationAddress: pin.locationAddress,
      locationSource: pin.locationSource,
      locationPrecision: pin.locationPrecision,
      isApproximate: pin.isApproximate,
    }),
    source_payload: {
      source: "legacy.territory_read_model",
      legacy: compactObject({
        id: pin.id,
        orgId: pin.orgId,
        status: pin.status,
      }),
    },
  };
}

function buildIdentityRows(organizationId, accountsByLegacyId, rows) {
  const identities = new Map();

  function add(accountId, provider, externalId, metadata = {}) {
    const normalized = normalizeIdentity(externalId);
    if (!accountId || !normalized) {
      return;
    }

    const key = `${provider}|account|${normalized}`;
    if (!identities.has(key)) {
      identities.set(key, {
        organization_id: organizationId,
        account_id: accountId,
        provider,
        external_entity_type: "account",
        external_id: normalized,
        match_method: "deterministic",
        match_confidence: 1,
        metadata,
      });
    }
  }

  for (const [legacyId, account] of accountsByLegacyId.entries()) {
    add(account.id, "csv_import", `legacy-account:${legacyId}`, { identityType: "LEGACY_ACCOUNT_ID" });
    add(account.id, "notion", account.custom_fields?.notionPageId, { identityType: "NOTION_PAGE_ID" });
    add(account.id, "nabis", account.custom_fields?.nabisRetailerId, { identityType: "NABIS_RETAILER_ID" });
    add(account.id, "csv_import", account.licensed_location_id, { identityType: "LICENSED_LOCATION_ID" });
    add(account.id, "csv_import", account.license_number, { identityType: "LICENSE_NUMBER" });
  }

  for (const row of rows) {
    const account = row.accountId ? accountsByLegacyId.get(row.accountId) : null;
    const provider = providerForIdentityType(row.identityType);
    add(account?.id, provider, row.identityValue, {
      identityType: row.identityType,
      normalizedValue: row.normalizedValue,
      source: row.source,
      legacyIdentityId: row.id,
      isOverride: row.isOverride,
    });
  }

  return [...identities.values()];
}

function toDateValue(value) {
  const iso = toIso(value);
  return iso ? iso.slice(0, 10) : null;
}

function updateAggregate(current, next, compare) {
  if (!next) {
    return current;
  }

  if (!current || compare(next, current)) {
    return next;
  }

  return current;
}

function buildOrderAggregateUpdates(organizationId, orderRows) {
  const byAccountId = new Map();

  for (const order of orderRows) {
    if (!order.account_id) {
      continue;
    }

    const aggregate = byAccountId.get(order.account_id) ?? {
      organization_id: organizationId,
      account_id: order.account_id,
      last_order_date: null,
      customer_since_date: null,
    };
    const orderDate = toDateValue(order.order_created_at);
    const deliveryDate = order.delivery_date ?? null;
    const candidate = deliveryDate ?? orderDate;

    aggregate.last_order_date = updateAggregate(aggregate.last_order_date, candidate, (next, current) => next > current);
    aggregate.customer_since_date = updateAggregate(aggregate.customer_since_date, orderDate, (next, current) => next < current);
    byAccountId.set(order.account_id, aggregate);
  }

  return [...byAccountId.values()];
}

async function runMigrationApply(org) {
  const legacy = await getLegacyClient();
  const supabase = await getSupabaseAdmin();

  try {
    const organization = await getOrganizationOrThrow(supabase, org);
    const rows = await fetchLegacyRows(legacy);
    const readModels = buildReadModelLookups(rows.territoryPins);

    await clearMigratedRuntime(supabase, organization.id);

    const seenNotionPageIds = new Set(rows.accounts.map((account) => account.notionPageId).filter(Boolean));
    const seenLicenseNumbers = new Set(rows.accounts.map((account) => account.licenseNumber).filter(Boolean));
    const accountRows = rows.accounts.map((account) =>
      mapAccountRow(
        organization.id,
        account,
        account.notionPageId
          ? readModels.byNotionPageId.get(account.notionPageId)
          : readModels.byLicenseNumber.get(account.licenseNumber),
      ),
    );

    for (const pin of rows.territoryPins) {
      if ((pin.notionPageId && seenNotionPageIds.has(pin.notionPageId)) || (pin.licenseNumber && seenLicenseNumbers.has(pin.licenseNumber))) {
        continue;
      }

      accountRows.push(mapPinOnlyAccountRow(organization.id, pin));
    }

    const insertedAccounts = await insertChunks(supabase, "account", accountRows, {
      select: "id,licensed_location_id,license_number,custom_fields",
    });
    const accountsByLegacyId = new Map();
    const accountsByLegacyAccountId = new Map();
    const accountsByLicensedLocationId = new Map();
    const accountsByNabisRetailerId = new Map();

    for (const account of insertedAccounts) {
      const legacyAccountId = account.custom_fields?.legacyAccountId;
      if (legacyAccountId) {
        accountsByLegacyId.set(legacyAccountId, account);
        accountsByLegacyAccountId.set(legacyAccountId, account);
      }

      if (account.licensed_location_id) {
        accountsByLicensedLocationId.set(account.licensed_location_id, account);
      }

      if (account.custom_fields?.nabisRetailerId) {
        accountsByNabisRetailerId.set(account.custom_fields.nabisRetailerId, account);
      }
    }

    const identityRows = buildIdentityRows(organization.id, accountsByLegacyId, rows.identities);
    const insertedIdentities = await insertChunks(supabase, "account_identity", identityRows, {
      select: "id",
    });

    const contactRows = rows.contacts
      .map((contact) => {
        const account = contact.accountId ? accountsByLegacyAccountId.get(contact.accountId) : null;
        const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() || "Unknown Contact";
        return {
          organization_id: organization.id,
          account_id: account?.id ?? null,
          full_name: fullName,
          title: contact.roleTitle ?? null,
          email: contact.email ?? null,
          phone: contact.phone ?? null,
          role: contact.roleTitle ?? null,
          custom_fields: compactObject({
            legacyContactId: contact.id,
            legacyOrgId: contact.orgId,
            status: contact.status,
          }),
          source_payload: {
            source: "legacy.contact",
            legacy: compactObject({
              id: contact.id,
              accountId: contact.accountId,
            }),
          },
        };
      });
    const insertedContacts = await insertChunks(supabase, "contact", contactRows, { select: "id,custom_fields" });
    const contactsByLegacyId = new Map(
      insertedContacts
        .map((contact) => [contact.custom_fields?.legacyContactId, contact])
        .filter(([legacyId]) => Boolean(legacyId)),
    );

    const activityRows = rows.activities
      .map((activity) => {
        const account = activity.accountId ? accountsByLegacyAccountId.get(activity.accountId) : null;
        const contact = activity.contactId ? contactsByLegacyId.get(activity.contactId) : null;
        return {
          organization_id: organization.id,
          account_id: account?.id ?? null,
          contact_id: contact?.id ?? null,
          activity_type: String(activity.type ?? "legacy_activity"),
          summary: activity.title ?? "Legacy activity",
          occurred_at: toIso(activity.createdAt) ?? new Date().toISOString(),
          metadata: compactObject({
            legacyActivityId: activity.id,
            legacyOrgId: activity.orgId,
            description: activity.description,
            channel: activity.channel,
            actorClerkUserId: activity.actorClerkUserId,
            metadata: activity.metadata,
          }),
        };
      });
    const insertedActivities = await insertChunks(supabase, "activity", activityRows, { select: "id" });

    const orderRows = rows.orders.map((order) => {
      const account =
        (order.accountId ? accountsByLegacyAccountId.get(order.accountId) : null) ||
        (order.licensedLocationId ? accountsByLicensedLocationId.get(order.licensedLocationId) : null) ||
        (order.nabisRetailerId ? accountsByNabisRetailerId.get(order.nabisRetailerId) : null);

      return {
        organization_id: organization.id,
        account_id: account?.id ?? null,
        provider: "nabis",
        external_order_id: order.externalOrderId,
        order_number: order.orderNumber ?? null,
        licensed_location_id: order.licensedLocationId ?? null,
        nabis_retailer_id: order.nabisRetailerId ?? null,
        licensed_location_name: order.licensedLocationName ?? null,
        status: order.status ?? null,
        payment_status: order.paymentStatus ?? null,
        order_total: order.orderTotal ?? null,
        order_created_at: toIso(order.orderCreatedDate ?? order.createdAt),
        delivery_date: toDateOnly(order.deliveryDate),
        sales_rep_name: order.salesRep ?? null,
        is_internal_transfer: Boolean(order.isInternalTransfer),
        source_payload: {
          source: "legacy.nabis_order",
          legacy: compactObject({
            id: order.id,
            orgId: order.orgId,
            poSoNumber: order.poSoNumber,
          }),
        },
      };
    });
    const insertedOrders = await insertChunks(supabase, "order_record", orderRows, { select: "id" });
    const aggregateUpdates = buildOrderAggregateUpdates(organization.id, orderRows);
    for (const aggregate of aggregateUpdates) {
      const { error } = await supabase
        .from("account")
        .update({
          last_order_date: aggregate.last_order_date,
          customer_since_date: aggregate.customer_since_date,
        })
        .eq("organization_id", aggregate.organization_id)
        .eq("id", aggregate.account_id);

      if (error) {
        throw new Error(`account:order-aggregate:${aggregate.account_id}: ${error.message}`);
      }
    }

    const boundaryRows = rows.territories.map((territory) => ({
      organization_id: organization.id,
      name: territory.name,
      description: territory.description ?? null,
      color: territory.color ?? "#ef4444",
      border_width: territory.borderWidth ?? 2,
      is_visible_by_default: territory.isVisibleByDefault ?? true,
      geojson: territory.geojson ?? {},
      custom_fields: compactObject({
        legacyTerritoryId: territory.id,
        legacyOrgId: territory.orgId,
        createdByEmail: territory.createdByEmail,
        updatedByEmail: territory.updatedByEmail,
      }),
    }));
    const insertedBoundaries = await insertChunks(supabase, "territory_boundary", boundaryRows, { select: "id" });

    const markerRows = rows.markers.map((marker) => ({
      organization_id: organization.id,
      name: marker.name,
      description: marker.description ?? null,
      marker_type: marker.kind ?? "custom",
      address: marker.address ?? null,
      latitude: marker.lat,
      longitude: marker.lng,
      color: marker.color ?? "#0f172a",
      icon: marker.kind === "home" ? "home" : "marker",
      is_visible_by_default: marker.isVisibleByDefault ?? true,
      custom_fields: compactObject({
        legacyMarkerId: marker.id,
        legacyOrgId: marker.orgId,
        createdByEmail: marker.createdByEmail,
        updatedByEmail: marker.updatedByEmail,
      }),
    }));
    const insertedMarkers = await insertChunks(supabase, "territory_marker", markerRows, { select: "id" });

    const runtimeCounts = await collectSupabaseRuntimeCounts();

    console.log(
      JSON.stringify(
        {
          org,
          mode: "apply",
          inserted: {
            accounts: insertedAccounts.length,
            identities: insertedIdentities.length,
            contacts: insertedContacts.length,
            activities: insertedActivities.length,
            orders: insertedOrders.length,
            territoryBoundaries: insertedBoundaries.length,
            territoryMarkers: insertedMarkers.length,
          },
          runtimeCounts,
        },
        null,
        2,
      ),
    );
  } finally {
    await legacy.end();
  }
}

async function runMigrationDryRun(org) {
  const legacyCounts = await collectLegacyNeonCounts();
  const runtimeCounts = await collectSupabaseRuntimeCounts();

  console.log(
    JSON.stringify(
      {
        org,
        mode: "read-only",
        legacyNeonCounts: legacyCounts,
        supabaseRuntimeCounts: runtimeCounts,
        interpretation:
          "This dry-run verifies source/target connectivity and row-count visibility. It does not transform or write legacy rows yet.",
      },
      null,
      2,
    ),
  );
}

async function main() {
  const [scope, action, org, ...args] = process.argv.slice(2);

  if (!scope || !action) {
    usage();
    process.exit(1);
  }

  if (scope === "health" && action === "check") {
    const targetOrg = org?.trim() || process.env.ORG_SLUG?.trim() || "unknown";
    const envChecks = collectEnvChecks();
    const fileChecks = targetOrg === "unknown" ? [] : collectTenantFileChecks(targetOrg);
    const runtimeChecks = await checkRuntimeHealth();
    const checks = [...envChecks, ...fileChecks, ...runtimeChecks];
    printResults(`Health check for ${targetOrg}`, checks);
    exitFromChecks(checks);
  }

  if (scope === "sync" && action === "live") {
    if (!org) {
      console.error("Organization slug is required for live sync");
      process.exit(1);
    }

    const { runLiveSync } = await import("./live-sync.mjs");
    await runLiveSync(org, args);
    process.exit(0);
  }

  if (scope === "migration" && (action === "apply" || action === "dry-run" || action === "validate")) {
    if (!org) {
      console.error("Organization slug is required for migration commands");
      process.exit(1);
    }

    const fileChecks = collectTenantFileChecks(org);
    const envChecks = collectEnvChecks();
    const checks = [...fileChecks, ...envChecks];

    if (action === "validate") {
      const todoChecks = collectTodoChecks(org);
      const evidenceChecks = collectMigrationEvidenceChecks(org);
      const allChecks = [...checks, ...todoChecks, ...evidenceChecks];
      printResults(`Migration validate for ${org}`, allChecks);
      exitFromChecks(allChecks);
    }

    if (action === "apply") {
      printResults(`Migration apply preflight for ${org}`, checks);
      if (!checks.every((check) => check.ok)) {
        process.exit(1);
      }

      await runMigrationApply(org);
      process.exit(0);
    }

    printResults(`Migration dry-run for ${org}`, checks);
    if (!checks.every((check) => check.ok)) {
      process.exit(1);
    }

    await runMigrationDryRun(org);
    process.exit(0);
  }

  usage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
