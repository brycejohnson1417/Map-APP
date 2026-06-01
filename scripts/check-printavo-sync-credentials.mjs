import { readFileSync } from "node:fs";

const routePaths = [
  "app/api/runtime/organizations/[slug]/printavo/sync/route.ts",
  "app/api/tenants/fraternitees/printavo/sync/route.ts",
];
const servicePath = "lib/application/fraternitees/printavo-sync-service.ts";

const routeSources = routePaths.map((path) => [path, readFileSync(path, "utf8")]);
const serviceSource = readFileSync(servicePath, "utf8");

const failures = [];

function assertAbsent(label, source, pattern) {
  if (pattern.test(source)) {
    failures.push(label);
  }
}

function assertPresent(label, source, pattern) {
  if (!pattern.test(source)) {
    failures.push(label);
  }
}

for (const [path, routeSource] of routeSources) {
  assertAbsent(`${path} must not declare email/apiKey request-body overrides`, routeSource, /\b(?:email|apiKey)\??:\s*string/);
  assertAbsent(`${path} must not read body.email`, routeSource, /\bbody\.email\b/);
  assertAbsent(`${path} must not read body.apiKey`, routeSource, /\bbody\.apiKey\b/);
}
assertAbsent("runPrintavoSync input must not accept email/apiKey overrides", serviceSource, /\b(?:email|apiKey):\s*string\s*\|\s*null/);
assertAbsent("resolveStoredPrintavoCredentials input must not accept email/apiKey overrides", serviceSource, /\binput\.(?:email|apiKey)\b/);

assertPresent("Printavo sync service must read saved connector credentials", serviceSource, /readSecret<PrintavoCredentialsSecret>/);
assertPresent("Missing saved Printavo credentials must return setup-specific error", serviceSource, /Save Printavo credentials before running sync\./);

if (failures.length) {
  console.error("Printavo sync credential guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Printavo sync credential guard passed.");
