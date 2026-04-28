import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} is missing`);
    return "";
  }

  return readFileSync(absolutePath, "utf8");
}

function readJson(relativePath) {
  const raw = read(relativePath);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function assertIncludes(content, needle, relativePath) {
  if (!content.includes(needle)) {
    fail(`${relativePath} must include "${needle}"`);
  }
}

const requiredFiles = [
  "lib/application/screenprinting/config.ts",
  "lib/application/screenprinting/feature-flags.ts",
  "lib/application/screenprinting/audit-hooks.ts",
  "lib/application/screenprinting/adapters.ts",
  "lib/application/screenprinting/repository.ts",
  "lib/application/screenprinting/screenprinting-service.ts",
  "lib/infrastructure/adapters/printavo/ordering-adapter.ts",
  "lib/infrastructure/adapters/social/manual-social-adapter.ts",
  "components/screenprinting/screenprinting-workspace.tsx",
  "app/screenprinting/page.tsx",
  "tenants/second-screenprinter/workspace.json",
];

for (const file of requiredFiles) {
  read(file);
}

const routeFiles = [
  "app/api/runtime/organizations/[slug]/screenprinting/config/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/config/preview/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/sales/dashboard/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/sales/orders/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/sales/opportunities/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/sales/reorders/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/sales/email-drafts/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/social/dashboard/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/social/accounts/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/social/posts/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/social/calendar/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/social/campaigns/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/social/alerts/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/social/threads/route.ts",
  "app/api/runtime/organizations/[slug]/screenprinting/identity-resolution/route.ts",
];

for (const file of routeFiles) {
  read(file);
}

const registry = readJson("docs/WORK_REGISTRY.json");
const expectedDoneItems = [
  "RUNWAY-001",
  "RUNWAY-002",
  "RUNWAY-003",
  "RUNWAY-004",
  "RUNWAY-005",
  "RUNWAY-006",
  "RUNWAY-007",
  "DATA-001",
  "API-001",
  "ADMIN-001",
  "SALES-001",
  "SOCIAL-001",
  "IDENTITY-001",
  "QA-001",
  "SCALE-001",
];

if (registry) {
  const itemsById = new Map((registry.items ?? []).map((item) => [item.id, item]));
  for (const itemId of expectedDoneItems) {
    const item = itemsById.get(itemId);
    if (!item) {
      fail(`docs/WORK_REGISTRY.json is missing ${itemId}`);
    } else if (item.status !== "done") {
      fail(`${itemId} must be done after the Screenprinting foundation build; current status is ${item.status}`);
    }
  }
}

const fixture = readJson("fixtures/screenprinting/sample-screenprinting-data.json");
if (fixture) {
  const tenants = Array.isArray(fixture.tenants) ? fixture.tenants : [];
  if (tenants.length < 2) {
    fail("fixtures/screenprinting/sample-screenprinting-data.json must include at least two Screenprinting tenants");
  }
  const fraternitees = tenants.find((tenant) => tenant.slug === "fraternitees");
  const second = tenants.find((tenant) => tenant.slug === "second-screenprinter");
  if (!fraternitees || !second) {
    fail("Screenprinting fixture must include fraternitees and second-screenprinter tenants");
  }
  if (fraternitees?.config?.features?.social_publishing !== false || second?.config?.features?.social_publishing !== false) {
    fail("Screenprinting fixture must keep social publishing disabled for both tenants");
  }
  if (fraternitees?.config?.features?.comments_replies === second?.config?.features?.comments_replies) {
    fail("Screenprinting fixture must prove tenant-scoped feature flag differences");
  }
}

const migration = read("supabase/migrations/20260427120000_screenprinting_foundation.sql");
const tenantTables = [
  "mapping_rule",
  "opportunity",
  "reorder_signal",
  "email_template",
  "social_account",
  "social_post",
  "social_thread",
  "campaign",
  "alert_rule",
  "alert_instance",
  "identity_resolution",
  "dashboard_definition",
];

for (const tableName of tenantTables) {
  assertIncludes(migration, `create table if not exists public.${tableName}`, "supabase/migrations/20260427120000_screenprinting_foundation.sql");
  assertIncludes(migration, "organization_id uuid not null references public.organization(id) on delete cascade", "supabase/migrations/20260427120000_screenprinting_foundation.sql");
  assertIncludes(migration, `alter table public.${tableName} enable row level security`, "supabase/migrations/20260427120000_screenprinting_foundation.sql");
}

const screenprintingFiles = [
  "lib/application/screenprinting/config.ts",
  "lib/application/screenprinting/feature-flags.ts",
  "lib/application/screenprinting/audit-hooks.ts",
  "lib/application/screenprinting/adapters.ts",
  "lib/application/screenprinting/repository.ts",
  "lib/application/screenprinting/screenprinting-service.ts",
];

for (const file of screenprintingFiles) {
  const content = read(file);
  for (const forbidden of ["cannabis", "picc"]) {
    if (new RegExp(`from ["'][^"']*${forbidden}`, "i").test(content)) {
      fail(`${file} must not import ${forbidden}-specific modules`);
    }
  }
}

for (const docPath of [
  "docs/DATA_MODEL.md",
  "docs/API_CONTRACTS.md",
  "docs/tenant-types/SCHEMA.md",
  "docs/tenant-types/screenprinting/CONFIGURATION.md",
  "docs/tenant-types/screenprinting/INTEGRATIONS.md",
  "docs/tenant-types/screenprinting/SALES_MODULE.md",
  "docs/tenant-types/screenprinting/SOCIAL_MODULE.md",
  "docs/tenants/fraternitees/DATA_DECISIONS.md",
  "docs/TODO.md",
  "docs/ROADMAP.md",
  "docs/STATUS.md",
]) {
  const content = read(docPath);
  assertIncludes(content, "Screenprinting", docPath);
}

if (failures.length) {
  console.error("Screenprinting foundation check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Screenprinting foundation check passed.");
