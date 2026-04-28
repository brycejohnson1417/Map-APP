# Screenprinting Foundation Run

## Summary

Implemented the current non-future Screenprinting registry queue from architecture runway through second-tenant proof. The build adds typed configuration, adapter boundaries, feature flags, audit/activity hooks, additive data migration, API contracts, MVP UI, fixture-backed acceptance checks, and documentation updates while preserving existing FraterniTees and PICC paths.

## Scope

| Field | Value |
|---|---|
| Lane | core / adapter / tenant type / tenant-specific / docs-ops |
| Tenant type | Screenprinting |
| Tenant | FraterniTees plus second-screenprinter proof |
| Risk level | medium |

## Changed Files

- `lib/application/screenprinting/*`
- `lib/infrastructure/adapters/printavo/ordering-adapter.ts`
- `lib/infrastructure/adapters/social/manual-social-adapter.ts`
- `app/api/runtime/organizations/[slug]/screenprinting/*`
- `app/screenprinting/page.tsx`
- `components/screenprinting/screenprinting-workspace.tsx`
- `supabase/migrations/20260427120000_screenprinting_foundation.sql`
- `tenants/fraternitees/workspace.json`
- `tenants/second-screenprinter/workspace.json`
- `scripts/check-screenprinting-foundation.mjs`
- `docs/WORK_REGISTRY.json`
- Screenprinting, roadmap, TODO, status, tenant schema, and tenant decision docs

## Commands Run

```bash
npm run verify
node scripts/check-screenprinting-foundation.mjs
npm run lint
npm run typecheck
SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke:runtime
SMOKE_BASE_URL=http://127.0.0.1:3000 PLAYWRIGHT_VERIFY=1 npm run verify:browser
```

## Results

| Check | Result | Notes |
|---|---|---|
| Typecheck | pass | Included in `npm run verify`. |
| Lint | pass | `oxlint` found 0 warnings and 0 errors. |
| Tenant isolation | pass | Existing provider credential isolation check passed. |
| Work registry | pass | Registry validates with all non-future Screenprinting items done. |
| Screenprinting foundation | pass | New fixture/static acceptance check passed. |
| Self-contained docs | pass | Existing docs check passed. |
| Tenant type docs | pass | Existing tenant type docs check passed. |
| Build | pass | Next build includes `/screenprinting` and all Screenprinting API routes. |
| Smoke/browser | pass | Local runtime smoke passed; Playwright browser suite passed 8 tests; explicit `/screenprinting` checks passed for FraterniTees and second-screenprinter. |

## Tenant Behavior Preserved

- FraterniTees: existing Printavo preview/sync calls now use the ordering adapter boundary but keep read-only behavior and existing response shapes.
- PICC: no Cannabis Wholesale/PICC route or workflow behavior was changed.

## Acceptance Criteria

- [x] Config defaults, validation, impact preview, history, and tenant override path exist.
- [x] Ordering, social, and catalog adapter contracts exist.
- [x] Printavo sync/preview goes through the read-only ordering adapter.
- [x] Manual social fallback exists.
- [x] Screenprinting feature flags are tenant-scoped.
- [x] Risky product-owned actions have audit/activity hook paths.
- [x] Additive Screenprinting tables include `organization_id` and RLS enablement.
- [x] Screenprinting API and MVP UI exist.
- [x] Identity resolution remains non-destructive.
- [x] Second Screenprinting tenant seed compiles without a tenant-specific code branch.

## Remaining Risk

- Admin-only role enforcement is still tenant-session gated until final role policy is implemented.
- MVP UI is intentionally compact; deeper per-screen workflows should follow tenant feedback.

## Follow-Up

- Add service-level edge-case tests for mapping, reorders, alerts, draft templates, and identity resolution.
- Keep future catalog/profitability/art/warehouse items planned until explicitly promoted.

## 2026-04-28 Migration Follow-Up

- Applied `20260427120000_screenprinting_foundation.sql` and `20260428100000_meta_instagram_provider.sql` to the linked Supabase project with `supabase db push --yes`.
