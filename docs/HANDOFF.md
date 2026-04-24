# Handoff

## Read this first

If you are new to the repo, read in this order:

1. [README.md](../README.md)
2. [docs/STATUS.md](STATUS.md)
3. [docs/STRATEGY.md](STRATEGY.md)
4. [docs/PLATFORM_SPEC.md](PLATFORM_SPEC.md)
5. [docs/ARCHITECTURE.md](ARCHITECTURE.md)
6. [docs/WORKSPACE_MODEL.md](WORKSPACE_MODEL.md)
7. [docs/PRIMITIVE_CATALOG.md](PRIMITIVE_CATALOG.md)
8. [docs/ONBOARDING.md](ONBOARDING.md)
9. [docs/CHANGE_SYSTEM.md](CHANGE_SYSTEM.md)
10. [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
11. [docs/TODO.md](TODO.md)
12. [docs/VERIFICATION_STRATEGY.md](VERIFICATION_STRATEGY.md)
13. [docs/SETUP.md](SETUP.md)

## What this repo is

This is the product repo for Map App Harness: a multi-tenant operational platform that serves vertical workspaces from one runtime foundation.

PICC and FraterniTees are current tenants. They are not the product identity.

## What this repo is not

- not a tenant-specific one-off app
- not a place to accumulate endless shared-code branching
- not a pure architecture sandbox detached from real tenant delivery

## Current repo truth

- shared runtime, accounts, and territory surfaces are live
- current tenants already use differentiated workflows
- the repo is mid-extraction from tenant-specific behavior toward primitives/packages/workspace config
- onboarding and change-request control-plane surfaces now exist in the product
- documentation is now part of the product surface and must stay current

## Working rules

- keep the core domain generic
- treat tenant requests as candidates for config, packages, or primitives
- update docs when the platform contract changes
- use repo verification before claiming a slice is done
- explicitly state what a tenant-specific change made more reusable

## Minimum verification before shipping a slice

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
```

If a local server is running:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run verify
```

## What needs extra care

- tenant isolation
- sync correctness
- runtime payload stability
- keeping tenant velocity high without increasing platform entropy
