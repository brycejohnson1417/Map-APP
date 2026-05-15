# Connection Hub MVP

## Summary

Started `BRY-12` / GitHub `#73` by turning the generic integrations panel into a tenant-facing Connection Hub and adding the first self-serve data path: CSV account import preview and tenant-scoped account import. This gives empty tenants like Dynalites a concrete way to add first account data instead of landing on blank map/account states.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | CPG Wholesale / none |
| Tenant | Dynalites proof path |
| Risk level | medium |

## Changed Files

- `app/api/runtime/organizations/[slug]/accounts/import/route.ts`
- `components/onboarding/workspace-integrations-panel.tsx`
- `lib/application/runtime/csv-account-import.ts`
- `tests/browser/connection-hub.spec.ts`
- `docs/API_CONTRACTS.md`
- `docs/WORK_REGISTRY.json`
- `docs/runs/2026-05-15-connection-hub-mvp.md`
- `docs/runs/artifacts/2026-05-15-connection-hub-preview.png`

## Commands Run

```bash
npm install
SMOKE_BASE_URL=https://map-app-supabase.vercel.app npx playwright test tests/browser/connection-hub.spec.ts
npm run typecheck
npm run lint
SMOKE_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/browser/connection-hub.spec.ts
SMOKE_BASE_URL=http://localhost:3001 npx playwright test tests/browser/connection-hub.spec.ts
npm run check:work-registry
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Typecheck | pass | `npm run typecheck` |
| Lint | pass | `npm run lint` |
| Tenant isolation | pass | `npm run verify` |
| Self-contained docs | pass | `npm run verify` |
| Tenant type docs | pass | `npm run verify` |
| Build | pass | `npm run verify`; existing `--localstorage-file` warning did not fail build |
| Smoke/browser | pass | New Connection Hub browser test passes against `http://localhost:3001` |

## Browser Proof

- `docs/runs/artifacts/2026-05-15-connection-hub-preview.png`

## Tenant Behavior Preserved

- FraterniTees: Existing fraternity integrations variant is untouched.
- PICC: Existing guided connectors remain guided and unchanged.

## Acceptance Criteria

- [x] Connection Hub is visible from the tenant integrations route.
- [x] Tenant can paste CSV rows and preview parsed accounts before saving.
- [x] Preview validation catches missing company name and missing usable location.
- [x] Tenant-session-protected server route exists for canonical account import.
- [x] Browser workflow covers visible preview and validation states.
- [x] Full `npm run verify` complete.

## Remaining Risk

- CSV commit endpoint is covered by typecheck and route shape, but the browser test intentionally stops before clicking commit to avoid mutating production-like Supabase data from a local browser run.
- Local Playwright hydration failed when using `127.0.0.1` because Next dev HMR websocket handshakes failed; using `localhost` worked.
- This is not yet a full CRM/order connector marketplace; it is the first import path.

## Follow-Up

- Add fixture-backed route tests for account import without touching live Supabase.
- Expand empty account/map pages to route users back to Connection Hub when no account data exists.
- Continue `BRY-12` with field mapping and first-source data health states.
