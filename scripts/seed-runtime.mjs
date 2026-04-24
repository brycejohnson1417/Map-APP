import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const repoRoot = resolve(import.meta.dirname, "..");
const IV_LENGTH = 12;

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
  for (const relativePath of [".env.local", ".env"]) {
    const fullPath = resolve(repoRoot, relativePath);
    if (!existsSync(fullPath)) {
      continue;
    }

    for (const line of readFileSync(fullPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const normalized = trimmed.startsWith("export ") ? trimmed.slice("export ".length) : trimmed;
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

function requiredEnv(key) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
}

function tenantEnvPrefix(orgSlug) {
  return String(orgSlug ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function tenantEnv(orgSlug, suffix) {
  const prefix = tenantEnvPrefix(orgSlug);
  if (!prefix) {
    return "";
  }
  return process.env[`${prefix}_${suffix}`]?.trim() || "";
}

function optionalJsonArray(raw) {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
}

function encryptJson(value) {
  const key = createHash("sha256").update(requiredEnv("APP_ENCRYPTION_KEY")).digest();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

function readFieldMappings(orgSlug) {
  const path = resolve(repoRoot, "tenants", orgSlug, "field-mappings.json");
  if (!existsSync(path)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const crm = Array.isArray(parsed.crm) ? parsed.crm : [];
  const orders = Array.isArray(parsed.orders) ? parsed.orders : [];

  return [
    ...crm.map((mapping) => ({ ...mapping, provider: "notion" })),
    ...orders.map((mapping) => ({ ...mapping, provider: "nabis" })),
  ];
}

async function upsertIntegration(supabase, organizationId, input) {
  const { data, error } = await supabase
    .from("integration_installation")
    .upsert(
      {
        organization_id: organizationId,
        provider: input.provider,
        display_name: input.displayName,
        external_account_id: input.externalAccountId ?? null,
        config: input.config ?? {},
        status: "active",
      },
      { onConflict: "organization_id,provider,display_name" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  for (const [keyName, secretValue] of Object.entries(input.secrets ?? {})) {
    const { error: secretError } = await supabase.from("integration_secret").upsert(
      {
        organization_id: organizationId,
        installation_id: data.id,
        key_name: keyName,
        ciphertext: encryptJson(secretValue),
      },
      { onConflict: "installation_id,key_name" },
    );

    if (secretError) {
      throw secretError;
    }
  }

  return data;
}

async function main() {
  loadLocalEnv();

  const supabase = createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
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

  const orgSlug = requiredEnv("ORG_SLUG");
  const orgName = requiredEnv("ORG_NAME");

  const { data: organization, error: organizationError } = await supabase
    .from("organization")
    .upsert(
      {
        slug: orgSlug,
        name: orgName,
        status: "active",
      },
      { onConflict: "slug" },
    )
    .select("*")
    .single();

  if (organizationError) {
    throw organizationError;
  }

  const { error: memberError } = await supabase.from("organization_member").upsert(
    {
      organization_id: organization.id,
      clerk_user_id: requiredEnv("OWNER_CLERK_ID"),
      email: requiredEnv("OWNER_EMAIL"),
      full_name: process.env.OWNER_NAME?.trim() || null,
      role: "owner",
    },
    { onConflict: "organization_id,clerk_user_id" },
  );

  if (memberError) {
    throw memberError;
  }

  const integrations = {};

  const notionToken = tenantEnv(orgSlug, "NOTION_TOKEN");
  const notionWorkspaceId = tenantEnv(orgSlug, "NOTION_WORKSPACE_ID");
  const notionDataSourceIds = optionalJsonArray(tenantEnv(orgSlug, "NOTION_DATA_SOURCE_IDS"));
  const notionCompaniesDataSourceId = tenantEnv(orgSlug, "NOTION_COMPANIES_DATA_SOURCE_ID");
  const notionMasterListDataSourceId = tenantEnv(orgSlug, "NOTION_MASTER_LIST_DATA_SOURCE_ID");
  const notionContactsDataSourceId = tenantEnv(orgSlug, "NOTION_CONTACTS_DATA_SOURCE_ID");

  if (notionToken) {
    integrations.notion = await upsertIntegration(supabase, organization.id, {
      provider: "notion",
      displayName: "Notion CRM",
      externalAccountId: notionWorkspaceId || null,
      config: {
        dataSourceIds: notionDataSourceIds,
        companyDataSourceId:
          notionCompaniesDataSourceId ||
          notionMasterListDataSourceId ||
          notionDataSourceIds[0] ||
          null,
        contactDataSourceId: notionContactsDataSourceId || notionDataSourceIds[1] || null,
      },
      secrets: {
        token: notionToken,
      },
    });
  }

  const nabisApiKey = tenantEnv(orgSlug, "NABIS_API_KEY");
  const nabisApiBaseUrl = tenantEnv(orgSlug, "NABIS_API_BASE_URL");
  const nabisOrdersPath = tenantEnv(orgSlug, "NABIS_ORDERS_PATH");
  if (nabisApiKey) {
    integrations.nabis = await upsertIntegration(supabase, organization.id, {
      provider: "nabis",
      displayName: "Nabis Orders",
      config: {
        apiBaseUrl: nabisApiBaseUrl || "https://platform-api.nabis.pro/v2",
        ordersPath: nabisOrdersPath || "/ny/order",
      },
      secrets: {
        apiKey: nabisApiKey,
      },
    });
  }

  const googleMapsBrowserApiKey = tenantEnv(orgSlug, "GOOGLE_MAPS_BROWSER_API_KEY");
  const googleMapsServerApiKey = tenantEnv(orgSlug, "GOOGLE_MAPS_SERVER_API_KEY");
  if (googleMapsBrowserApiKey || googleMapsServerApiKey) {
    integrations.google_maps = await upsertIntegration(supabase, organization.id, {
      provider: "google_maps",
      displayName: "Google Maps",
      config: {
        browserApiKey: googleMapsBrowserApiKey || null,
      },
      secrets: googleMapsServerApiKey
        ? {
            serverApiKey: googleMapsServerApiKey,
          }
        : {},
    });
  }

  const fieldMappings = readFieldMappings(orgSlug);
  for (const mapping of fieldMappings) {
    const installation = integrations[mapping.provider];
    const { error } = await supabase.from("field_mapping").upsert(
      {
        organization_id: organization.id,
        installation_id: installation?.id ?? null,
        provider: mapping.provider,
        external_entity_type: "account",
        external_field_key: mapping.sourceField,
        internal_field_key: mapping.targetField,
        transform: {
          sourceSystem: mapping.sourceSystem,
          sourceType: mapping.sourceType ?? null,
          targetEntity: mapping.targetEntity,
        },
        is_required: ["name", "licensed_location_id"].includes(mapping.targetField),
      },
      {
        onConflict: "organization_id,provider,external_entity_type,external_field_key,internal_field_key",
      },
    );

    if (error) {
      throw error;
    }
  }

  console.log(
    JSON.stringify(
      {
        organization: {
          id: organization.id,
          slug: organization.slug,
        },
        integrations: Object.keys(integrations),
        fieldMappings: fieldMappings.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
