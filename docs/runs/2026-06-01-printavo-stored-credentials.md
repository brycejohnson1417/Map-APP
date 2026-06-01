# Printavo Stored Sync Credentials

## Summary

Runtime Printavo sync now resolves credentials only from the tenant's saved encrypted connector secret. The sync request body no longer accepts or uses `email` or `apiKey` overrides, and connector updates record integration audit events so credential changes remain visible through the tenant control-plane path.

## Scope

| Field | Value |
|---|---|
| Lane | adapter |
| Tenant type | Screenprinting |
| Tenant | FraterniTees |
| Risk level | medium |

## Changed Files

- `app/api/runtime/organizations/[slug]/printavo/sync/route.ts`
- `app/api/tenants/fraternitees/printavo/sync/route.ts`
- `app/api/runtime/organizations/[slug]/connectors/route.ts`
- `app/api/cron/printavo-daily/route.ts`
- `lib/application/fraternitees/printavo-sync-service.ts`
- `scripts/check-printavo-sync-credentials.mjs`
- `scripts/verify.mjs`
- `package.json`
- `docs/API_CONTRACTS.md`
- `docs/SETUP.md`
- `docs/runs/2026-06-01-printavo-stored-credentials.md`

## Commands Run

```bash
test -f .agents/skills/preflight/scripts/preflight.ts && node .agents/skills/preflight/scripts/preflight.ts || { echo 'preflight script missing: .agents/skills/preflight/scripts/preflight.ts'; exit 2; }
npm run check:printavo-sync-credentials
npm run typecheck
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Preflight | fail | Documented script is missing from this checkout. |
| RED credential guard | fail | Before implementation, the guard found request-body `email` and `apiKey` override usage. |
| GREEN credential guard | pass | After implementation, runtime and legacy FraterniTees sync routes only resolve saved connector credentials. |
| Typecheck | pass | `npm run typecheck` and verify step passed. |
| Lint | pass | `npm run lint` and verify step passed. |
| Tenant isolation | pass | `npm run verify` ran tenant isolation and self-test checks. |
| Printavo credential guard | pass | `npm run verify` ran `check:printavo-sync-credentials`. |
| Self-contained docs | pass | `npm run verify` passed. |
| Tenant type docs | pass | `npm run verify` passed. |
| Build | pass | `npm run verify` completed `next build`. |
| Smoke/browser | not run | No browser-facing UI changed in this slice; `SMOKE_BASE_URL` was unset. |

## Tenant Behavior Preserved

- FraterniTees: Printavo remains read-only. Sync can still run after the tenant saves Printavo connector credentials through the connector setup flow.
- PICC: No Nabis, email, or PICC runtime behavior changed.

## Acceptance Criteria

- [x] Printavo sync request bodies no longer accept or use `email` / `apiKey` overrides.
- [x] Missing tenant Printavo credentials return a clear setup error.
- [x] Credential changes happen only through the connector setup/update flow with tenant auth and integration audit events.
- [x] Tests prove request-body credentials are ignored or rejected without calling live Printavo.

## Remaining Risk

- Live Printavo sync was intentionally not invoked. This was a source-level and build-level safety fix only.

## Follow-Up

- Continue with the next oldest tenant-isolation issue after this PR is validated and merged or queued.
