import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ts from "typescript";

const sourcePath = path.join(process.cwd(), "lib/application/auth/tenant-access-selection.ts");
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const tmp = await mkdtemp(path.join(tmpdir(), "map-app-tenant-access-"));
const modulePath = path.join(tmp, "tenant-access-selection.mjs");
await writeFile(modulePath, compiled);

try {
  const { selectMembershipOrganization } = await import(`file://${modulePath}`);

  const memberships = [
    { organizationId: "missing-org" },
    { organizationId: "alpha-org" },
    { organizationId: "beta-org" },
  ];
  const organizationsById = new Map([
    ["alpha-org", { id: "alpha-org", slug: "alpha" }],
    ["beta-org", { id: "beta-org", slug: "beta" }],
  ]);

  assert.deepEqual(selectMembershipOrganization({ memberships, organizationsById, requestedSlug: null }), {
    id: "alpha-org",
    slug: "alpha",
  });

  assert.deepEqual(selectMembershipOrganization({ memberships, organizationsById, requestedSlug: "beta" }), {
    id: "beta-org",
    slug: "beta",
  });

  assert.equal(selectMembershipOrganization({ memberships, organizationsById, requestedSlug: "gamma" }), null);
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log("Tenant access selection test passed.");
