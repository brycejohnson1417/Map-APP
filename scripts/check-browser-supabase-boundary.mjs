import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  collectBrowserBoundarySourceFiles,
  findBrowserSupabaseBoundaryViolations,
  formatBrowserSupabaseBoundaryViolations,
} from "./lib/browser-supabase-boundary.mjs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const files = collectBrowserBoundarySourceFiles(repoRoot);
const violations = findBrowserSupabaseBoundaryViolations(files);

if (violations.length) {
  console.error("Browser Supabase boundary check failed.\n");
  console.error(formatBrowserSupabaseBoundaryViolations(violations));
  console.error(
    `\nDirect browser Supabase access requires committed tenant RLS policies and an updated ${join("docs", "adr", "0009-rls-pattern-with-clerk-and-supabase.md")}.`,
  );
  process.exit(1);
}

console.log("Browser Supabase boundary check passed.");
