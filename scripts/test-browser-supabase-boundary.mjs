import assert from "node:assert/strict";

import { findBrowserSupabaseBoundaryViolations } from "./lib/browser-supabase-boundary.mjs";

const safeFiles = [
  {
    path: "lib/supabase/client.ts",
    content: `
"use client";
import { createClient } from "@supabase/supabase-js";
export function getSupabaseBrowserClient() {
  return createClient("url", "key");
}
`,
  },
  {
    path: "components/territory/territory-workspace.tsx",
    content: `
"use client";
export function TerritoryWorkspace() {
  return null;
}
`,
  },
];

assert.deepEqual(findBrowserSupabaseBoundaryViolations(safeFiles), []);

const importViolations = findBrowserSupabaseBoundaryViolations([
  ...safeFiles,
  {
    path: "components/accounts/account-list.tsx",
    content: `
"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
export function AccountList() {
  return null;
}
`,
  },
]);

assert.equal(importViolations.length, 1);
assert.equal(importViolations[0].path, "components/accounts/account-list.tsx");
assert.match(importViolations[0].message, /browser Supabase helper/);

const relativeImportViolations = findBrowserSupabaseBoundaryViolations([
  ...safeFiles,
  {
    path: "components/accounts/account-detail.tsx",
    content: `
"use client";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
export function AccountDetail() {
  return null;
}
`,
  },
]);

assert.equal(relativeImportViolations.length, 1);
assert.equal(relativeImportViolations[0].path, "components/accounts/account-detail.tsx");
assert.match(relativeImportViolations[0].message, /browser Supabase helper/);

const callViolations = findBrowserSupabaseBoundaryViolations([
  ...safeFiles,
  {
    path: "lib/application/runtime/browser-query.ts",
    content: `
export function listAccounts() {
  return getSupabaseBrowserClient().from("account").select("*");
}
`,
  },
]);

assert.equal(callViolations.length, 1);
assert.equal(callViolations[0].path, "lib/application/runtime/browser-query.ts");
assert.match(callViolations[0].message, /direct browser Supabase calls/);

const sdkViolations = findBrowserSupabaseBoundaryViolations([
  ...safeFiles,
  {
    path: "components/runtime/browser-client.tsx",
    content: `
"use client";
import { createClient } from "@supabase/supabase-js";
export function RuntimeBrowserClient() {
  return null;
}
`,
  },
]);

assert.equal(sdkViolations.length, 1);
assert.equal(sdkViolations[0].path, "components/runtime/browser-client.tsx");
assert.match(sdkViolations[0].message, /Supabase SDK import/);

console.log("Browser Supabase boundary test passed.");
