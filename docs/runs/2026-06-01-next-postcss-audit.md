# Next/PostCSS Audit Run

## Summary

Issue #34 tracked npm audit findings where the stable Next.js line still bundled a vulnerable PostCSS version and npm's automatic fix suggested an unsafe downgrade to Next 9. This run updates Next from `16.2.3` to `16.3.0-canary.36`, the current canary that bundles `postcss@8.5.10`, and keeps the change scoped to dependency metadata.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | none |
| Tenant | none |
| Risk level | medium |

## Changed Files

- `package.json`
- `package-lock.json`
- `docs/runs/2026-06-01-next-postcss-audit.md`

## Commands Run

```bash
npm view next version dist-tags --json
npm view next@16.3.0-canary.36 dependencies.postcss peerDependencies optionalDependencies --json
npm install --save-exact next@16.3.0-canary.36
npm audit --omit=dev --json
npm run typecheck
npm run lint
npm run build
npm run verify
SMOKE_BASE_URL=http://localhost:3001 npx playwright test tests/browser/runtime.spec.ts --grep "core runtime pages load"
```

## Results

| Check | Result | Notes |
|---|---|---|
| Audit | pass | `npm audit --omit=dev --json` reported 0 vulnerabilities after the canary update. |
| Typecheck | pass | `npm run typecheck` passed. |
| Lint | pass | `npm run lint` passed with 0 warnings and 0 errors. |
| Tenant isolation | pass | Covered by `npm run verify`. |
| Self-contained docs | pass | Covered by `npm run verify`. |
| Tenant type docs | pass | Covered by `npm run verify`. |
| Build | pass | `npm run build` and the build inside `npm run verify` passed on Next `16.3.0-canary.36`. |
| Smoke/browser | pass | Read-only Playwright smoke for core runtime pages passed against `http://localhost:3001`. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, issues, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Re-check after the next safe Next.js patch/canary/stable release.
- [x] Upgrade only to a compatible modern Next version.
- [x] Confirm `npm audit --omit=dev`, build, typecheck, lint, and browser smoke.

## Remaining Risk

- The fix uses a Next.js canary because the current stable release is still `16.2.6` and still reports the PostCSS audit path. The PR should be watched for upstream stable replacement when Next publishes a stable release with the same PostCSS fix.

## Follow-Up

- Replace the canary with the next stable Next.js release once it includes `postcss@8.5.10` or newer and passes the same checks.
