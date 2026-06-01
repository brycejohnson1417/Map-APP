# Provider Env Key Checks

## Summary

Expanded the tenant provider isolation check so it catches unprefixed paid-provider credential names in runtime source plus local env/setup documentation. The check now includes a self-test fixture path proving generic provider names fail while tenant-prefixed keys and documented platform-owned Meta OAuth app keys remain allowed.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Changed Files

- `scripts/check-tenant-provider-isolation.mjs`
- `scripts/test-tenant-provider-isolation.mjs`
- `scripts/verify.mjs`
- `package.json`
- `docs/SETUP.md`
- `docs/ENVIRONMENT_AND_DEPLOYMENT_POLICY.md`
- `docs/runs/2026-06-01-provider-env-key-checks.md`

## Commands Run

```bash
npm run check:tenant-isolation:self-test
npm run check:tenant-isolation
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| RED self-test | pass | New self-test failed before implementation because `--self-test` was ignored by the checker. |
| Self-test | pass | Generic Google Maps, Nabis, Notion, Printavo, HubSpot, Salesforce, and HighLevel fixture names are detected; tenant-prefixed and Meta app credentials are allowed. |
| Tenant isolation | pass | Expanded scan passed after updating `docs/SETUP.md` to use `PICC_NABIS_ORDERS_PATH`. |
| Lint | pass | `npm run lint` passed. |
| Typecheck | pass | `npm run verify` passed typecheck. |
| Build | pass | `npm run verify` passed `next build`; the existing `--localstorage-file` warning still appears during build. |

## Tenant Behavior Preserved

- FraterniTees: no Printavo calls, email sends, or provider writes were run.
- PICC: no Nabis calls, Notion calls, or provider writes were run.

## Acceptance Criteria

- [x] Tenant isolation checks scan relevant env/example/setup files for generic paid-provider key names.
- [x] Checks allow documented platform-owned credentials such as Meta app credentials.
- [x] Checks fail on generic Google Maps, Nabis, Notion, Printavo, HubSpot, Salesforce, and HighLevel tenant-provider credentials.
- [x] Docs explain tenant-prefixed credential naming.
- [x] Fixture/self-test proves generic provider env names fail.
- [x] `npm run verify` passes.

## Remaining Risk

- The documented preflight command is missing in this checkout, so full repo preflight could not run.

## Follow-Up

- Restore or replace the missing preflight script path used by `AGENTS.md`.
