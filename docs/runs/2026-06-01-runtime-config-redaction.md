# Runtime Integration Config Redaction

## Summary

Runtime organization snapshots now return sanitized integration summaries instead of raw `integration.config` objects. The organization snapshot and map-config API routes require tenant-session access, and the map-config route no longer queries `integration_installation.config` directly.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | none |
| Tenant | none |
| Risk level | medium |

## Changed Files

- `app/api/runtime/organizations/[slug]/route.ts`
- `app/api/runtime/organizations/[slug]/territory/map-config/route.ts`
- `lib/application/runtime/organization-service.ts`
- `lib/domain/runtime.ts`
- `scripts/check-runtime-config-redaction.mjs`
- `scripts/smoke-runtime.mjs`
- `scripts/verify.mjs`
- `package.json`
- `docs/API_CONTRACTS.md`
- `docs/runs/2026-06-01-runtime-config-redaction.md`

## Commands Run

```bash
test -f .agents/skills/preflight/scripts/preflight.ts && node .agents/skills/preflight/scripts/preflight.ts || { echo 'preflight script missing: .agents/skills/preflight/scripts/preflight.ts'; exit 2; }
npm run check:runtime-config-redaction
npm run typecheck
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Preflight | fail | Documented script is missing from this checkout. |
| RED config guard | fail | Before implementation, the guard found raw runtime integration config exposure and unauthenticated config routes. |
| GREEN config guard | pass | After implementation, the guard verifies snapshot redaction and tenant-session route gates. |
| Typecheck | pass | `npm run typecheck` and verify step passed. |
| Lint | pass | `npm run lint` and verify step passed. |
| Tenant isolation | pass | `npm run verify` ran tenant isolation and self-test checks. |
| Runtime config redaction | pass | `npm run verify` ran `check:runtime-config-redaction`. |
| Self-contained docs | pass | `npm run verify` passed. |
| Tenant type docs | pass | `npm run verify` passed. |
| Build | pass | `npm run verify` completed `next build`. |
| Smoke/browser | not run | No browser-facing UI changed; `SMOKE_BASE_URL` was unset. |

## Tenant Behavior Preserved

- FraterniTees: Runtime integration counts/status remain visible after tenant login. Raw connector config is no longer in the runtime snapshot payload.
- PICC: No Nabis, email, Printavo, or production provider action changed or ran.

## Acceptance Criteria

- [x] Organization runtime snapshots do not return raw `integration.config` objects.
- [x] Map config and connector payloads expose only the minimum authenticated browser-safe data needed by the UI.
- [x] Server-side secrets remain only in encrypted integration secret storage.
- [x] Tests prove unauthenticated and cross-tenant requests cannot read connector config by route gating plus payload redaction.

## Remaining Risk

- This branch overlaps with the broader runtime-read authorization PR. Rebase carefully if that approval-lane PR merges first.

## Follow-Up

- Reconcile this branch with the broader runtime-read auth PR if that approval-lane PR merges first.
