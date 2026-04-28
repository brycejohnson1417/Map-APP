# Handoff

## Required reading order

Read these five files before choosing work:

1. [README.md](../README.md)
2. [docs/GLOSSARY.md](GLOSSARY.md)
3. [docs/AUTONOMOUS_PRODUCT_BUILD.md](AUTONOMOUS_PRODUCT_BUILD.md)
4. [docs/WORK_REGISTRY.md](WORK_REGISTRY.md)
5. [docs/DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)

Then parse [docs/WORK_REGISTRY.json](WORK_REGISTRY.json). It is the execution queue.

For tenant type or tenant workspace work, then read the relevant focused docs:

- [docs/ARCHITECTURE_RUNWAY.md](ARCHITECTURE_RUNWAY.md)
- [docs/DATA_MODEL.md](DATA_MODEL.md)
- [docs/API_CONTRACTS.md](API_CONTRACTS.md)
- [docs/AGENT_CONCURRENCY.md](AGENT_CONCURRENCY.md)
- [docs/ACCEPTANCE_AND_FIXTURES.md](ACCEPTANCE_AND_FIXTURES.md)
- [docs/ENVIRONMENT_AND_DEPLOYMENT_POLICY.md](ENVIRONMENT_AND_DEPLOYMENT_POLICY.md)
- [docs/MIGRATION_SAFETY.md](MIGRATION_SAFETY.md)
- [docs/tenant-types/SCHEMA.md](tenant-types/SCHEMA.md)
- [docs/tenant-types/screenprinting/PRODUCT_SPEC.md](tenant-types/screenprinting/PRODUCT_SPEC.md)
- [docs/tenant-types/screenprinting/FULL_IMPLEMENTATION_HANDOFF.md](tenant-types/screenprinting/FULL_IMPLEMENTATION_HANDOFF.md)
- [docs/tenant-types/cannabis-wholesale/README.md](tenant-types/cannabis-wholesale/README.md)
- [docs/tenants/fraternitees/README.md](tenants/fraternitees/README.md)
- [docs/tenants/picc/REQUIREMENTS.md](tenants/picc/REQUIREMENTS.md)

## What this repo is

This is the product repo for Map App Harness: a multi-tenant operational platform that serves vertical tenant workspaces from one runtime foundation.

PICC and FraterniTees are current tenants. They are not the product identity.

Current tenant types:

- FraterniTees: `Screenprinting`
- PICC: `Cannabis Wholesale`

Tenant type docs live in `docs/tenant-types/`. Tenant-specific docs live in `docs/tenants/`.

## What this repo is not

- not a tenant-specific one-off app
- not a place to accumulate endless shared-code branching
- not a pure architecture sandbox detached from real tenant delivery
- not a repo where requirements can depend on chat history, screenshots, videos, or hidden context
- Self-contained product requirements are mandatory for every product, tenant type, and tenant-specific handoff.

## Current repo truth

- Shared runtime, accounts, account detail, territory, integrations, change requests, and sync visibility exist.
- FraterniTees has working Printavo onboarding/sync, lead scoring, account directory, account detail, top-customer spend, score trends, map behavior, and daily sync controls.
- PICC has working cannabis wholesale territory/account workflows, Nabis/Notion paths, PPP savings, and mock proposal behavior.
- Tenant type manifests exist for Screenprinting and Cannabis Wholesale.
- The repo is mid-extraction from tenant-specific behavior toward primitives, packages, workspace config, tenant type contracts, and admin-configurable mappings.
- Self-contained product requirements are mandatory.

## Working rules

- Keep the core domain generic.
- Treat tenant requests as candidates for config, packages, primitives, or tenant type defaults before adding branches.
- Treat repeated industry behavior as tenant type behavior.
- Put one-tenant decisions in `docs/tenants/<slug>/`.
- Update [DATA_MODEL.md](DATA_MODEL.md), [API_CONTRACTS.md](API_CONTRACTS.md), and [tenant-types/SCHEMA.md](tenant-types/SCHEMA.md) when those contracts change.
- Use [ARCHITECTURE_RUNWAY.md](ARCHITECTURE_RUNWAY.md) for the immediate Screenprinting foundation sequence.
- Use [AUTONOMOUS_PRODUCT_BUILD.md](AUTONOMOUS_PRODUCT_BUILD.md) when a long-running Codex CLI session should continue through foundation, product build, docs, tests, verification, and run report.
- Use [WORK_REGISTRY.json](WORK_REGISTRY.json) to choose and update executable work.
- Use [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) to decide whether a slice is complete.
- Use [ACCEPTANCE_AND_FIXTURES.md](ACCEPTANCE_AND_FIXTURES.md) when live provider credentials are unavailable or a workflow needs fixture-backed proof.
- Use [ENVIRONMENT_AND_DEPLOYMENT_POLICY.md](ENVIRONMENT_AND_DEPLOYMENT_POLICY.md) before touching preview/live systems or environment variables.
- Use [MIGRATION_SAFETY.md](MIGRATION_SAFETY.md) before adding migrations or backfills.
- Add a run report from [runs/RUN_REPORT_TEMPLATE.md](runs/RUN_REPORT_TEMPLATE.md) for meaningful implementation slices.
- Preserve existing tenant value while improving UI/UX.
- Run verification before claiming a slice is done.
- State what a tenant-specific change made more reusable.

## Minimum verification

```bash
npm run check:work-registry
npm run verify
```

When UI behavior changes and a local server is available:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:runtime
SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_VERIFY=1 npm run verify:browser
```

## Deeper references

- [docs/OPERATING_ENVIRONMENT.md](OPERATING_ENVIRONMENT.md)
- [docs/SETUP.md](SETUP.md)
- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/AGENT_PROMPT_TEMPLATE.md](AGENT_PROMPT_TEMPLATE.md)
- [docs/locks/LOCKS.md](locks/LOCKS.md)
- [docs/PLATFORM_SPEC.md](PLATFORM_SPEC.md)
- [docs/WORKSPACE_MODEL.md](WORKSPACE_MODEL.md)
- [docs/PRIMITIVE_CATALOG.md](PRIMITIVE_CATALOG.md)
- [docs/ONBOARDING.md](ONBOARDING.md)
- [docs/CHANGE_SYSTEM.md](CHANGE_SYSTEM.md)
- [docs/TODO.md](TODO.md)
- [docs/VERIFICATION_STRATEGY.md](VERIFICATION_STRATEGY.md)
- [docs/AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md)
