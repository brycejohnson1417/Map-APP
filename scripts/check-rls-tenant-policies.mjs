import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;
const migrationsDir = join(repoRoot, "supabase/migrations");
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const tableDefinitions = new Map();
const rlsEnabledTables = new Set();
const policies = new Map();

function tableKey(schema, table) {
  return `${schema.toLowerCase()}.${table.toLowerCase()}`;
}

function extractCreateTableBody(sql, startIndex) {
  const openIndex = sql.indexOf("(", startIndex);
  if (openIndex === -1) {
    return "";
  }

  let depth = 0;
  for (let index = openIndex; index < sql.length; index += 1) {
    if (sql[index] === "(") {
      depth += 1;
    } else if (sql[index] === ")") {
      depth -= 1;
      if (depth === 0) {
        return sql.slice(openIndex + 1, index);
      }
    }
  }

  return "";
}

function addPolicy(schema, table, policyName, command) {
  const key = tableKey(schema, table);
  const existing = policies.get(key) ?? new Map();
  existing.set(policyName.toLowerCase(), command.toLowerCase());
  policies.set(key, existing);
}

for (const file of migrationFiles) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");

  for (const match of sql.matchAll(/create\s+table\s+if\s+not\s+exists\s+(public|app_private)\.([a-z_]+)/gi)) {
    const key = tableKey(match[1], match[2]);
    const body = extractCreateTableBody(sql, match.index ?? 0);
    tableDefinitions.set(key, {
      file,
      hasOrganizationId: /\borganization_id\b/i.test(body),
      schema: match[1].toLowerCase(),
      table: match[2].toLowerCase(),
    });
  }

  for (const match of sql.matchAll(/alter\s+table\s+(public|app_private)\.([a-z_]+)\s+enable\s+row\s+level\s+security/gi)) {
    rlsEnabledTables.add(tableKey(match[1], match[2]));
  }

  for (const match of sql.matchAll(/create\s+policy\s+"([^"]+)"\s+on\s+(public|app_private)\.([a-z_]+)\s+for\s+(all|select|insert|update|delete)/gi)) {
    addPolicy(match[2], match[3], match[1], match[4]);
  }
}

const publicRlsTables = [...tableDefinitions.entries()]
  .filter(([key, definition]) => definition.schema === "public" && rlsEnabledTables.has(key))
  .map(([key, definition]) => ({ key, ...definition }))
  .sort((left, right) => left.key.localeCompare(right.key));

const readOnlyTables = new Set([
  "public.audit_event",
  "public.integration_installation",
  "public.organization",
  "public.organization_member",
  "public.sync_cursor",
  "public.sync_job",
]);

const secretTables = new Set(["public.integration_secret"]);
const failures = [];
const migrationSql = migrationFiles.map((file) => readFileSync(join(migrationsDir, file), "utf8")).join("\n");

if (!/create\s+or\s+replace\s+function\s+app_private\.current_tenant_organization_ids\s*\(/i.test(migrationSql)) {
  failures.push("Missing app_private.current_tenant_organization_ids() helper.");
}

if (/raw_user_meta_data|user_metadata/i.test(migrationSql)) {
  failures.push("RLS policy SQL must not authorize from user-editable metadata.");
}

for (const table of publicRlsTables) {
  const tablePolicies = policies.get(table.key) ?? new Map();

  if (secretTables.has(table.key)) {
    if (tablePolicies.size > 0) {
      failures.push(`${table.key} must remain service-role only and must not define tenant JWT policies.`);
    }
    continue;
  }

  if (table.key === "public.organization") {
    if (!tablePolicies.has("tenant_scope_select")) {
      failures.push("public.organization must define tenant_scope_select using organization.id.");
    }
    continue;
  }

  if (!table.hasOrganizationId) {
    failures.push(`${table.key} has RLS but no organization_id column.`);
    continue;
  }

  if (!tablePolicies.has("tenant_scope_select")) {
    failures.push(`${table.key} must define tenant_scope_select.`);
  }

  const hasWritePolicy =
    tablePolicies.has("tenant_scope_all") ||
    (tablePolicies.has("tenant_scope_insert") && tablePolicies.has("tenant_scope_update") && tablePolicies.has("tenant_scope_delete"));

  if (readOnlyTables.has(table.key)) {
    if (hasWritePolicy) {
      failures.push(`${table.key} must be tenant-readable only; do not add tenant write policies.`);
    }
  } else if (!hasWritePolicy) {
    failures.push(`${table.key} must define tenant write policy coverage.`);
  }
}

if (failures.length) {
  console.error("RLS tenant policy check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`RLS tenant policy check passed for ${publicRlsTables.length} public RLS tables.`);
