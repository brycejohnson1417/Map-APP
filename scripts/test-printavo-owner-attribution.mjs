import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label} missing expected snippet: ${expected}`);
  }
}

const printavoClient = read("lib/infrastructure/adapters/printavo/client.ts");
const leadScoring = read("lib/application/fraternitees/lead-scoring.ts");
const runtimeImport = read("lib/application/fraternitees/runtime-import-service.ts");

assertIncludes(printavoClient, "owner: {", "Printavo order node type");
assertIncludes(printavoClient, "owner { id name email }", "Printavo GraphQL order query");
assertIncludes(printavoClient, "ownerId: order.owner?.id ?? null", "Printavo order mapper owner id");
assertIncludes(printavoClient, "ownerName: order.owner?.name ?? null", "Printavo order mapper owner name");
assertIncludes(printavoClient, "ownerEmail: order.owner?.email ?? null", "Printavo order mapper owner email");

assertIncludes(leadScoring, "ownerId?: string | null;", "FraterniTees lead order owner id");
assertIncludes(leadScoring, "ownerName?: string | null;", "FraterniTees lead order owner name");
assertIncludes(leadScoring, "ownerEmail?: string | null;", "FraterniTees lead order owner email");

assertIncludes(runtimeImport, "ownerId: stringOrNull(payload.ownerId)", "Source payload owner id hydration");
assertIncludes(runtimeImport, "ownerName: stringOrNull(payload.ownerName)", "Source payload owner name hydration");
assertIncludes(runtimeImport, "ownerEmail: stringOrNull(payload.ownerEmail)", "Source payload owner email hydration");
assertIncludes(runtimeImport, "sales_rep_name: order.ownerName ?? null", "Runtime order owner attribution");

console.log("Printavo owner attribution mapping is covered.");
