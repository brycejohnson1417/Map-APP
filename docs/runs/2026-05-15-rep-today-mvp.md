# Rep Today MVP

## Summary

Added a tenant-aware Rep Today command center and routed tenant login into it so reps land on prioritized work instead of a generic data table. The page uses existing runtime/account, screenprinting, social, and cleanup services; empty tenants are sent directly to Connection Hub setup.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | Screenprinting / Cannabis Wholesale |
| Tenant | FraterniTees / Dynalites / PICC |
| Risk level | medium |

## Changed Files

- `.gitignore`
- `app/today/page.tsx`
- `components/today/rep-today-workspace.tsx`
- `lib/application/auth/tenant-routing.ts`
- `lib/application/runtime/rep-today-service.ts`
- `tenants/dynalites/workspace.json`
- `tenants/field-ops-starter/workspace.json`
- `tenants/fraternitees/workspace.json`
- `tenants/picc/workspace.json`
- `tenants/second-screenprinter/workspace.json`
- `tests/browser/rep-today.spec.ts`
- `docs/WORK_REGISTRY.json`
- `docs/runs/2026-05-15-rep-today-mvp.md`

## Commands Run

```bash
SMOKE_BASE_URL=http://localhost:3002 npx playwright test tests/browser/rep-today.spec.ts
npm run typecheck
npm run lint
npm run check:work-registry
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Typecheck | pass | `npm run typecheck`; also covered by `npm run verify`. |
| Lint | pass | `npm run lint`; also covered by `npm run verify`. |
| Tenant isolation | pass | Covered by `npm run verify`. |
| Self-contained docs | pass | Covered by `npm run verify`. |
| Tenant type docs | pass | Covered by `npm run verify`. |
| Build | pass | Covered by `npm run verify`. |
| Smoke/browser | pass | Rep Today login route, data-backed FraterniTees actions, and empty Dynalites setup route passed. |

## Browser Evidence

- `docs/runs/artifacts/2026-05-15-rep-today-fraternitees.png`

## Tenant Behavior Preserved

- FraterniTees: login now lands on Rep Today with action cards linking to reorders, opportunities, route mode, cleanup, and social signals.
- Dynalites: login now lands on Rep Today setup state and routes directly to Connection Hub while the tenant has no account data.
- PICC: default workspace route now points to Rep Today, with existing territory/map pages still linked through navigation.

## Acceptance Criteria

- [x] Tenant login lands on Rep Today.
- [x] Data-backed tenants see concrete action cards for due work, opportunities, route mode, social signals, and cleanup.
- [x] Empty tenants see a setup-first state that links directly to Connection Hub.
- [x] The page uses real tenant runtime data, not mock data.

## Remaining Risk

- First compile in local dev can still be slow under Next/Turbopack, especially when loading FraterniTees screenprinting aggregates.
- The Rep Today action model is intentionally first-pass and should become configurable after the Tenant Control Center slice.

## Follow-Up

- Continue with identity resolution (#74) or wholesale signals (#76) after #75 is merged.
