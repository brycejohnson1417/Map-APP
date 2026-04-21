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

async function main() {
  const [scope, action, org] = process.argv.slice(2);

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

  if (scope === "migration" && (action === "dry-run" || action === "validate")) {
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

    printResults(`Migration dry-run for ${org}`, checks);
    exitFromChecks(checks);
  }

  usage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
