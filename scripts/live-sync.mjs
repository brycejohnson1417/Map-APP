const DEFAULT_NABIS_API_BASE_URL = "https://platform-api.nabis.pro/v2";
const NOTION_DATA_SOURCE_VERSION = "2025-09-03";
const NOTION_DATABASE_VERSION = "2022-06-28";
const NOTION_PAGE_SIZE = 100;
const NABIS_PAGE_SIZE = 500;
const SUPABASE_PAGE_SIZE = 1_000;
const NABIS_PAGE_DELAY_MS = 750;
const NABIS_MAX_RETRIES = 5;

class ProviderRequestError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ProviderRequestError";
    this.status = status;
    this.body = body;
  }
}

function parseBooleanArg(args, name) {
  return args.includes(name);
}

function parseValueArg(args, name) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(name);
  if (index >= 0) {
    return args[index + 1];
  }

  return null;
}

function parseLiveSyncOptions(args) {
  const explicitScopes = new Set();
  for (const scope of ["companies", "contacts", "orders"]) {
    if (parseBooleanArg(args, `--${scope}`)) {
      explicitScopes.add(scope);
    }
  }

  if (parseBooleanArg(args, "--notion-only")) {
    explicitScopes.add("companies");
    explicitScopes.add("contacts");
  }

  if (parseBooleanArg(args, "--nabis-only")) {
    explicitScopes.add("orders");
  }

  const limitRaw = parseValueArg(args, "--limit");
  const limit = limitRaw ? Number(limitRaw) : null;
  if (limitRaw && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer");
  }

  const from = parseValueArg(args, "--from");
  if (from && Number.isNaN(new Date(from).getTime())) {
    throw new Error("--from must be an ISO date or timestamp");
  }

  const scopes = explicitScopes.size ? explicitScopes : new Set(["companies", "contacts", "orders"]);

  return {
    dryRun: parseBooleanArg(args, "--dry-run"),
    noDiscovery: parseBooleanArg(args, "--no-discovery"),
    limit,
    from,
    scopes,
  };
}

function requiredEnv(key) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
}

function optionalJsonArray(raw) {
  if (!raw?.trim()) {
    return [];
  }

  for (const candidate of [raw, raw.replaceAll('\\"', '"')]) {
    try {
      const parsed = JSON.parse(candidate);
      return Array.isArray(parsed) ? parsed.map(cleanConfiguredId).filter(Boolean) : [];
    } catch {
      // Try the next normalization, then fall back to comma parsing.
    }
  }

  return raw
    .replaceAll('\\"', '"')
    .split(",")
    .map(cleanConfiguredId)
    .filter(Boolean);
}

function cleanConfiguredId(value) {
  return String(value ?? "")
    .trim()
    .replaceAll("\\", "")
    .replace(/^[\s"'[]+|[\s"'\]]+$/g, "");
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== ""));
}

function toIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toDateOnly(value) {
  const iso = toIso(value);
  return iso ? iso.slice(0, 10) : null;
}

function normalizeIdentifier(value) {
  return String(value ?? "").trim();
}

function normalizeName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|llc|inc|co|company|cannabis|dispensary)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return email.includes("@") ? email : "";
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D+/g, "");
  if (!digits) {
    return "";
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

function numberValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
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

async function fetchAllRows(supabase, table, select, apply = (query) => query) {
  const rows = [];
  for (let offset = 0; ; offset += SUPABASE_PAGE_SIZE) {
    const request = apply(supabase.from(table).select(select).range(offset, offset + SUPABASE_PAGE_SIZE - 1));
    const { data, error } = await request;
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    rows.push(...(data ?? []));
    if (!data || data.length < SUPABASE_PAGE_SIZE) {
      return rows;
    }
  }
}

async function getOrganizationOrThrow(supabase, orgSlug) {
  const { data, error } = await supabase.from("organization").select("*").eq("slug", orgSlug).single();
  if (error) {
    throw new Error(`organization:${orgSlug}: ${error.message}`);
  }

  return data;
}

async function getIntegration(supabase, organizationId, provider) {
  const { data, error } = await supabase
    .from("integration_installation")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`integration:${provider}: ${error.message}`);
  }

  return data;
}

async function createSyncJob(supabase, organizationId, payload) {
  const { data, error } = await supabase
    .from("sync_job")
    .insert({
      organization_id: organizationId,
      kind: "reconciliation",
      status: "running",
      payload,
      attempts: 1,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`sync_job:create:${error.message}`);
  }

  return data;
}

async function finishSyncJob(supabase, jobId, status, lastError = null) {
  if (!jobId) {
    return;
  }

  const { error } = await supabase
    .from("sync_job")
    .update({
      status,
      last_error: lastError,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(`sync_job:finish:${error.message}`);
  }
}

async function recordAuditEvent(supabase, organizationId, eventType, payload) {
  const { error } = await supabase.from("audit_event").insert({
    organization_id: organizationId,
    event_type: eventType,
    entity_type: "live_sync",
    entity_id: payload.scope ?? "live",
    payload,
  });

  if (error) {
    throw new Error(`audit_event:${error.message}`);
  }
}

async function updateSyncCursor(supabase, input) {
  if (input.dryRun) {
    return;
  }

  const now = new Date().toISOString();
  const row = {
    organization_id: input.organizationId,
    installation_id: input.installationId ?? null,
    provider: input.provider,
    scope: input.scope,
    cursor_payload: input.cursorPayload ?? {},
    status: input.status,
    last_attempted_sync_at: now,
    last_successful_sync_at: input.status === "success" ? now : null,
    last_error: input.lastError ?? null,
    updated_at: now,
  };

  const { error } = await supabase
    .from("sync_cursor")
    .upsert(row, { onConflict: "organization_id,provider,scope" });

  if (error) {
    throw new Error(`sync_cursor:${input.provider}:${input.scope}:${error.message}`);
  }
}

class NotionClient {
  constructor(token) {
    this.token = token;
  }

  async request(path, { body = {}, version = NOTION_DATA_SOURCE_VERSION } = {}) {
    const response = await fetch(`https://api.notion.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Notion-Version": version,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new ProviderRequestError(`Notion ${response.status} for ${path}`, response.status, parsed);
    }

    return parsed;
  }

  async querySourcePage(sourceId, body, filterProperties) {
    const runQuery = async (properties) => {
      const query = new URLSearchParams();
      for (const property of properties) {
        query.append("filter_properties[]", property);
      }

      const suffix = query.toString() ? `?${query.toString()}` : "";
      try {
        return await this.request(`/v1/data_sources/${sourceId}/query${suffix}`, {
          body,
          version: NOTION_DATA_SOURCE_VERSION,
        });
      } catch (error) {
        if (!(error instanceof ProviderRequestError) || ![400, 404].includes(error.status)) {
          throw error;
        }

        return this.request(`/v1/databases/${sourceId}/query${suffix}`, {
          body,
          version: NOTION_DATABASE_VERSION,
        });
      }
    };

    try {
      return await runQuery(filterProperties);
    } catch (error) {
      const message = error instanceof ProviderRequestError ? String(error.body?.message ?? "") : "";
      if (filterProperties.length && message.includes("filter_properties")) {
        return runQuery([]);
      }

      throw error;
    }
  }

  async queryAllPages(sourceId, { limit = null, filterProperties = [] } = {}) {
    const pages = [];
    let startCursor = null;

    do {
      const body = {
        page_size: Math.min(NOTION_PAGE_SIZE, limit ? Math.max(limit - pages.length, 1) : NOTION_PAGE_SIZE),
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      };
      if (startCursor) {
        body.start_cursor = startCursor;
      }

      const payload = await this.querySourcePage(sourceId, body, filterProperties);
      pages.push(...(payload.results ?? []).filter((entry) => entry.object === "page"));
      startCursor = payload.has_more ? payload.next_cursor : null;
    } while (startCursor && (!limit || pages.length < limit));

    return limit ? pages.slice(0, limit) : pages;
  }

  async searchDatabaseId(query) {
    const payload = await this.request("/v1/search", {
      version: NOTION_DATABASE_VERSION,
      body: {
        query,
        page_size: 10,
        filter: {
          property: "object",
          value: "database",
        },
      },
    });
    const normalizedQuery = normalizeName(query);
    const results = payload.results ?? [];
    const database =
      results.find((result) => normalizeName(readNotionTitle(result.title)) === normalizedQuery) ??
      results.find((result) => normalizeName(readNotionTitle(result.title)).includes("contact")) ??
      null;
    return database?.id ?? null;
  }
}

class NabisClient {
  constructor(apiKey, baseUrl, ordersPath = "/ny/order") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.ordersPath = ordersPath.startsWith("/") ? ordersPath : `/${ordersPath}`;
  }

  async fetchOrders({ limit = null, from = null } = {}) {
    const rows = [];
    for (let page = 0; ; page += 1) {
      const url = new URL(`${this.baseUrl}${this.ordersPath}`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", String(NABIS_PAGE_SIZE));
      if (from) {
        url.searchParams.set("startUpdatedAt", toDateOnly(from) ?? from);
      }

      const payload = await this.fetchPageWithRetry(url);

      const pageRows = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
      rows.push(...pageRows);
      if (limit && rows.length >= limit) {
        return rows.slice(0, limit);
      }

      const totalPages = Number(payload.totalNumPages);
      const nextPage = payload.nextPage;
      if (!pageRows.length || nextPage === null || (Number.isFinite(totalPages) && page >= totalPages)) {
        return rows;
      }

      await sleep(NABIS_PAGE_DELAY_MS);
    }
  }

  async fetchPageWithRetry(url) {
    for (let attempt = 0; attempt <= NABIS_MAX_RETRIES; attempt += 1) {
      const response = await fetch(url, {
        headers: {
          "x-nabis-access-token": this.apiKey,
          "User-Agent": "map-app-live-sync/0.1",
        },
        signal: AbortSignal.timeout(65_000),
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};

      if (response.ok) {
        return payload;
      }

      if (response.status !== 429 || attempt === NABIS_MAX_RETRIES) {
        throw new ProviderRequestError(`Nabis ${response.status} for ${url.pathname}`, response.status, payload);
      }

      const retryAfter = Number(response.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1_000 : 2_000 * 2 ** attempt;
      await sleep(delay);
    }

    throw new ProviderRequestError(`Nabis retry exhausted for ${url.pathname}`, 429, {});
  }
}

function readNotionTitle(title) {
  if (!Array.isArray(title)) {
    return null;
  }

  return title.map((entry) => entry.plain_text ?? entry.text?.content ?? "").join("").trim() || null;
}

function readPlainTextArray(items) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.map((entry) => entry.plain_text ?? entry.text?.content ?? "").join("").trim() || null;
}

function readNotionProperty(property) {
  if (!property || typeof property !== "object") {
    return null;
  }

  switch (property.type) {
    case "title":
      return readPlainTextArray(property.title);
    case "rich_text":
      return readPlainTextArray(property.rich_text);
    case "select":
      return property.select?.name ?? null;
    case "status":
      return property.status?.name ?? null;
    case "multi_select":
      return Array.isArray(property.multi_select) ? property.multi_select.map((entry) => entry.name).filter(Boolean) : [];
    case "people":
      return Array.isArray(property.people) ? property.people.map((entry) => entry.name ?? entry.person?.email).filter(Boolean) : [];
    case "email":
      return property.email ?? null;
    case "phone_number":
      return property.phone_number ?? null;
    case "url":
      return property.url ?? null;
    case "number":
      return property.number ?? null;
    case "checkbox":
      return Boolean(property.checkbox);
    case "date":
      return property.date?.start ?? null;
    case "formula":
      return readFormulaValue(property.formula);
    case "rollup":
      return readRollupValue(property.rollup);
    case "relation":
      return Array.isArray(property.relation) ? property.relation.map((entry) => entry.id).filter(Boolean) : [];
    case "created_time":
      return property.created_time ?? null;
    case "last_edited_time":
      return property.last_edited_time ?? null;
    default:
      return property[property.type] ?? null;
  }
}

function readFormulaValue(formula) {
  if (!formula) {
    return null;
  }

  if (formula.type === "string") {
    return formula.string ?? null;
  }
  if (formula.type === "number") {
    return formula.number ?? null;
  }
  if (formula.type === "boolean") {
    return Boolean(formula.boolean);
  }
  if (formula.type === "date") {
    return formula.date?.start ?? null;
  }

  return null;
}

function readRollupValue(rollup) {
  if (!rollup) {
    return null;
  }

  if (rollup.type === "number") {
    return rollup.number ?? null;
  }
  if (rollup.type === "date") {
    return rollup.date?.start ?? null;
  }
  if (rollup.type === "array") {
    const values = rollup.array?.map(readNotionProperty).filter((value) => value !== null && value !== undefined) ?? [];
    return values.length === 1 ? values[0] : values;
  }

  return null;
}

function readProperty(page, aliases) {
  const properties = page.properties ?? {};
  for (const alias of aliases) {
    if (properties[alias]) {
      return properties[alias];
    }
  }

  const normalizedAliases = new Set(aliases.map((alias) => alias.toLowerCase()));
  const match = Object.entries(properties).find(([key]) => normalizedAliases.has(key.toLowerCase()));
  return match?.[1] ?? null;
}

function readPropertyValue(page, aliases) {
  return readNotionProperty(readProperty(page, aliases));
}

function readText(page, aliases) {
  const value = readPropertyValue(page, aliases);
  if (Array.isArray(value)) {
    return value.join(", ").trim() || null;
  }

  return value === null || value === undefined ? null : String(value).trim() || null;
}

function readPeople(page, aliases) {
  const value = readPropertyValue(page, aliases);
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }

  return value ? uniqueStrings([value]) : [];
}

function readRelationIds(page, aliases) {
  const property = readProperty(page, aliases);
  if (!property || property.type !== "relation" || !Array.isArray(property.relation)) {
    return [];
  }

  return property.relation.map((entry) => entry.id).filter(Boolean);
}

function summarizeNotionPage(page) {
  return {
    id: page.id,
    url: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    properties: Object.fromEntries(
      Object.entries(page.properties ?? {}).map(([key, property]) => [key, readNotionProperty(property)]),
    ),
  };
}

function parseMapLocation(value) {
  if (!value || typeof value !== "object") {
    return { latitude: null, longitude: null };
  }

  const latitude = numberValue(value.latitude ?? value.lat);
  const longitude = numberValue(value.longitude ?? value.lng ?? value.lon);
  return { latitude, longitude };
}

function mapCompanyPage(organizationId, page) {
  const name = firstValue(
    readText(page, ["Dispensary Name", "Name", "Company", "Account"]),
    page.id,
  );
  const nabisRetailerId = normalizeIdentifier(readText(page, ["Nabis Retailer ID", "Nabis RetailerId", "Retailer ID"]));
  const licensedLocationId = normalizeIdentifier(readText(page, ["Licensed Location ID", "LicensedLocationId"]));
  const licenseNumber = normalizeIdentifier(readText(page, ["License Number", "License", "siteLicenseNumber"]));
  const mapLocation = parseMapLocation(readPropertyValue(page, ["Map Location"]));
  const primaryContact = {
    name: readText(page, ["Contact", "Primary Contact", "CRM Contact"]),
    email: readText(page, ["Contact Email", "Email", "CRM Contact Email"]),
    phone: readText(page, ["Contact Phone", "Phone", "CRM Contact Phone"]),
  };

  return {
    sourcePageId: page.id,
    sourceLastEditedAt: page.last_edited_time ?? null,
    nabisRetailerId,
    licensedLocationId,
    licenseNumber,
    primaryContact,
    row: compactObject({
      organization_id: organizationId,
      name,
      display_name: name,
      account_status: readText(page, ["Account Status", "Status"]),
      lead_status: readText(page, ["Lead Status", "Pin Kind"]),
      referral_source: readText(page, ["Referral Source", "Lead Source", "Source"]),
      vendor_day_status: readText(page, ["Vendor Day Status"]),
      licensed_location_id: licensedLocationId,
      license_number: licenseNumber,
      address_line_1: readText(page, ["Address 1", "Address", "Street Address"]),
      city: readText(page, ["City"]),
      state: readText(page, ["State"]) ?? "NY",
      postal_code: readText(page, ["Zipcode", "Zip Code", "Postal Code"]),
      latitude: mapLocation.latitude,
      longitude: mapLocation.longitude,
      sales_rep_names: readPeople(page, ["Rep", "PICC Rep", "Sales Rep"]),
      account_manager_names: readPeople(page, ["Account Manager", "Manager"]),
      last_contacted_at: toDateOnly(readPropertyValue(page, ["Last Contacted"])),
      last_sample_order_date: toDateOnly(readPropertyValue(page, ["Last Sample Order Date", "Sample Order Date", "Last Sample Date"])),
      last_sample_delivery_date: toDateOnly(readPropertyValue(page, ["Last Sample Delivery Date", "Sample Delivery Date", "Last Sample Delivered Date"])),
      last_order_date: toDateOnly(readPropertyValue(page, ["Last Order Date", "Most Recent Order Date"])),
      customer_since_date: toDateOnly(readPropertyValue(page, ["Customer Since"])),
      crm_updated_at: toIso(page.last_edited_time),
      external_updated_at: toIso(page.last_edited_time),
      custom_fields: compactObject({
        notionPageId: page.id,
        nabisRetailerId,
        fullAddress: readText(page, ["Full Address"]),
        followUpDate: toDateOnly(readPropertyValue(page, ["Follow Up Date"])),
        followUpNeeded: readPropertyValue(page, ["Follow Up Needed"]),
        followUpReason: readText(page, ["Follow Up Reason"]),
        daysOverdue: numberValue(readPropertyValue(page, ["Days Overdue"])),
        piccCreditStatus: readText(page, ["PICC Credit Status"]),
        pppStatus: readText(page, ["PPP Status"]),
        headsetConnection: readText(page, ["Headset Connection"]),
        primaryContactName: primaryContact.name,
        primaryContactEmail: primaryContact.email,
        primaryContactPhone: primaryContact.phone,
      }),
      source_payload: {
        source: "notion.company",
        notion: summarizeNotionPage(page),
      },
    }),
  };
}

function mapEmbeddedContact(organizationId, company, accountId) {
  const fullName = firstValue(company.primaryContact.name, company.primaryContact.email?.split("@")[0], company.primaryContact.phone);
  if (!fullName && !company.primaryContact.email && !company.primaryContact.phone) {
    return null;
  }

  const embeddedKey = `${company.sourcePageId}:primary-contact`;
  return {
    notionPageId: null,
    embeddedKey,
    accountId,
    row: compactObject({
      organization_id: organizationId,
      account_id: accountId,
      full_name: fullName ?? "Primary contact",
      email: company.primaryContact.email,
      phone: company.primaryContact.phone,
      role: "primary_contact",
      custom_fields: compactObject({
        notionCompanyPageId: company.sourcePageId,
        notionEmbeddedContactKey: embeddedKey,
        source: "notion.company.embedded_contact",
        normalizedPhone: normalizePhone(company.primaryContact.phone),
      }),
      source_payload: {
        source: "notion.company.embedded_contact",
        notionCompanyPageId: company.sourcePageId,
      },
    }),
  };
}

function mapContactPage(organizationId, page, accountId) {
  const fullName = firstValue(
    readText(page, ["Name", "Contact Name", "Full Name", "Contact"]),
    readText(page, ["Email", "Contact Email"])?.split("@")[0],
    page.id,
  );

  return {
    notionPageId: page.id,
    embeddedKey: null,
    accountId,
    accountNotionPageIds: readRelationIds(page, [
      "Company",
      "Companies",
      "Dispensary",
      "Dispensary Master List CRM",
      "Account",
      "Accounts",
      "Licensed Location",
    ]),
    accountName: readText(page, ["Company Name", "Dispensary Name", "Account Name"]),
    licensedLocationId: normalizeIdentifier(readText(page, ["Licensed Location ID", "LicensedLocationId"])),
    nabisRetailerId: normalizeIdentifier(readText(page, ["Nabis Retailer ID", "Retailer ID"])),
    row: compactObject({
      organization_id: organizationId,
      account_id: accountId,
      full_name: fullName,
      title: readText(page, ["Title", "Role Title", "Job Title"]),
      email: readText(page, ["Email", "Contact Email"]),
      phone: readText(page, ["Phone", "Phone Number", "Contact Phone"]),
      role: readText(page, ["Role", "Contact Role", "Type"]),
      custom_fields: compactObject({
        notionPageId: page.id,
        normalizedPhone: normalizePhone(readText(page, ["Phone", "Phone Number", "Contact Phone"])),
      }),
      source_payload: {
        source: "notion.contact",
        notion: summarizeNotionPage(page),
      },
    }),
  };
}

function indexAccount(indexes, account) {
  indexes.byId.set(account.id, account);
  const notionPageId = normalizeIdentifier(account.custom_fields?.notionPageId);
  const nabisRetailerId = normalizeIdentifier(account.custom_fields?.nabisRetailerId);
  const licensedLocationId = normalizeIdentifier(account.licensed_location_id);
  const licenseNumber = normalizeIdentifier(account.license_number);

  if (notionPageId) {
    indexes.byNotionPageId.set(notionPageId, account);
  }
  if (nabisRetailerId) {
    indexes.byNabisRetailerId.set(nabisRetailerId, account);
  }
  if (licensedLocationId) {
    indexes.byLicensedLocationId.set(licensedLocationId, account);
  }
  if (licenseNumber) {
    indexes.byLicenseNumber.set(licenseNumber, account);
  }

  const nameKey = normalizeName(account.display_name ?? account.name);
  if (nameKey && !indexes.byName.has(nameKey)) {
    indexes.byName.set(nameKey, account);
  }
}

function buildAccountIndexes(accounts, identities) {
  const indexes = {
    byId: new Map(),
    byNotionPageId: new Map(),
    byNabisRetailerId: new Map(),
    byLicensedLocationId: new Map(),
    byLicenseNumber: new Map(),
    byName: new Map(),
  };

  for (const account of accounts) {
    indexAccount(indexes, account);
  }

  for (const identity of identities) {
    const account = indexes.byId.get(identity.account_id);
    if (!account || identity.external_entity_type !== "account") {
      continue;
    }

    const externalId = normalizeIdentifier(identity.external_id);
    if (!externalId) {
      continue;
    }

    if (identity.provider === "notion") {
      indexes.byNotionPageId.set(externalId, account);
    } else if (identity.provider === "nabis") {
      indexes.byNabisRetailerId.set(externalId, account);
    } else if (identity.metadata?.identityType === "LICENSED_LOCATION_ID") {
      indexes.byLicensedLocationId.set(externalId, account);
    } else if (identity.metadata?.identityType === "LICENSE_NUMBER") {
      indexes.byLicenseNumber.set(externalId, account);
    }
  }

  return indexes;
}

function findAccountForCompany(company, indexes) {
  return (
    indexes.byNotionPageId.get(company.sourcePageId) ??
    (company.nabisRetailerId ? indexes.byNabisRetailerId.get(company.nabisRetailerId) : null) ??
    (company.licensedLocationId ? indexes.byLicensedLocationId.get(company.licensedLocationId) : null) ??
    (company.licenseNumber ? indexes.byLicenseNumber.get(company.licenseNumber) : null) ??
    null
  );
}

function findAccountForContact(contact, indexes) {
  for (const notionPageId of contact.accountNotionPageIds ?? []) {
    const account = indexes.byNotionPageId.get(notionPageId);
    if (account) {
      return account;
    }
  }

  return (
    (contact.nabisRetailerId ? indexes.byNabisRetailerId.get(contact.nabisRetailerId) : null) ??
    (contact.licensedLocationId ? indexes.byLicensedLocationId.get(contact.licensedLocationId) : null) ??
    (contact.accountName ? indexes.byName.get(normalizeName(contact.accountName)) : null) ??
    null
  );
}

function findAccountForOrder(order, indexes) {
  return (
    (order.nabisRetailerId ? indexes.byNabisRetailerId.get(order.nabisRetailerId) : null) ??
    (order.licensedLocationId ? indexes.byLicensedLocationId.get(order.licensedLocationId) : null) ??
    (order.licenseNumber ? indexes.byLicenseNumber.get(order.licenseNumber) : null) ??
    (order.retailerName ? indexes.byName.get(normalizeName(order.retailerName)) : null) ??
    null
  );
}

async function loadRuntimeState(supabase, organizationId) {
  const [accounts, identities, contacts] = await Promise.all([
    fetchAllRows(
      supabase,
      "account",
      "id,name,display_name,licensed_location_id,license_number,last_order_date,customer_since_date,custom_fields",
      (query) => query.eq("organization_id", organizationId).order("created_at", { ascending: true }),
    ),
    fetchAllRows(
      supabase,
      "account_identity",
      "id,account_id,provider,external_entity_type,external_id,metadata",
      (query) => query.eq("organization_id", organizationId).order("created_at", { ascending: true }),
    ),
    fetchAllRows(
      supabase,
      "contact",
      "id,account_id,full_name,email,phone,custom_fields",
      (query) => query.eq("organization_id", organizationId).order("created_at", { ascending: true }),
    ),
  ]);

  return { accounts, identities, contacts };
}

function buildContactIndexes(contacts) {
  const indexes = {
    byNotionPageId: new Map(),
    byEmbeddedKey: new Map(),
    byAccountEmail: new Map(),
    byAccountName: new Map(),
  };

  for (const contact of contacts) {
    indexContact(indexes, contact);
  }

  return indexes;
}

function indexContact(indexes, contact) {
  const notionPageId = normalizeIdentifier(contact.custom_fields?.notionPageId);
  const embeddedKey = normalizeIdentifier(contact.custom_fields?.notionEmbeddedContactKey);
  const accountKey = contact.account_id ?? "no-account";
  const email = normalizeEmail(contact.email);
  const name = normalizeName(contact.full_name);

  if (notionPageId) {
    indexes.byNotionPageId.set(notionPageId, contact);
  }
  if (embeddedKey) {
    indexes.byEmbeddedKey.set(embeddedKey, contact);
  }
  if (email) {
    indexes.byAccountEmail.set(`${accountKey}|${email}`, contact);
  }
  if (name) {
    indexes.byAccountName.set(`${accountKey}|${name}`, contact);
  }
}

function findContact(contact, indexes) {
  const accountKey = contact.row.account_id ?? "no-account";
  const notionPageId = normalizeIdentifier(contact.notionPageId);
  const embeddedKey = normalizeIdentifier(contact.embeddedKey);
  const email = normalizeEmail(contact.row.email);
  const name = normalizeName(contact.row.full_name);

  return (
    (notionPageId ? indexes.byNotionPageId.get(notionPageId) : null) ??
    (embeddedKey ? indexes.byEmbeddedKey.get(embeddedKey) : null) ??
    (email ? indexes.byAccountEmail.get(`${accountKey}|${email}`) : null) ??
    (name ? indexes.byAccountName.get(`${accountKey}|${name}`) : null) ??
    null
  );
}

function buildIdentityRows(organizationId, accountId, company) {
  const rows = [];
  const add = (provider, externalId, metadata) => {
    const normalized = normalizeIdentifier(externalId);
    if (!normalized) {
      return;
    }

    rows.push({
      organization_id: organizationId,
      account_id: accountId,
      provider,
      external_entity_type: "account",
      external_id: normalized,
      match_method: "deterministic",
      match_confidence: 1,
      metadata,
      updated_at: new Date().toISOString(),
    });
  };

  add("notion", company.sourcePageId, { identityType: "NOTION_PAGE_ID", source: "notion.company" });
  add("nabis", company.nabisRetailerId, { identityType: "NABIS_RETAILER_ID", source: "notion.company" });
  add("csv_import", company.licensedLocationId, { identityType: "LICENSED_LOCATION_ID", source: "notion.company" });
  add("csv_import", company.licenseNumber, { identityType: "LICENSE_NUMBER", source: "notion.company" });
  return rows;
}

async function upsertAccountIdentities(supabase, rows, dryRun) {
  if (dryRun || !rows.length) {
    return 0;
  }

  const { error } = await supabase
    .from("account_identity")
    .upsert(rows, { onConflict: "organization_id,provider,external_entity_type,external_id" });

  if (error) {
    throw new Error(`account_identity:upsert:${error.message}`);
  }

  return rows.length;
}

async function writeAccount(supabase, company, existing, dryRun) {
  if (dryRun) {
    return {
      id: existing?.id ?? `dry-run:${company.sourcePageId}`,
      ...existing,
      ...company.row,
    };
  }

  const now = new Date().toISOString();
  if (existing) {
    const { data, error } = await supabase
      .from("account")
      .update({ ...company.row, updated_at: now })
      .eq("organization_id", company.row.organization_id)
      .eq("id", existing.id)
      .select("id,name,display_name,licensed_location_id,license_number,last_order_date,customer_since_date,custom_fields")
      .single();

    if (error) {
      throw new Error(`account:update:${company.sourcePageId}:${error.message}`);
    }

    return data;
  }

  const { data, error } = await supabase
    .from("account")
    .insert({ ...company.row, created_at: now, updated_at: now })
    .select("id,name,display_name,licensed_location_id,license_number,last_order_date,customer_since_date,custom_fields")
    .single();

  if (error) {
    throw new Error(`account:insert:${company.sourcePageId}:${error.message}`);
  }

  return data;
}

async function findContactAfterUniqueConflict(supabase, contact) {
  const accountId = contact.row.account_id ?? null;
  const email = normalizeEmail(contact.row.email);
  const name = normalizeName(contact.row.full_name);

  if (!email && !name) {
    return null;
  }

  let query = supabase
    .from("contact")
    .select("id,account_id,full_name,email,phone,custom_fields")
    .eq("organization_id", contact.row.organization_id);

  query = accountId ? query.eq("account_id", accountId) : query.is("account_id", null);
  query = email ? query.not("email", "is", null) : query.is("email", null);

  const { data, error } = await query.limit(100);
  if (error) {
    throw new Error(`contact:conflict-lookup:${contact.notionPageId ?? contact.embeddedKey}:${error.message}`);
  }

  return (data ?? []).find((row) => {
    if (email) {
      return normalizeEmail(row.email) === email;
    }

    return normalizeName(row.full_name) === name;
  }) ?? null;
}

async function updateExistingContact(supabase, contact, existing) {
  const now = new Date().toISOString();
  const mergedCustomFields = compactObject({
    ...existing.custom_fields,
    ...contact.row.custom_fields,
  });
  const { data, error } = await supabase
    .from("contact")
    .update({ ...contact.row, custom_fields: mergedCustomFields, updated_at: now })
    .eq("organization_id", contact.row.organization_id)
    .eq("id", existing.id)
    .select("id,account_id,full_name,email,phone,custom_fields")
    .single();

  if (error) {
    throw new Error(`contact:update:${contact.notionPageId ?? contact.embeddedKey}:${error.message}`);
  }

  return data;
}

async function insertContact(supabase, contact) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("contact")
    .insert({ ...contact.row, created_at: now, updated_at: now })
    .select("id,account_id,full_name,email,phone,custom_fields")
    .single();

  return { data, error };
}

async function writeContact(supabase, contact, existing, dryRun) {
  if (dryRun) {
    return {
      id: existing?.id ?? `dry-run:${contact.notionPageId ?? contact.embeddedKey}`,
      ...existing,
      ...contact.row,
    };
  }

  if (existing) {
    return updateExistingContact(supabase, contact, existing);
  }

  const { data, error } = await insertContact(supabase, contact);
  if (error?.code === "23505") {
    const conflictExisting = await findContactAfterUniqueConflict(supabase, contact);
    if (conflictExisting) {
      return updateExistingContact(supabase, contact, conflictExisting);
    }
  }

  if (error) {
    throw new Error(`contact:insert:${contact.notionPageId ?? contact.embeddedKey}:${error.message}`);
  }

  return data;
}

function collapseNabisOrderRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const externalOrderId = normalizeIdentifier(row.id ?? row.orderId ?? row.order ?? row.orderNumber);
    if (!externalOrderId) {
      continue;
    }

    const group = groups.get(externalOrderId) ?? [];
    group.push(row);
    groups.set(externalOrderId, group);
  }

  return [...groups.entries()].map(([externalOrderId, orderRows]) => {
    const first = orderRows[0] ?? {};
    const lineSubtotal = orderRows.reduce((total, row) => total + (numberValue(row.lineItemSubtotal) ?? 0), 0);
    const orderTotal = firstValue(
      numberValue(first.orderTotal),
      numberValue(first.total),
      numberValue(first.orderSubtotal),
      lineSubtotal || null,
    );
    const nabisRetailerId = normalizeIdentifier(first.retailerId ?? first.externalRetailerId);
    const licensedLocationId = normalizeIdentifier(first.licensedLocationId);
    const licenseNumber = normalizeIdentifier(first.siteLicenseNumber);
    const retailerName = firstValue(first.retailer, first.licensedLocationName, first.retailerParentOrganization);

    return {
      externalOrderId,
      nabisRetailerId,
      licensedLocationId,
      licenseNumber,
      retailerName,
      row: {
        provider: "nabis",
        external_order_id: externalOrderId,
        order_number: firstValue(first.orderNumber, first.order, first.orderName, first.posoNumber)?.toString() ?? null,
        licensed_location_id: licensedLocationId || null,
        nabis_retailer_id: nabisRetailerId || null,
        licensed_location_name: retailerName ?? null,
        status: first.status ?? null,
        payment_status: first.paymentStatus ?? null,
        order_total: orderTotal,
        order_created_at: toIso(first.createdTimestamp ?? first.createdDate),
        delivery_date: toDateOnly(first.deliveryDate),
        sales_rep_name: firstValue(first.soldBy, first.salesRep, first.creator),
        is_internal_transfer: String(first.orderAction ?? first.action ?? "").toUpperCase() === "INTERNAL_TRANSFER",
        source_payload: {
          source: "nabis.order",
          nabis: {
            order: first,
            lineItemCount: orderRows.length,
            lineItems: orderRows.map((row) =>
              compactObject({
                lineItemId: row.lineItemId,
                skuCode: row.skuCode,
                skuName: row.skuName,
                skuDisplayName: row.skuDisplayName,
                brandName: row.brandName,
                strain: row.strain,
                sample: row.sample,
                isSampleDemo: row.isSampleDemo,
                lineItemIsSample: row.lineItemIsSample,
                units: row.units,
                pricePerUnit: row.pricePerUnit,
                lineItemPricePerUnitAfterDiscount: row.lineItemPricePerUnitAfterDiscount,
                skuPricePerUnit: row.skuPricePerUnit,
                lineItemSubtotal: row.lineItemSubtotal,
                lineItemSubtotalAfterDiscount: row.lineItemSubtotalAfterDiscount,
                taxInclusiveLineItemSubtotal: row.taxInclusiveLineItemSubtotal,
                skuTotalPrice: row.skuTotalPrice,
                wholesaleValue: row.wholesaleValue,
                lineItemWholesaleValue: row.lineItemWholesaleValue,
                standardPricePerUnit: row.standardPricePerUnit,
              }),
            ),
          },
        },
      },
    };
  });
}

function buildOrderAggregateUpdates(orderRows) {
  const byAccountId = new Map();

  for (const order of orderRows) {
    if (!order.account_id || order.is_internal_transfer) {
      continue;
    }

    const aggregate = byAccountId.get(order.account_id) ?? {
      lastOrderDate: null,
      customerSinceDate: null,
    };
    const orderDate = toDateOnly(order.order_created_at);
    const candidate = order.delivery_date ?? orderDate;

    if (candidate && (!aggregate.lastOrderDate || candidate > aggregate.lastOrderDate)) {
      aggregate.lastOrderDate = candidate;
    }
    if (orderDate && (!aggregate.customerSinceDate || orderDate < aggregate.customerSinceDate)) {
      aggregate.customerSinceDate = orderDate;
    }

    byAccountId.set(order.account_id, aggregate);
  }

  return byAccountId;
}

async function updateAccountOrderAggregates(supabase, accountIndexes, orderRows, dryRun) {
  const aggregates = buildOrderAggregateUpdates(orderRows);
  if (dryRun) {
    return aggregates.size;
  }

  for (const [accountId, aggregate] of aggregates.entries()) {
    const account = accountIndexes.byId.get(accountId);
    const nextLastOrderDate =
      aggregate.lastOrderDate && (!account?.last_order_date || aggregate.lastOrderDate > account.last_order_date)
        ? aggregate.lastOrderDate
        : account?.last_order_date ?? aggregate.lastOrderDate;
    const nextCustomerSinceDate =
      aggregate.customerSinceDate && (!account?.customer_since_date || aggregate.customerSinceDate < account.customer_since_date)
        ? aggregate.customerSinceDate
        : account?.customer_since_date ?? aggregate.customerSinceDate;

    const { error } = await supabase
      .from("account")
      .update({
        last_order_date: nextLastOrderDate,
        customer_since_date: nextCustomerSinceDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId);

    if (error) {
      throw new Error(`account:order-aggregate:${accountId}:${error.message}`);
    }

    if (account) {
      account.last_order_date = nextLastOrderDate;
      account.customer_since_date = nextCustomerSinceDate;
    }
  }

  return aggregates.size;
}

async function upsertOrders(supabase, organizationId, orders, accountIndexes, dryRun) {
  const rows = orders.map((order) => {
    const account = findAccountForOrder(order, accountIndexes);
    return {
      organization_id: organizationId,
      account_id: account?.id ?? null,
      ...order.row,
      updated_at: new Date().toISOString(),
    };
  });

  if (dryRun || !rows.length) {
    return {
      upserted: rows.length,
      associated: rows.filter((row) => row.account_id).length,
      aggregateUpdates: rows.filter((row) => row.account_id).length,
    };
  }

  for (let index = 0; index < rows.length; index += 300) {
    const chunk = rows.slice(index, index + 300);
    const { error } = await supabase.from("order_record").upsert(chunk, {
      onConflict: "organization_id,provider,external_order_id",
    });

    if (error) {
      throw new Error(`order_record:upsert:${error.message}`);
    }
  }

  const aggregateUpdates = await updateAccountOrderAggregates(supabase, accountIndexes, rows, dryRun);
  return {
    upserted: rows.length,
    associated: rows.filter((row) => row.account_id).length,
    aggregateUpdates,
  };
}

async function syncCompanies(input) {
  if (!input.sourceId) {
    return { fetched: 0, inserted: 0, updated: 0, identities: 0, skipped: 0, warnings: ["No Notion company data source configured"] };
  }

  const pages = await input.notion.queryAllPages(input.sourceId, {
    limit: input.options.limit,
    filterProperties: [
      "Dispensary Name",
      "Licensed Location ID",
      "Nabis Retailer ID",
      "License Number",
      "Account Status",
      "Rep",
      "Account Manager",
      "Referral Source",
      "Last Order Date",
      "Contact",
      "Contact Email",
      "Contact Phone",
      "Map Location",
    ],
  });
  const companies = pages.map((page) => mapCompanyPage(input.organizationId, page));
  const result = { fetched: pages.length, inserted: 0, updated: 0, identities: 0, skipped: 0, companies };

  for (const company of companies) {
    const existing = findAccountForCompany(company, input.accountIndexes);
    const account = await writeAccount(input.supabase, company, existing, input.options.dryRun);
    if (existing) {
      result.updated += 1;
    } else {
      result.inserted += 1;
    }

    if (!input.options.dryRun) {
      indexAccount(input.accountIndexes, account);
    } else {
      input.accountIndexes.byNotionPageId.set(company.sourcePageId, account);
    }

    result.identities += await upsertAccountIdentities(
      input.supabase,
      buildIdentityRows(input.organizationId, account.id, company),
      input.options.dryRun,
    );
  }

  await updateSyncCursor(input.supabase, {
    dryRun: input.options.dryRun,
    organizationId: input.organizationId,
    installationId: input.installationId,
    provider: "notion",
    scope: "companies",
    status: "success",
    cursorPayload: {
      fetched: pages.length,
      sourceId: input.sourceId,
      lastEditedAt: companies[0]?.sourceLastEditedAt ?? null,
    },
  });

  return result;
}

async function syncContacts(input) {
  const contactRows = [];
  const warnings = [];

  for (const company of input.companies) {
    const account = input.accountIndexes.byNotionPageId.get(company.sourcePageId);
    const contact = mapEmbeddedContact(input.organizationId, company, account?.id ?? null);
    if (contact) {
      contactRows.push(contact);
    }
  }

  let contactPagesFetched = 0;
  if (input.sourceId) {
    const contactPages = await input.notion.queryAllPages(input.sourceId, {
      limit: input.options.limit,
      filterProperties: [
        "Name",
        "Contact Name",
        "Full Name",
        "Email",
        "Phone",
        "Role",
        "Company",
        "Dispensary",
        "Account",
        "Licensed Location ID",
        "Nabis Retailer ID",
      ],
    });
    contactPagesFetched = contactPages.length;
    for (const page of contactPages) {
      const record = mapContactPage(input.organizationId, page, null);
      const account = findAccountForContact(record, input.accountIndexes);
      record.row.account_id = account?.id ?? null;
      record.accountId = account?.id ?? null;
      contactRows.push(record);
    }
  } else {
    warnings.push("No Notion contacts data source configured; synced embedded company contact fields only");
  }

  const existingContacts = await fetchAllRows(
    input.supabase,
    "contact",
    "id,account_id,full_name,email,phone,custom_fields",
    (query) => query.eq("organization_id", input.organizationId).order("created_at", { ascending: true }),
  );
  const contactIndexes = buildContactIndexes(existingContacts);
  const result = { fetched: contactPagesFetched, embedded: contactRows.length - contactPagesFetched, inserted: 0, updated: 0, associated: 0, warnings };

  for (const contact of contactRows) {
    const existing = findContact(contact, contactIndexes);
    const written = await writeContact(input.supabase, contact, existing, input.options.dryRun);
    if (existing) {
      result.updated += 1;
    } else {
      result.inserted += 1;
    }
    if (written.account_id) {
      result.associated += 1;
    }
    indexContact(contactIndexes, written);
  }

  await updateSyncCursor(input.supabase, {
    dryRun: input.options.dryRun,
    organizationId: input.organizationId,
    installationId: input.installationId,
    provider: "notion",
    scope: "contacts",
    status: "success",
    cursorPayload: {
      fetched: contactPagesFetched,
      embedded: result.embedded,
      sourceId: input.sourceId ?? null,
    },
  });

  return result;
}

async function syncOrders(input) {
  const rows = await input.nabis.fetchOrders({
    limit: input.options.limit,
    from: input.options.from,
  });
  const orders = collapseNabisOrderRows(rows);
  const writeResult = await upsertOrders(input.supabase, input.organizationId, orders, input.accountIndexes, input.options.dryRun);

  await updateSyncCursor(input.supabase, {
    dryRun: input.options.dryRun,
    organizationId: input.organizationId,
    installationId: input.installationId,
    provider: "nabis",
    scope: "orders",
    status: "success",
    cursorPayload: {
      fetchedRows: rows.length,
      normalizedOrders: orders.length,
      from: input.options.from ?? null,
    },
  });

  return {
    fetchedRows: rows.length,
    normalizedOrders: orders.length,
    ...writeResult,
  };
}

async function resolveNotionSources(notion, installation, options) {
  const configuredIds = optionalJsonArray(process.env.NOTION_DATA_SOURCE_IDS);
  const configIds = Array.isArray(installation?.config?.dataSourceIds) ? installation.config.dataSourceIds.map(cleanConfiguredId).filter(Boolean) : [];
  const ids = uniqueStrings([...configuredIds, ...configIds]);
  const companies =
    cleanConfiguredId(process.env.NOTION_COMPANIES_DATA_SOURCE_ID) ||
    cleanConfiguredId(process.env.NOTION_MASTER_LIST_DATA_SOURCE_ID) ||
    ids[0] ||
    null;
  let contacts = cleanConfiguredId(process.env.NOTION_CONTACTS_DATA_SOURCE_ID) || ids.find((id) => id !== companies) || null;

  if (!contacts && !options.noDiscovery) {
    contacts = await notion.searchDatabaseId("Contacts Database");
  }

  return { companies, contacts };
}

export async function runLiveSync(orgSlug, rawArgs = []) {
  const options = parseLiveSyncOptions(rawArgs);
  const supabase = await getSupabaseAdmin();
  const organization = await getOrganizationOrThrow(supabase, orgSlug);
  const [notionInstallation, nabisInstallation] = await Promise.all([
    getIntegration(supabase, organization.id, "notion"),
    getIntegration(supabase, organization.id, "nabis"),
  ]);
  const state = await loadRuntimeState(supabase, organization.id);
  const accountIndexes = buildAccountIndexes(state.accounts, state.identities);
  const summary = {
    org: orgSlug,
    mode: options.dryRun ? "dry-run" : "apply",
    scopes: [...options.scopes],
    startedAt: new Date().toISOString(),
    companies: null,
    contacts: null,
    orders: null,
  };
  let syncJob = null;

  if (!options.dryRun) {
    syncJob = await createSyncJob(supabase, organization.id, {
      scope: "live-sync",
      requestedScopes: summary.scopes,
      from: options.from ?? null,
    });
    await recordAuditEvent(supabase, organization.id, "sync_started", {
      scope: "live-sync",
      syncJobId: syncJob.id,
      requestedScopes: summary.scopes,
    });
  }

  try {
    let companies = [];
    if (options.scopes.has("companies") || options.scopes.has("contacts")) {
      const notion = new NotionClient(requiredEnv("NOTION_TOKEN"));
      const sources = await resolveNotionSources(notion, notionInstallation, options);

      if (options.scopes.has("companies")) {
        summary.companies = await syncCompanies({
          supabase,
          notion,
          options,
          organizationId: organization.id,
          installationId: notionInstallation?.id ?? null,
          sourceId: sources.companies,
          accountIndexes,
        });
        companies = summary.companies.companies;
        delete summary.companies.companies;
      }

      if (options.scopes.has("contacts")) {
        summary.contacts = await syncContacts({
          supabase,
          notion,
          options,
          organizationId: organization.id,
          installationId: notionInstallation?.id ?? null,
          sourceId: sources.contacts,
          accountIndexes,
          companies,
        });
      }
    }

    if (options.scopes.has("orders")) {
      const nabis = new NabisClient(
        requiredEnv("NABIS_API_KEY"),
        process.env.NABIS_API_BASE_URL?.trim() || DEFAULT_NABIS_API_BASE_URL,
        process.env.NABIS_ORDERS_PATH?.trim() || "/ny/order",
      );
      summary.orders = await syncOrders({
        supabase,
        nabis,
        options,
        organizationId: organization.id,
        installationId: nabisInstallation?.id ?? null,
        accountIndexes,
      });
    }

    summary.finishedAt = new Date().toISOString();
    if (!options.dryRun) {
      await finishSyncJob(supabase, syncJob?.id, "success");
      await recordAuditEvent(supabase, organization.id, "sync_succeeded", {
        scope: "live-sync",
        syncJobId: syncJob?.id ?? null,
        summary,
      });
    }

    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : "live sync failed";
    if (!options.dryRun) {
      await finishSyncJob(supabase, syncJob?.id, "error", message);
      await recordAuditEvent(supabase, organization.id, "sync_failed", {
        scope: "live-sync",
        syncJobId: syncJob?.id ?? null,
        error: message,
      });
    }

    throw error;
  }
}
