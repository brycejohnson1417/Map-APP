# Remove Google Maps Runtime Key Usage

## Summary

Removed active Google Maps key usage from map-app for now so PICC and FraterniTees both use the OpenStreetMap/Open Geocoding path without reading prior generic or tenant Google Maps keys. The runtime map config now returns no browser API key, seed/CLI flows no longer request Google Maps env vars, and the tenant isolation check fails if active runtime files reintroduce Google Maps key names or Google Maps script URLs.

## Scope

| Field | Value |
|---|---|
| Lane | core / adapter / docs-ops |
| Tenant type | Screenprinting / Cannabis Wholesale |
| Tenant | FraterniTees / PICC |
| Risk level | medium |

## Changed Files

- `.env.example`
- `app/api/runtime/organizations/[slug]/territory/map-config/route.ts`
- `components/territory/territory-workspace.tsx`
- `lib/application/fraternitees/runtime-import-service.ts`
- `lib/application/runtime/geocode-accounts-service.ts`
- `lib/application/runtime/provider-credentials.ts`
- `lib/infrastructure/adapters/geocoding/geocoding.ts`
- `scripts/check-tenant-provider-isolation.mjs`
- `scripts/mapapp.mjs`
- `scripts/seed-runtime.mjs`
- setup, operating environment, API contract, ADR, tenant type, and PICC credential docs

## Commands Run

```bash
npm run check:tenant-isolation
npm run check:work-registry
npm run check:self-contained-requirements
npm run check:tenant-types
npm run typecheck
npm run lint
npm run verify
SMOKE_BASE_URL=http://localhost:3001 npm run smoke:runtime
SMOKE_BASE_URL=http://localhost:3001 PLAYWRIGHT_VERIFY=1 npm run verify:browser
SMOKE_BASE_URL=http://localhost:3001 npx playwright test tests/browser/runtime.spec.ts --grep "mobile territory hydrates"
node -e "<fetch /api/runtime/organizations/fraternitees/territory/map-config and assert openstreetmap/null key>"
node -e "<fetch /territory?org=fraternitees and assert no Google Maps script/key hits>"
```

## Results

| Check | Result | Notes |
|---|---|---|
| Typecheck | pass | `tsc --noEmit -p tsconfig.typecheck.json` |
| Lint | pass | `oxlint app components lib scripts --deny-warnings` |
| Tenant isolation | pass | Blocks active Google Maps env key names and Google Maps script URLs in runtime files |
| Self-contained docs | pass | via `npm run verify` |
| Tenant type docs | pass | via `npm run verify` |
| Build | pass | via `npm run verify` |
| Smoke/browser | pass | Runtime smoke passed against `http://localhost:3001`; Playwright browser suite passed 12/12 |
| Mobile territory console errors | pass | Added RED/GREEN Playwright coverage for hydration mismatch and duplicate React key warnings |
| Map config API | pass | FraterniTees returned `mapProvider: "openstreetmap"`, `browserApiKey: null`, `upgraded: false` |
| Territory HTML key/script scan | pass | `/territory?org=fraternitees` returned 200 with no `maps.googleapis.com` or Google Maps env key hits |

## Tenant Behavior Preserved

- FraterniTees: runtime map config returns OpenStreetMap with `browserApiKey: null`; Printavo and geocoding paths no longer read or describe Google Maps keys.
- PICC: runtime map config returns OpenStreetMap with `browserApiKey: null`; local `.env.local` no longer contains Google Maps key lines.
- External providers: validation did not send outbound emails, mutate Nabis, mutate Printavo, or trigger provider write-back/sync actions.

## Acceptance Criteria

- [x] Remove generic and tenant-scoped Google Maps key examples from active env setup.
- [x] Remove runtime browser Google Maps script loading and map rendering.
- [x] Remove server-side Google Maps geocoding key resolution.
- [x] Keep PICC and FraterniTees on OpenStreetMap with no Google Maps browser key in map config.
- [x] Add a static guard so active runtime files cannot reintroduce Google Maps key reads or script URLs.
- [x] Keep mobile territory rendering free of React hydration mismatch and duplicate-key console errors while validating the map surface.

## Remaining Risk

- Production Vercel/Supabase secrets were not modified in this run. Removing deployed environment variables or stored integration secrets is an approval-lane production secret operation.
- Historical migrations, enum values, and migration logs still mention Google Maps as historical context and were not rewritten.
- The in-app Browser plugin rejected `localhost:3001` under its URL policy, so visual verification used the repo Playwright suite instead of direct in-app Browser screenshots.

## Follow-Up

- Close the remaining tenant separation issues in separate issue-scoped branches.
