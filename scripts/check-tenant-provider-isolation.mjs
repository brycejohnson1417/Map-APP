import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;

const filesToCheck = [
  "app/api/runtime",
  "lib/application/runtime",
  "lib/application/fraternitees",
  "lib/infrastructure/adapters/geocoding",
];

const forbiddenPatterns = [
  { label: "generic Google Maps browser key", pattern: /\bprocess\.env\.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY\b|\bprocess\.env\.GOOGLE_MAPS_BROWSER_API_KEY\b/g },
  { label: "generic Google Maps server key", pattern: /\bprocess\.env\.GOOGLE_MAPS_SERVER_API_KEY\b/g },
  { label: "generic Nabis API key", pattern: /\bprocess\.env\.NABIS_API_KEY\b/g },
  { label: "generic Nabis API base URL", pattern: /\bprocess\.env\.NABIS_API_BASE_URL\b/g },
  { label: "generic Nabis orders path", pattern: /\bprocess\.env\.NABIS_ORDERS_PATH\b/g },
  { label: "generic Nabis inventory path", pattern: /\bprocess\.env\.NABIS_INVENTORY_PATH\b/g },
  { label: "generic Notion token", pattern: /\bprocess\.env\.NOTION_TOKEN\b/g },
  { label: "generic Printavo API key", pattern: /\bprocess\.env\.PRINTAVO_API_KEY\b|\bprocess\.env\.PRINTAVO_TOKEN\b/g },
  { label: "generic Printavo email", pattern: /\bprocess\.env\.PRINTAVO_EMAIL\b/g },
  { label: "generic HubSpot token", pattern: /\bprocess\.env\.HUBSPOT_(?:API_KEY|ACCESS_TOKEN|PRIVATE_APP_TOKEN)\b/g },
  { label: "generic Salesforce credential", pattern: /\bprocess\.env\.SALESFORCE_(?:CLIENT_ID|CLIENT_SECRET|USERNAME|PASSWORD|SECURITY_TOKEN|ACCESS_TOKEN|REFRESH_TOKEN)\b/g },
  { label: "generic HighLevel credential", pattern: /\bprocess\.env\.(?:HIGHLEVEL|GHL)_(?:API_KEY|ACCESS_TOKEN|LOCATION_ID)\b/g },
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

const failures = [];

for (const relativeDir of filesToCheck) {
  const absoluteDir = join(repoRoot, relativeDir);
  for (const filePath of walk(absoluteDir)) {
    const content = readFileSync(filePath, "utf8");
    for (const rule of forbiddenPatterns) {
      const matches = [...content.matchAll(rule.pattern)];
      for (const match of matches) {
        const before = content.slice(0, match.index ?? 0);
        const line = before.split("\n").length;
        failures.push(`${filePath}:${line} uses ${rule.label}`);
      }
    }
  }
}

if (failures.length) {
  console.error("Tenant provider isolation check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Tenant provider isolation check passed.");
