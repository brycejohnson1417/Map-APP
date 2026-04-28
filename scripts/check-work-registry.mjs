import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;
const registryPath = "docs/WORK_REGISTRY.json";
const absoluteRegistryPath = join(repoRoot, registryPath);
const failures = [];

function fail(message) {
  failures.push(message);
}

if (!existsSync(absoluteRegistryPath)) {
  fail(`${registryPath} is missing`);
}

let registry = null;

if (existsSync(absoluteRegistryPath)) {
  try {
    registry = JSON.parse(readFileSync(absoluteRegistryPath, "utf8"));
  } catch (error) {
    fail(`${registryPath} is not valid JSON: ${error.message}`);
  }
}

const allowedStatuses = new Set(["planned", "ready", "in_progress", "blocked", "done"]);
const allowedPriorities = new Set(["P0", "P1", "P2", "P3", "future"]);

function requireArray(item, field) {
  if (!Array.isArray(item[field])) {
    fail(`${item.id ?? "unknown item"} must define ${field} as an array`);
    return [];
  }

  if (item[field].length === 0) {
    fail(`${item.id} must include at least one ${field} entry`);
  }

  return item[field];
}

if (registry) {
  if (registry.schema_version !== 1) {
    fail(`${registryPath} must have schema_version 1`);
  }

  if (!Array.isArray(registry.authority_order) || registry.authority_order.length < 5) {
    fail(`${registryPath} must define an authority_order with at least five entries`);
  }

  if (!Array.isArray(registry.execution_rules) || registry.execution_rules.length < 3) {
    fail(`${registryPath} must define execution_rules`);
  }

  if (!Array.isArray(registry.items) || registry.items.length === 0) {
    fail(`${registryPath} must define at least one work item`);
  }

  const ids = new Set();
  const itemsById = new Map();

  for (const item of registry.items ?? []) {
    if (!item.id || typeof item.id !== "string") {
      fail("Every work item must include a string id");
      continue;
    }

    if (ids.has(item.id)) {
      fail(`Duplicate work item id: ${item.id}`);
    }

    ids.add(item.id);
    itemsById.set(item.id, item);

    for (const field of ["title", "status", "phase", "priority", "type", "description"]) {
      if (!item[field] || typeof item[field] !== "string") {
        fail(`${item.id} must include string field ${field}`);
      }
    }

    if (item.status && !allowedStatuses.has(item.status)) {
      fail(`${item.id} has invalid status ${item.status}`);
    }

    if (item.priority && !allowedPriorities.has(item.priority)) {
      fail(`${item.id} has invalid priority ${item.priority}`);
    }

    if (!Array.isArray(item.dependencies)) {
      fail(`${item.id} must define dependencies as an array`);
    }

    if (!Array.isArray(item.blocking_foundation)) {
      fail(`${item.id} must define blocking_foundation as an array`);
    }

    requireArray(item, "acceptance_criteria");
    requireArray(item, "verification_commands");
    requireArray(item, "docs_to_update");
    requireArray(item, "stop_conditions");
    requireArray(item, "safe_defaults");
  }

  for (const item of registry.items ?? []) {
    if (!item.id) {
      continue;
    }

    for (const dependencyId of item.dependencies ?? []) {
      if (!itemsById.has(dependencyId)) {
        fail(`${item.id} depends on unknown work item ${dependencyId}`);
        continue;
      }

      const dependency = itemsById.get(dependencyId);
      if (item.status === "ready" && dependency.status !== "done") {
        fail(`${item.id} is ready but dependency ${dependencyId} is ${dependency.status}`);
      }
    }

    for (const foundationId of item.blocking_foundation ?? []) {
      if (!itemsById.has(foundationId)) {
        fail(`${item.id} lists unknown blocking foundation ${foundationId}`);
      }
    }

    for (const docPath of item.docs_to_update ?? []) {
      if (!existsSync(join(repoRoot, docPath))) {
        fail(`${item.id} references missing docs_to_update path ${docPath}`);
      }
    }
  }
}

if (failures.length) {
  console.error("Work registry check failed.\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Work registry check passed.");
