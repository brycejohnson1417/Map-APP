import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;

const sourceDirsToCheck = [
  "app/api/runtime",
  "lib/application/runtime",
  "lib/application/fraternitees",
  "lib/infrastructure/adapters/geocoding",
];

const textFilesToCheck = [
  ".env.example",
  "docs/SETUP.md",
  "docs/ENVIRONMENT_AND_DEPLOYMENT_POLICY.md",
  "docs/OPERATING_ENVIRONMENT.md",
];

const forbiddenPatterns = [
  { label: "generic Google Maps browser key", names: ["NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY", "GOOGLE_MAPS_BROWSER_API_KEY"] },
  { label: "generic Google Maps server key", names: ["GOOGLE_MAPS_SERVER_API_KEY"] },
  { label: "generic Nabis API key", names: ["NABIS_API_KEY"] },
  { label: "generic Nabis API base URL", names: ["NABIS_API_BASE_URL"] },
  { label: "generic Nabis orders path", names: ["NABIS_ORDERS_PATH"] },
  { label: "generic Nabis inventory path", names: ["NABIS_INVENTORY_PATH"] },
  { label: "generic Notion token", names: ["NOTION_TOKEN"] },
  { label: "generic Printavo API key", names: ["PRINTAVO_API_KEY", "PRINTAVO_TOKEN"] },
  { label: "generic Printavo email", names: ["PRINTAVO_EMAIL"] },
  { label: "generic HubSpot token", names: ["HUBSPOT_API_KEY", "HUBSPOT_ACCESS_TOKEN", "HUBSPOT_PRIVATE_APP_TOKEN"] },
  {
    label: "generic Salesforce credential",
    names: [
      "SALESFORCE_CLIENT_ID",
      "SALESFORCE_CLIENT_SECRET",
      "SALESFORCE_USERNAME",
      "SALESFORCE_PASSWORD",
      "SALESFORCE_SECURITY_TOKEN",
      "SALESFORCE_ACCESS_TOKEN",
      "SALESFORCE_REFRESH_TOKEN",
    ],
  },
  { label: "generic HighLevel credential", names: ["HIGHLEVEL_API_KEY", "HIGHLEVEL_ACCESS_TOKEN", "HIGHLEVEL_LOCATION_ID", "GHL_API_KEY", "GHL_ACCESS_TOKEN", "GHL_LOCATION_ID"] },
];

function walk(dir, collected = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const nextPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(nextPath, collected);
      continue;
    }
    if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      collected.push(nextPath);
    }
  }
  return collected;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sourcePatternForName(name) {
  return new RegExp(`\\bprocess\\.env\\.${escapeRegExp(name)}\\b`, "g");
}

function textPatternForName(name) {
  return new RegExp(`(?<![A-Z0-9_<])${escapeRegExp(name)}(?![A-Z0-9_])`, "g");
}

function scanContent(filePath, content, { includeProcessEnv, includeBareEnv }) {
  const failures = [];
  for (const rule of forbiddenPatterns) {
    for (const name of rule.names) {
      const patterns = [
        ...(includeProcessEnv ? [sourcePatternForName(name)] : []),
        ...(includeBareEnv ? [textPatternForName(name)] : []),
      ];
      for (const pattern of patterns) {
        const matches = [...content.matchAll(pattern)];
        for (const match of matches) {
          const before = content.slice(0, match.index ?? 0);
          const line = before.split("\n").length;
          failures.push(`${filePath}:${line} uses ${rule.label}`);
        }
      }
    }
  }
  return failures;
}

function runSelfTest({ silent = false } = {}) {
  const forbiddenFixture = [
    "NABIS_API_KEY=replace-me",
    "PRINTAVO_EMAIL=ops@example.com",
    "GOOGLE_MAPS_SERVER_API_KEY=replace-me",
    "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY=replace-me",
    "NOTION_TOKEN=replace-me",
    "HUBSPOT_ACCESS_TOKEN=replace-me",
    "SALESFORCE_CLIENT_SECRET=replace-me",
    "HIGHLEVEL_API_KEY=replace-me",
  ].join("\n");
  const allowedFixture = [
    "PICC_NABIS_API_KEY=replace-me",
    "PICC_NABIS_ORDERS_PATH=/ny/order",
    "FRATERNITEES_PRINTAVO_EMAIL=ops@example.com",
    "<ORG>_GOOGLE_MAPS_SERVER_API_KEY=replace-me",
    "META_APP_ID=platform-owned",
    "META_APP_SECRET=platform-owned",
  ].join("\n");

  const forbiddenMatches = scanContent("self-test-forbidden.env", forbiddenFixture, {
    includeProcessEnv: false,
    includeBareEnv: true,
  });
  const allowedMatches = scanContent("self-test-allowed.env", allowedFixture, {
    includeProcessEnv: false,
    includeBareEnv: true,
  });

  if (forbiddenMatches.length < 8 || allowedMatches.length) {
    console.error("Tenant provider isolation self-test failed.");
    if (forbiddenMatches.length < 8) {
      console.error(`Expected at least 8 forbidden fixture matches, found ${forbiddenMatches.length}.`);
    }
    for (const match of allowedMatches) {
      console.error(`Unexpected allowed fixture match: ${match}`);
    }
    process.exit(1);
  }

  if (!silent) {
    console.log("Tenant provider isolation self-test passed.");
  }
}

if (process.argv.includes("--self-test")) {
  runSelfTest();
  process.exit(0);
}

runSelfTest({ silent: true });

const failures = [];

for (const relativeDir of sourceDirsToCheck) {
  const absoluteDir = join(repoRoot, relativeDir);
  for (const filePath of walk(absoluteDir)) {
    const content = readFileSync(filePath, "utf8");
    failures.push(...scanContent(filePath, content, { includeProcessEnv: true, includeBareEnv: false }));
  }
}

for (const relativeFile of textFilesToCheck) {
  const filePath = join(repoRoot, relativeFile);
  if (!existsSync(filePath)) {
    continue;
  }
  const content = readFileSync(filePath, "utf8");
  failures.push(...scanContent(filePath, content, { includeProcessEnv: false, includeBareEnv: true }));
}

if (failures.length) {
  console.error("Tenant provider isolation check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Tenant provider isolation check passed.");
