# Review Feedback Maintenance Run

## Summary

Issue #154 collected actionable review comments from older generated PRs. Current `main` had already resolved the change-request `aria-controls` issue, the PPP iframe accessibility/sizing issue, and the tracked `dev_server.log` issue. The remaining live defect was tenant login selection: when `/login?org=<slug>` requested a specific workspace, an email with memberships in other workspaces could still fall back into an unrelated tenant. This run constrains membership, domain, and template fallback behavior to the requested slug.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | none |
| Tenant | none |
| Risk level | medium |

## Changed Files

- `lib/application/auth/tenant-access.ts`
- `lib/application/auth/tenant-access-selection.ts`
- `scripts/test-tenant-access-selection.mjs`
- `scripts/verify.mjs`
- `package.json`
- `docs/runs/2026-06-01-review-feedback-maintenance.md`

## Commands Run

```bash
gh api repos/brycejohnson1417/Map-APP/pulls/100/comments
gh api repos/brycejohnson1417/Map-APP/pulls/107/comments
gh api repos/brycejohnson1417/Map-APP/pulls/118/comments
gh api repos/brycejohnson1417/Map-APP/pulls/144/comments
gh api repos/brycejohnson1417/Map-APP/pulls/147/comments
gh api repos/brycejohnson1417/Map-APP/pulls/124/comments
gh api repos/brycejohnson1417/Map-APP/pulls/129/comments
gh api repos/brycejohnson1417/Map-APP/pulls/126/comments
node scripts/test-tenant-access-selection.mjs
npm run check:tenant-access
npm run typecheck
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| RED test | pass | `node scripts/test-tenant-access-selection.mjs` failed before the helper existed. |
| Focused tenant access test | pass | `npm run check:tenant-access` passed after the fix. |
| Typecheck | pass | `npm run typecheck` passed. |
| Lint | pass | `npm run lint` passed with 0 warnings and 0 errors. |
| Tenant isolation | pass | Covered by `npm run verify`. |
| Self-contained docs | pass | Covered by `npm run verify`. |
| Tenant type docs | pass | Covered by `npm run verify`. |
| Build | pass | Covered by `npm run verify`. |
| Smoke/browser | not run | No rendered UI markup changed in this slice. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, issues, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Actionable review threads from PRs #100, #107, #118/#144/#147, #124/#129, and #126 were checked against current `main`.
- [x] Focused test covers requested tenant membership fallback behavior.
- [x] Existing validation passes with `npm run verify`.
- [x] Browser/UI behavior checked for applicability; no rendered UI markup changes remained necessary.

## Remaining Risk

- This fix does not introduce full tenant authorization or RLS. Those are tracked separately in the security issues and remain approval-lane work.

## Follow-Up

- Continue with the dedicated security/tenant-isolation issues for broader authorization hardening.
