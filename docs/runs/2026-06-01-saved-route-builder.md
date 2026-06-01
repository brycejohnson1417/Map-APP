# Saved Route Builder Run Report

## Summary

Implemented issue #174 as a tenant-scoped saved route and call-list workflow. Territory selections can now be saved as durable route plans, `/routes` exposes route list/detail/edit/share/duplicate/archive/delete and stop completion controls, missing-coordinate accounts are preserved in a review bucket, and Rep Today opens the saved route workflow instead of only the temporary map preview.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | Screenprinting and Cannabis Wholesale |
| Tenant | FraterniTees and PICC compatible |
| Risk level | medium |

## Changed Files

- `DESIGN-SYSTEM.md`
- `app/api/runtime/organizations/[slug]/routes/**`
- `app/routes/page.tsx`
- `components/routes/saved-routes-workspace.tsx`
- `components/territory/territory-workspace.tsx`
- `lib/application/runtime/route-planning-core.ts`
- `lib/application/runtime/saved-route-service.ts`
- `lib/application/runtime/rep-today-service.ts`
- `lib/domain/runtime.ts`
- `lib/domain/workspace.ts`
- `lib/platform/workspace/registry.ts`
- `packages/territory-map-kit/manifest.json`
- `scripts/check-saved-route-builder.mjs`
- `scripts/test-saved-route-planner.mjs`
- `scripts/verify.mjs`
- `supabase/migrations/20260429120000_saved_route_plans.sql`
- `tests/browser/saved-routes.spec.ts`
- `docs/API_CONTRACTS.md`
- `docs/DATA_MODEL.md`

## Commands Run

```bash
node .agents/skills/preflight/scripts/preflight.ts
npm run check:saved-route-planner
npm run typecheck
npm run check:saved-route-builder
SMOKE_BASE_URL=http://localhost:3001 npx playwright test tests/browser/saved-routes.spec.ts
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Preflight | fail | Repo-local `.agents/skills/preflight/scripts/preflight.ts` is missing; manual branch, remote, and GitHub auth checks were used. |
| Typecheck | pass | `npm run typecheck` passed. |
| Saved route planner | pass | Deterministic nearest-neighbor and missing-coordinate review coverage passed. |
| Saved route contract | pass | Static route table/API/UI/docs/browser contract passed after docs and browser spec were added. |
| Lint | pass | `npm run lint` passed. |
| Tenant isolation | pass | `npm run verify` ran tenant provider isolation checks. |
| Self-contained docs | pass | `npm run verify` ran self-contained docs checks. |
| Tenant type docs | pass | `npm run verify` ran tenant type docs checks. |
| Build | pass | `npm run verify` ran `next build` successfully. |
| Smoke/browser | pass | Targeted saved-route Playwright spec passed with route write APIs intercepted. Full verify skipped browser by design because `PLAYWRIGHT_VERIFY=1` was not set. |

## Tenant Behavior Preserved

- FraterniTees: no Printavo, email, Meta, Google, or external provider writes are introduced. Route completion writes only app-owned route/activity/account metadata.
- PICC: route planning remains generic over tenant accounts and does not add screenprinting-specific assumptions.

## Acceptance Criteria

- [x] Rep can save selected territory accounts into a durable route.
- [x] Saved routes persist metadata, stop order, ownership, visibility, sharing targets, stats, and execution status.
- [x] Missing-coordinate accounts are shown in a review bucket.
- [x] Route list exposes create-from-map, edit/share, duplicate, archive, delete confirmation, and call-list completion controls.
- [x] Stop completion creates local account activity and updates completion state.
- [x] Rep Today opens the saved route/call-list workflow.
- [x] Full `npm run verify` and targeted browser execution passed before PR creation.

## Remaining Risk

- The migration has not been applied to production and should go through approval-lane review before deployment.
- The browser spec intercepts route write APIs to avoid real writes during validation; production route completion still needs safe app-owned database verification after approval.

## Follow-Up

- Run full repo verification and Playwright with `SMOKE_BASE_URL` once the local server is ready.
- Consider a future route rebuild/edit flow that can re-optimize an existing saved route from changed account selections.
