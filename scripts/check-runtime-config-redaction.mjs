import { readFileSync } from "node:fs";

const files = {
  domain: "lib/domain/runtime.ts",
  organizationService: "lib/application/runtime/organization-service.ts",
  organizationRoute: "app/api/runtime/organizations/[slug]/route.ts",
  mapConfigRoute: "app/api/runtime/organizations/[slug]/territory/map-config/route.ts",
};

const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]));
const failures = [];

function assertPresent(label, text, pattern) {
  if (!pattern.test(text)) {
    failures.push(label);
  }
}

function assertAbsent(label, text, pattern) {
  if (pattern.test(text)) {
    failures.push(label);
  }
}

assertPresent("runtime snapshot must expose a config-free integration summary type", source.domain, /RuntimeIntegrationSummary/);
assertAbsent(
  "runtime snapshot integrations must not be raw IntegrationInstallation[]",
  source.domain,
  /integrations:\s*IntegrationInstallation\[\]/,
);

assertPresent("organization service must sanitize integrations", source.organizationService, /sanitizeRuntimeIntegration/);
assertAbsent("organization service must not return raw integrationList", source.organizationService, /integrations:\s*integrationList\s*[,}]/);
assertAbsent("runtime integration sanitizer must not include config", source.organizationService, /\bconfig:\s*integration\.config\b/);

assertPresent("organization runtime route must require tenant session", source.organizationRoute, /getTenantSessionEmailForSlug/);
assertPresent("organization runtime route must reject unauthenticated requests", source.organizationRoute, /status:\s*401/);

assertPresent("map config route must require tenant session", source.mapConfigRoute, /getTenantSessionEmailForSlug/);
assertPresent("map config route must reject unauthenticated requests", source.mapConfigRoute, /status:\s*401/);
assertAbsent("map config route must not select raw integration config", source.mapConfigRoute, /select:\s*"config"|select\("config"\)/);
assertAbsent("map config route must not query integration_installation directly", source.mapConfigRoute, /integration_installation/);

if (failures.length) {
  console.error("Runtime config redaction guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Runtime config redaction guard passed.");
