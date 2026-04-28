import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;

const requiredTenantTypes = [
  {
    id: "screenprinting",
    directory: "screenprinting",
    expectedTenantWorkspaces: {
      fraternitees: "FraterniTees",
    },
    docs: [
      "README.md",
      "PRODUCT_SPEC.md",
      "CONFIGURATION.md",
      "SALES_MODULE.md",
      "SOCIAL_MODULE.md",
      "FEATURE_COVERAGE.md",
      "IDENTITY_RESOLUTION.md",
      "INTEGRATIONS.md",
      "DATA_SECURITY.md",
      "IMPLEMENTATION_GAPS.md",
      "FULL_IMPLEMENTATION_HANDOFF.md",
    ],
  },
  {
    id: "cannabis_wholesale",
    directory: "cannabis-wholesale",
    expectedTenantWorkspaces: {
      picc: "PICC New York",
    },
    docs: ["README.md", "CONFIGURATION.md", "INTEGRATIONS.md", "DATA_SECURITY.md"],
  },
];

const failures = [];

function readJson(relativePath) {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing`);
    return null;
  }

  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    failures.push(`${relativePath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function readMarkdown(relativePath) {
  const absolutePath = join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`${relativePath} is missing`);
    return "";
  }

  return readFileSync(absolutePath, "utf8");
}

function assertIncludes(content, needle, relativePath) {
  if (!content.includes(needle)) {
    failures.push(`${relativePath} must include "${needle}"`);
  }
}

function checkTenantType(type) {
  const manifestPath = `tenant-types/${type.directory}/type.json`;
  const manifest = readJson(manifestPath);

  if (manifest) {
    if (manifest.id !== type.id) {
      failures.push(`${manifestPath} id must be "${type.id}"`);
    }
    if (!manifest.displayName) {
      failures.push(`${manifestPath} must define displayName`);
    }
    for (const key of ["stablePrimitives", "configurationSurfaces", "defaultAdapters", "securityBoundaries", "documentation"]) {
      if (!Array.isArray(manifest[key]) || manifest[key].length === 0) {
        failures.push(`${manifestPath} must define a non-empty ${key} array`);
      }
    }
  }

  for (const doc of type.docs) {
    const docPath = `docs/tenant-types/${type.directory}/${doc}`;
    const content = readMarkdown(docPath);
    if (content) {
      assertIncludes(content, "Tenant type", docPath);
      assertIncludes(content, "Tenant-specific", docPath);
    }
  }

  const securityDocPath = `docs/tenant-types/${type.directory}/DATA_SECURITY.md`;
  const securityDoc = readMarkdown(securityDocPath);
  if (securityDoc) {
    for (const phrase of ["organization_id", "tenant-scoped credentials", "No cross-tenant"]) {
      assertIncludes(securityDoc, phrase, securityDocPath);
    }
  }

  for (const [tenantSlug, expectedName] of Object.entries(type.expectedTenantWorkspaces)) {
    const workspacePath = `tenants/${tenantSlug}/workspace.json`;
    const workspace = readJson(workspacePath);
    if (workspace) {
      if (workspace.displayName !== expectedName) {
        failures.push(`${workspacePath} displayName must be "${expectedName}"`);
      }
      if (workspace.tenantType?.id !== type.id) {
        failures.push(`${workspacePath} tenantType.id must be "${type.id}"`);
      }
      if (workspace.tenantType?.scope !== "tenant_type") {
        failures.push(`${workspacePath} tenantType.scope must be "tenant_type"`);
      }
    }
  }
}

const indexDoc = readMarkdown("docs/tenant-types/README.md");
if (indexDoc) {
  assertIncludes(indexDoc, "Tenant type", "docs/tenant-types/README.md");
  assertIncludes(indexDoc, "Tenant-specific", "docs/tenant-types/README.md");
}

for (const type of requiredTenantTypes) {
  checkTenantType(type);
}

const tenantDocDirs = existsSync(join(repoRoot, "docs/tenants")) ? readdirSync(join(repoRoot, "docs/tenants")) : [];
for (const tenantSlug of ["fraternitees", "picc"]) {
  if (!tenantDocDirs.includes(tenantSlug)) {
    failures.push(`docs/tenants/${tenantSlug} is missing`);
  }
}

for (const relativePath of ["README.md", "docs/ARCHITECTURE.md", "docs/WORKSPACE_MODEL.md", "docs/PLATFORM_SPEC.md"]) {
  const content = readMarkdown(relativePath);
  if (/\btenant template\b/i.test(content)) {
    failures.push(`${relativePath} still uses "tenant template"; use "tenant type" instead`);
  }
}

for (const relativePath of [
  "app/onboarding/page.tsx",
  "components/onboarding/workspace-onboarding-form.tsx",
  "components/auth/tenant-login-form.tsx",
  "tenants/field-ops-starter/workspace.json",
]) {
  const content = readMarkdown(relativePath);
  for (const phrase of ["workspace template", "Pick a template", "choose a template", "Choose a template", "starter template"]) {
    if (content.includes(phrase)) {
      failures.push(`${relativePath} still exposes "${phrase}"; use tenant type language`);
    }
  }
}

for (const relativePath of [
  "docs/tenant-types/README.md",
  "docs/tenant-types/screenprinting/README.md",
  "docs/tenant-types/screenprinting/PRODUCT_SPEC.md",
  "docs/tenant-types/screenprinting/SALES_MODULE.md",
  "docs/tenant-types/screenprinting/SOCIAL_MODULE.md",
  "docs/tenant-types/screenprinting/FEATURE_COVERAGE.md",
  "docs/tenant-types/screenprinting/IMPLEMENTATION_GAPS.md",
  "docs/tenant-types/screenprinting/FULL_IMPLEMENTATION_HANDOFF.md",
  "docs/WORKSPACE_MODEL.md",
  "docs/ARCHITECTURE.md",
]) {
  const content = readMarkdown(relativePath);
  for (const phrase of ["Salesland", "SalesLand", "Socialland", "SocialLand", "Artland", "ArtLand", "Warehouseland", "WarehouseLand", "Campus Ink"]) {
    if (content.includes(phrase)) {
      failures.push(`${relativePath} still references "${phrase}"; use self-contained Screenprinting product requirements`);
    }
  }
}

if (failures.length) {
  console.error("Tenant type documentation check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Tenant type documentation check passed.");
