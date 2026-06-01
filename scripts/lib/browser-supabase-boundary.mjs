import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const defaultAllowedPaths = new Set(["lib/supabase/admin.ts", "lib/supabase/client.ts"]);
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const ignoredDirectories = new Set([".git", ".next", "coverage", "dist", "node_modules", "playwright-report", "test-results"]);

function normalizePath(filePath) {
  return filePath.split(sep).join("/");
}

function hasSourceExtension(filePath) {
  return Array.from(sourceExtensions).some((extension) => filePath.endsWith(extension));
}

function isClientModule(content) {
  return /^\s*["']use client["'];?/m.test(content);
}

function importsBrowserSupabaseHelper(content) {
  return /from\s+["'](?:@\/lib\/supabase\/client|(?:\.\.?\/)+[^"']*lib\/supabase\/client)["']/.test(content);
}

export function collectBrowserBoundarySourceFiles(repoRoot, roots = ["app", "components", "lib"]) {
  const files = [];

  function walk(relativePath) {
    const absolutePath = join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      return;
    }

    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
          continue;
        }
        walk(join(relativePath, entry.name));
      }
      return;
    }

    if (!stats.isFile() || !hasSourceExtension(relativePath)) {
      return;
    }

    files.push({
      path: normalizePath(relative(repoRoot, absolutePath)),
      content: readFileSync(absolutePath, "utf8"),
    });
  }

  for (const root of roots) {
    walk(root);
  }

  return files;
}

export function findBrowserSupabaseBoundaryViolations(files, options = {}) {
  const allowedPaths = new Set(options.allowedPaths ?? defaultAllowedPaths);
  const violations = [];

  for (const file of files) {
    const filePath = normalizePath(file.path);
    if (allowedPaths.has(filePath)) {
      continue;
    }

    const content = file.content;

    if (importsBrowserSupabaseHelper(content)) {
      violations.push({
        path: filePath,
        message: "imports the browser Supabase helper before direct browser table policies exist",
      });
    }

    if (/\bgetSupabaseBrowserClient\s*\(/.test(content)) {
      violations.push({
        path: filePath,
        message: "contains direct browser Supabase calls before direct browser table policies exist",
      });
    }

    if ((filePath.startsWith("app/") || filePath.startsWith("components/") || isClientModule(content)) && /from\s+["']@supabase\/supabase-js["']/.test(content)) {
      violations.push({
        path: filePath,
        message: "contains a browser-reachable Supabase SDK import before direct browser table policies exist",
      });
    }
  }

  return violations;
}

export function formatBrowserSupabaseBoundaryViolations(violations) {
  return violations.map((violation) => `- ${violation.path}: ${violation.message}`).join("\n");
}
