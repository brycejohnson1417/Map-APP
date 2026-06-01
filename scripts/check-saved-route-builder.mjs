import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "supabase/migrations/20260429120000_saved_route_plans.sql",
    patterns: ["public.route_plan", "public.route_stop", "enable row level security", "route_stop_completed"],
  },
  {
    file: "lib/application/runtime/saved-route-service.ts",
    patterns: ["route_plan", "route_stop", "activity_type: \"route_stop_completed\"", "canReadRoute", "canManageRoute"],
    absent: ["printavo", "nabis", "sendEmail", "smtp"],
  },
  {
    file: "app/api/runtime/organizations/[slug]/routes/route.ts",
    patterns: ["getTenantSessionEmailForSlug", "createSavedRoute", "listSavedRoutes"],
  },
  {
    file: "app/api/runtime/organizations/[slug]/routes/[routeId]/stops/[stopId]/complete/route.ts",
    patterns: ["getTenantSessionEmailForSlug", "completeSavedRouteStop"],
  },
  {
    file: "components/territory/territory-workspace.tsx",
    patterns: ["Save route", "Missing coordinates", "/routes", "/api/runtime/organizations/${orgSlug}/routes"],
  },
  {
    file: "components/routes/saved-routes-workspace.tsx",
    patterns: ["Create from map", "Duplicate", "Archive", "Confirm delete", "Complete stop", "Coordinate review bucket", "Unsaved"],
  },
  {
    file: "components/today/rep-today-workspace.tsx",
    patterns: ["Open route mode"],
  },
  {
    file: "lib/application/runtime/rep-today-service.ts",
    patterns: ["orgHref(\"/routes\", orgSlug)"],
  },
  {
    file: "tests/browser/saved-routes.spec.ts",
    patterns: ["complete stop", "coordinate review bucket", "/complete"],
  },
  {
    file: "docs/API_CONTRACTS.md",
    patterns: ["GET /api/runtime/organizations/[slug]/routes", "POST /api/runtime/organizations/[slug]/routes", "route_stop_completed"],
  },
  {
    file: "docs/DATA_MODEL.md",
    patterns: ["public.route_plan", "public.route_stop"],
  },
];

for (const check of checks) {
  const body = await readFile(new URL(`../${check.file}`, import.meta.url), "utf8");
  for (const pattern of check.patterns) {
    if (!body.includes(pattern)) {
      throw new Error(`${check.file} is missing required saved-route contract: ${pattern}`);
    }
  }
  for (const pattern of check.absent ?? []) {
    if (body.toLowerCase().includes(pattern.toLowerCase())) {
      throw new Error(`${check.file} must not reference provider/email side effect: ${pattern}`);
    }
  }
}

console.log("Saved route builder contract checks passed.");
