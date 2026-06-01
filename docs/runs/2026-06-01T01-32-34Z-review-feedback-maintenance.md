# Review Feedback Maintenance

## Summary

Addressed actionable review feedback from open generated PRs by moving applicable fixes into one maintained branch: requested-tenant login no longer falls back to unrelated memberships, change-request accordion controls keep valid mounted targets, PPP email previews render in a sandboxed accessible iframe with stable height, and local log files are ignored.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | medium |

## Changed Files

- `.gitignore`
- `DESIGN-SYSTEM.md`
- `components/accounts/ppp-savings-panel.tsx`
- `components/change-requests/change-request-list.tsx`
- `docs/runs/2026-06-01T01-32-34Z-review-feedback-maintenance.md`
- `lib/application/auth/membership-access.ts`
- `lib/application/auth/tenant-access.ts`
- `tests/unit/tenant-membership-selection.test.ts`

## Commands Run

```bash
node --test --experimental-strip-types tests/unit/tenant-membership-selection.test.ts
npm run typecheck
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Unit test | pass | Covered stale memberships, requested membership selection, and no unrelated fallback. |
| Typecheck | pass |  |
| Lint | pass |  |
| Tenant isolation | pass | Via `npm run verify`. |
| Self-contained docs | pass | Via `npm run verify`. |
| Tenant type docs | pass | Via `npm run verify`. |
| Build | pass | Via `npm run verify`; Next emitted the existing `--localstorage-file` warning during page-data collection. |
| Smoke/browser | pass | Manual browser checks against `http://127.0.0.1:3016`. |

## Tenant Behavior Preserved

- FraterniTees: login to a requested FraterniTees workspace remains allowed through matching membership or configured email domain.
- PICC: existing membership login remains unchanged when no requested slug is supplied.

## Acceptance Criteria

- [x] Applicable review feedback from PRs #100 and #107 is addressed in tenant access.
- [x] Duplicate accordion accessibility feedback from PRs #118, #144, and #147 is addressed in the current change-request UI.
- [x] PPP email preview feedback from PRs #124 and #129 is addressed with a titled, sandboxed, explicitly sized iframe.
- [x] Local dev logs are ignored for the hygiene feedback from PR #126.
- [x] Full repo verification passes.
- [x] Browser-facing behavior is checked in a live app.

## Remaining Risk

- PPP savings generation is slow for the checked PICC account; the request completed successfully and rendered the iframe after roughly one minute.

## Follow-Up

- Use this branch to close issue #154 after verification and PR review.
