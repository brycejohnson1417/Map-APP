import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;
const migrationsDir = join(repoRoot, "supabase", "migrations");

const readOnlyTables = [
  "organization",
  "organization_member",
  "integration_installation",
  "sync_cursor",
  "sync_job",
  "audit_event",
];

const writableTables = [
  "field_mapping",
  "account",
  "account_identity",
  "contact",
  "activity",
  "territory_boundary",
  "territory_marker",
  "order_record",
  "change_request",
  "change_request_attachment",
  "mapping_rule",
  "opportunity",
  "reorder_signal",
  "email_template",
  "social_account",
  "campaign",
  "social_post",
  "social_thread",
  "alert_rule",
  "alert_instance",
  "identity_resolution",
  "dashboard_definition",
];

const writeOperations = ["insert", "update", "delete"];
const failures = [];

function fail(message) {
  failures.push(message);
}

function readMigrations() {
  if (!existsSync(migrationsDir)) {
    fail("supabase/migrations is missing");
    return "";
  }

  return readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => readFileSync(join(migrationsDir, fileName), "utf8"))
    .join("\n");
}

function assertIncludes(content, needle, label) {
  if (!content.includes(needle)) {
    fail(`${label} must include "${needle}"`);
  }
}

function assertNotIncludes(content, needle, label) {
  if (content.includes(needle)) {
    fail(`${label} must not include "${needle}"`);
  }
}

function assertPolicyBuilder(content, operation) {
  const policyName = `tenant_scope_${operation}`;
  assertIncludes(content, `drop policy if exists ${policyName} on public.%I`, `${operation} policy builder`);
  assertIncludes(content, `create policy ${policyName} on public.%I`, `${operation} policy builder`);
  assertIncludes(content, `for ${operation}`, `${operation} policy builder`);
  assertIncludes(content, "to authenticated", `${operation} policy builder`);
  assertIncludes(content, "app_private.is_tenant_member(%I)", `${operation} policy builder`);
}

function assertPolicyCall(content, tableName, expressionColumn, allowWrites) {
  assertIncludes(
    content,
    `select app_private.recreate_tenant_scope_policies('${tableName}', '${expressionColumn}', ${allowWrites ? "true" : "false"});`,
    `public.${tableName} policy registration`,
  );
}

const migrations = readMigrations();

assertIncludes(migrations, "create or replace function app_private.is_tenant_member(target_organization_id uuid)", "tenant helper");
assertIncludes(migrations, "security definer", "tenant helper");
assertIncludes(migrations, "auth.jwt() -> 'app_metadata' ->> 'clerk_user_id'", "tenant helper");
assertIncludes(migrations, "auth.jwt() ->> 'sub'", "tenant helper");
assertIncludes(migrations, "public.organization_member", "tenant helper");
assertIncludes(migrations, "create or replace function app_private.recreate_tenant_scope_policies(", "policy builder");
assertIncludes(migrations, "grant execute on function app_private.is_tenant_member(uuid) to authenticated, service_role;", "tenant helper grants");
assertNotIncludes(migrations, "user_metadata", "tenant helper");

assertPolicyBuilder(migrations, "select");
for (const operation of writeOperations) {
  assertPolicyBuilder(migrations, operation);
}

assertPolicyCall(migrations, "organization", "id", false);

for (const tableName of readOnlyTables.filter((table) => table !== "organization")) {
  assertPolicyCall(migrations, tableName, "organization_id", false);
}

for (const tableName of writableTables) {
  assertPolicyCall(migrations, tableName, "organization_id", true);
}

assertNotIncludes(migrations, "recreate_tenant_scope_policies('integration_secret'", "public.integration_secret");
assertNotIncludes(migrations, "recreate_tenant_scope_policies('app_private.integration_secret'", "app_private.integration_secret");

if (failures.length) {
  console.error("RLS tenant-scope policy check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("RLS tenant-scope policy check passed.");
