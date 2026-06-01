import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

async function importTypeScriptModule(sourcePath) {
  const source = await readFile(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
    fileName: sourcePath,
  });
  const directory = await mkdtemp(join(tmpdir(), "map-app-route-planner-"));
  const modulePath = join(directory, "route-planning-core.mjs");
  await writeFile(modulePath, output.outputText, "utf8");
  const imported = await import(`file://${modulePath}`);
  await rm(directory, { recursive: true, force: true });
  return imported;
}

const {
  buildOptimizedRoutePreview,
  createRouteStopSnapshots,
} = await importTypeScriptModule(fileURLToPath(new URL("../lib/application/runtime/route-planning-core.ts", import.meta.url)));

const preview = buildOptimizedRoutePreview({
  start: { label: "Warehouse", latitude: 40.7128, longitude: -74.006 },
  stops: [
    { accountId: "far-stop", name: "Far Stop", city: "Philadelphia", state: "PA", latitude: 39.9526, longitude: -75.1652 },
    { accountId: "missing-stop", name: "Missing Stop", city: "No Coord", state: "NY", latitude: null, longitude: null },
    { accountId: "near-stop", name: "Near Stop", city: "Jersey City", state: "NJ", latitude: 40.7178, longitude: -74.0431 },
    { accountId: "mid-stop", name: "Mid Stop", city: "Newark", state: "NJ", latitude: 40.7357, longitude: -74.1724 },
  ],
});

assert.deepEqual(
  preview.orderedStops.map((stop) => stop.accountId),
  ["near-stop", "mid-stop", "far-stop"],
  "planner should order mappable stops by nearest-neighbor distance from the start",
);
assert.deepEqual(
  preview.reviewStops.map((stop) => stop.accountId),
  ["missing-stop"],
  "planner should keep missing-coordinate stops in a visible review bucket",
);
assert.equal(preview.excludedStopCount, 1, "planner should count excluded unmappable stops");
assert.ok(preview.estimatedDistanceMiles > 80, "planner should estimate meaningful route mileage");
assert.ok(preview.estimatedDurationMinutes > 90, "planner should estimate meaningful route duration");

const snapshots = createRouteStopSnapshots(preview);
assert.deepEqual(
  snapshots.map((stop) => ({ accountId: stop.accountId, stopIndex: stop.stopIndex, status: stop.status })),
  [
    { accountId: "near-stop", stopIndex: 1, status: "planned" },
    { accountId: "mid-stop", stopIndex: 2, status: "planned" },
    { accountId: "far-stop", stopIndex: 3, status: "planned" },
    { accountId: "missing-stop", stopIndex: 4, status: "needs_review" },
  ],
  "route stop snapshots should persist execution order and missing-coordinate review state",
);

console.log("Saved route planner checks passed.");
