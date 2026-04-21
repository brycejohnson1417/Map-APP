# Developer Handoff

## Read this first
If you are new to the repo, start here:

1. [README.md](../README.md)
2. [docs/STRATEGY.md](STRATEGY.md)
3. [docs/PLATFORM_SPEC.md](PLATFORM_SPEC.md)
4. [docs/ARCHITECTURE.md](ARCHITECTURE.md)
5. [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
6. [docs/VERIFICATION_STRATEGY.md](VERIFICATION_STRATEGY.md)
7. [docs/AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md)
8. [docs/TODO.md](TODO.md)
9. [docs/REVIEW_LOG.md](REVIEW_LOG.md)
10. [docs/SETUP.md](SETUP.md)

## What this repo is
This is the core product repo for a multi-tenant map/account operations platform. It should be treated as an original platform project, not as a patch layer over any tenant’s previous application.

## What this repo is not
- not a tenant-specific one-off app
- not a place to copy old sync-on-read patterns
- not a place to hardcode Notion or Nabis assumptions deep into the UI

## Current architectural truth
- Supabase Postgres is the runtime source of truth
- Clerk remains the auth layer
- Google Maps Platform is the mapping standard
- Notion and Nabis are integrations, not runtime databases
- all user-facing surfaces must read local data models

## Current repo status
- foundational schema exists
- seed/bootstrap path exists
- runtime pages and APIs exist
- verification scripts exist
- full territory/account runtime parity does not exist yet
- tenant-specific requirement docs live under `docs/tenants/`

## How to work in this repo
- keep new work tenant-first
- add docs when architecture changes
- update the running todo list as scope changes
- use the repo verification loop before claiming completion
- request fresh-context review on meaningful slices
- if a change introduces provider-specific assumptions, challenge it

## Minimum commands before shipping a slice
```bash
npm run verify
npm run mapapp -- health check picc
```

If a local server is running:
```bash
SMOKE_BASE_URL=http://localhost:3000 npm run verify
```

## What needs extra care
- sync correctness
- deterministic identity matching
- RLS and tenant isolation
- payload size on hot endpoints
- keeping the product generic across tenants
