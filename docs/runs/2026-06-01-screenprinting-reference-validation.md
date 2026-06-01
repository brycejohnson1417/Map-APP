# Screenprinting Same-Organization Reference Validation

## Summary

Screenprinting write services now validate related record ids against the active organization before insert/update or provider-side actions. Cross-organization references return a safe `400 invalid_screenprinting_reference` response instead of relying on table writes or provider calls to fail later.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | Screenprinting |
| Tenant | FraterniTees |
| Risk level | medium |

## Changed Files

- `lib/application/screenprinting/repository.ts`
- `lib/application/screenprinting/screenprinting-service.ts`
- `scripts/check-screenprinting-reference-validation.mjs`
- `scripts/verify.mjs`
- `package.json`
- `docs/API_CONTRACTS.md`
- `docs/runs/2026-06-01-screenprinting-reference-validation.md`

## Commands Run

```bash
test -f .agents/skills/preflight/scripts/preflight.ts && node .agents/skills/preflight/scripts/preflight.ts || { echo 'preflight script missing: .agents/skills/preflight/scripts/preflight.ts'; exit 2; }
npm run check:screenprinting-reference-validation
npm run typecheck
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Preflight | fail | Documented script is missing from this checkout. |
| RED reference guard | fail | Before implementation, the guard found no same-organization reference validator coverage. |
| GREEN reference guard | pass | After implementation, the guard verifies validator coverage for major write families. |
| Typecheck | pass | `npm run typecheck` and verify step passed. |
| Lint | pass | `npm run lint` and verify step passed. |
| Tenant isolation | pass | `npm run verify` ran tenant isolation and self-test checks. |
| Screenprinting reference validation | pass | `npm run verify` ran `check:screenprinting-reference-validation`. |
| Self-contained docs | pass | `npm run verify` passed. |
| Tenant type docs | pass | `npm run verify` passed. |
| Build | pass | `npm run verify` completed `next build`. |
| Smoke/browser | not run | No browser-facing UI changed in this slice; `SMOKE_BASE_URL` was unset. |

## Tenant Behavior Preserved

- FraterniTees: Screenprinting write surfaces still create product-owned opportunities, social accounts, draft posts, manual threads, and dashboards when references belong to the active organization.
- PICC: No Nabis, email, or PICC runtime behavior changed.

## Acceptance Criteria

- [x] Create/update paths validate same-org ownership for account, contact, order, opportunity, social account, social post, campaign, alert, and dashboard reference tables where applicable.
- [x] Invalid cross-org references are rejected with a safe `400` response.
- [x] Tests cover same-org reference validation guard coverage and rejected-reference behavior at the service boundary without live provider calls.
- [x] Follow-up migration plan is documented for composite constraints or equivalent DB enforcement.

## Follow-Up Migration Plan

- Add composite unique indexes on `(organization_id, id)` for tenant-owned referenced tables that do not already have equivalent keys.
- Add composite foreign keys from Screenprinting-owned records to referenced tenant tables, for example `(organization_id, account_id) -> account(organization_id, id)`.
- Apply those DB constraints in a separate approval-lane migration PR after auditing existing rows for cross-org or dangling references.
- Keep the service-layer validator even after DB constraints land so API callers receive safe 400-level errors instead of raw database errors.

## Remaining Risk

- This PR adds service-layer validation only. Database composite constraints remain a separate approval-lane follow-up after row audit.

## Follow-Up

- Continue with database-backed composite constraints after row-level audit and explicit migration approval.
