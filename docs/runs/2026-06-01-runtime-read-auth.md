# Runtime Read Authorization

## Summary

Tenant runtime organization APIs now require the shared tenant-session authorization guard before returning tenant payloads. The change closes unauthenticated slug-based reads for organization snapshots, accounts, territory data, sync status, plugin settings, Printavo status/config, and screenprinting dashboards while keeping the signed Meta OAuth callback documented as the intentional non-data compatibility exception.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | none |
| Tenant | none |
| Risk level | high |

## Changed Files

- `lib/application/auth/runtime-authorization.ts`
- `app/api/runtime/organizations/[slug]/**/route.ts`
- `app/api/runtime/organizations/[slug]/screenprinting/_shared.ts`
- `scripts/smoke-runtime-auth.mjs`
- `scripts/smoke-runtime.mjs`
- `package.json`
- `docs/API_CONTRACTS.md`
- `docs/runs/2026-06-01-runtime-read-auth.md`

## Commands Run

```bash
node .agents/skills/preflight/scripts/preflight.ts
SMOKE_BASE_URL=http://localhost:3001 NEXT_PUBLIC_DEFAULT_ORG_SLUG=fraternitees npm run smoke:runtime-auth
npm run typecheck
npm run lint
npm run verify
SMOKE_BASE_URL=http://localhost:3001 NEXT_PUBLIC_DEFAULT_ORG_SLUG=fraternitees PLAYWRIGHT_VERIFY=1 npm run verify:browser
```

Additional local check: a Node heredoc scanned all `app/api/runtime/organizations/[slug]/**/route.ts` files and failed if a non-callback route lacked the shared auth guard path.

## Results

| Check | Result | Notes |
|---|---|---|
| RED auth smoke | pass | New smoke check failed before implementation because unauthenticated `/api/runtime/organizations/fraternitees` returned `200` with a tenant snapshot. |
| Runtime auth smoke | pass | Unauthenticated representative reads deny with 401/403; active tenant reads allow; active FraterniTees session denied against `picc`. |
| Route guard coverage | pass | 53 slug-scoped runtime route files checked; Meta OAuth callback is the documented exception. |
| Typecheck | pass | `npm run typecheck` passed. |
| Lint | pass | `npm run lint` passed with zero warnings after fixing smoke-script spread warnings. |
| Tenant isolation | pass | `npm run verify` passed `check:tenant-isolation`. |
| Self-contained docs | pass | `npm run verify` passed `check:self-contained-requirements` after restoring the required sentinel phrase. |
| Tenant type docs | pass | `npm run verify` passed `check:tenant-types`. |
| Build | pass | `npm run verify` passed `next build`; the existing `--localstorage-file` warning still appears during build. |
| Smoke/browser | pass | Read-only auth smoke passed; full Playwright browser verification passed 11/11 on rerun. |

## Tenant Behavior Preserved

- FraterniTees: active tenant sessions can still read the runtime, territory, sync, plugin, Printavo status, and screenprinting API payloads. No Printavo sync, preview, provider write, or email-send action was run for validation.
- PICC: a FraterniTees session is denied when reading PICC runtime routes. No Nabis, provider write, or production mutation was run for validation.

## Acceptance Criteria

- [x] Tenant data routes under `/api/runtime/organizations/[slug]` require a shared tenant authorization guard.
- [x] Public/non-data exceptions are documented.
- [x] Unauthorized requests receive 401/403 and do not return representative tenant payloads.
- [x] Tests cover denied reads for another tenant slug and allowed reads for the active tenant.
- [x] `npm run verify` passes.
- [x] Browser smoke after auth passes.

## Remaining Risk

- This is an auth/access-control change and should stay approval-lane before merge.
- The documented preflight command is missing in this checkout, so full repo preflight could not run.
- The first full Playwright run had one mobile territory timing failure; the same test passed in isolation and the full suite passed 11/11 on rerun.

## Follow-Up

- Replace or restore the missing `.agents/skills/preflight/scripts/preflight.ts` path so the repo proof gate can run without manual fallback.
