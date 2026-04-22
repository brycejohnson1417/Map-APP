# Map App Harness

A local-first CRM and territory operations platform designed to support companies bringing their own CRM, order, calendar, and mapping integrations.

## Why this repo exists

This repo is the canonical product foundation for Map App Harness. It is built as an original multi-tenant platform with:

- faster to load
- more reliable to sync
- cheaper to operate at team scale
- clearer to explain and maintain
- more defensible as an enterprise-grade system
- structured to support more than one company without code forks

## Architectural stance

- `Supabase Postgres` is the operational source of truth
- `Clerk` remains the auth layer
- `Google Maps Platform` is the map, geocoding, and routing standard
- `Notion`, `Nabis`, and future systems are external integrations
- user-facing reads come from local Postgres models, not live provider reads
- tenant connector credentials are organization-scoped and encrypted

## Product direction

The product is intentionally multi-tenant and adapter-driven.

- companies can bring their own CRM, order, and calendar APIs
- provider-specific field mappings are tenant-configured, not hardcoded into the domain
- the domain model stays generic: accounts, contacts, orders, activities, territories, events, and external identities
- the architecture preserves an escape hatch for future dedicated-database or dedicated-region customers

## Current foundation included

- Next.js App Router scaffold
- Supabase client/server runtime modules
- initial runtime health API
- polished platform shell and architecture overview
- tenant-first SQL migration for the runtime foundation
- architecture docs, ADRs, roadmap, platform spec, handoff docs, and verification loop

## Key docs

- [docs/WORKTREE_WORKFLOW.md](docs/WORKTREE_WORKFLOW.md)
- [docs/STRATEGY.md](docs/STRATEGY.md)
- [docs/PLATFORM_SPEC.md](docs/PLATFORM_SPEC.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/VERIFICATION_STRATEGY.md](docs/VERIFICATION_STRATEGY.md)
- [docs/AUTONOMOUS_EXECUTION.md](docs/AUTONOMOUS_EXECUTION.md)
- [docs/TODO.md](docs/TODO.md)
- [docs/HANDOFF.md](docs/HANDOFF.md)
- [docs/REVIEW_LOG.md](docs/REVIEW_LOG.md)
- [docs/SETUP.md](docs/SETUP.md)
- [docs/agents/MIGRATION_PLAYBOOK.md](docs/agents/MIGRATION_PLAYBOOK.md)

## Local setup

1. Install dependencies

```bash
npm install
```

2. Copy the environment template

```bash
cp .env.example .env.local
```

3. Fill in `.env.local` using [docs/SETUP.md](docs/SETUP.md)

4. Run the app

```bash
npm run dev
```

## Verification

Baseline repo verification:

```bash
npm run verify
```

If you have a local server running and want runtime smoke checks too:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run verify
```

If you want browser-level verification too:

```bash
SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_VERIFY=1 npm run verify
```

## Platform priorities

1. tenant-first runtime schema and RLS
2. deterministic account identity model
3. event-driven Notion sync with incremental fallback
4. normalized Nabis ingestion and local order aggregates
5. unified account system across map, accounts, calendar, and vendor days
6. adapter-based BYO integrations for future customers

## Seed the runtime

To create the first organization and connector records:

```bash
npm run seed:runtime
```

## Migration preflight commands

```bash
npm run mapapp -- health check <org-slug>
npm run mapapp -- migration dry-run <org-slug>
npm run mapapp -- migration validate <org-slug>
```

Tenant-specific migration details live under `docs/tenants/<org>/`.
