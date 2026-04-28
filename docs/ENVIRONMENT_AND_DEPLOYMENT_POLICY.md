# Environment And Deployment Policy

## Purpose

This file defines what Codex can and cannot assume about local, preview, and live environments.

It is meant to prevent autonomous work from blocking on missing credentials or accidentally touching production systems.

## Environment Order

Prefer environments in this order:

1. Local fixtures and committed sample data
2. Local development server
3. Preview deployment with non-production credentials
4. Live provider read-only checks
5. Production write-back only after explicit approval

## Missing Environment Variables

When environment variables are missing:

- use fixture-backed tests if possible
- use manual provider import fallback if possible
- skip live checks with a clear skip message
- record what was not verified in the run report
- do not invent credentials
- do not fall back to global provider keys for tenant runtime behavior

## Deployment Policy

Codex may build and test locally without additional approval.

Codex may use preview or smoke URLs when they are already configured.

Codex must not:

- point this app at the `picc-push` Vercel project
- deploy destructive database changes
- enable provider write-back
- enable social publishing
- send email automatically
- rotate or overwrite tenant secrets
- modify live provider state

Those actions require explicit approval and a written rollback plan.

## Smoke And Browser Verification

Use:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:runtime
SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_VERIFY=1 npm run verify:browser
```

Use a deployed URL only when it is clearly the target environment for that run.

If browser verification is skipped, the final response and run report must say why.

## Production Safety

Production data and provider systems are read-only by default.

The safe MVP boundary for Screenprinting is:

- Printavo read-only
- email draft-only
- social publishing disabled
- comments/messages permission-gated
- manual social import allowed
- identity merges non-destructive
- dirty provider data marked for review

## Environment Documentation

When adding a new env var or provider credential:

1. Update [SETUP.md](SETUP.md).
2. Update [OPERATING_ENVIRONMENT.md](OPERATING_ENVIRONMENT.md).
3. Update the relevant adapter or tenant type integration doc.
4. Add a missing-env behavior to tests or acceptance checks.
