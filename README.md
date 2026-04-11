# Map APP

Supabase-first rebuild of a local-first CRM and territory operations platform that starts with PICC and is designed to support additional companies bringing their own CRM, order, calendar, and mapping integrations.

## Why this repo exists

This repo is a clean rebuild track. The goal is not to reproduce the old system’s architecture. The goal is to replace it with something that is:

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
- PICC is tenant zero, not the product itself

## Product direction

The rebuild is intentionally multi-tenant and adapter-driven.

- companies can bring their own CRM, order, and calendar APIs
- provider-specific field mappings are tenant-configured, not hardcoded into the domain
- the domain model stays generic: accounts, contacts, orders, activities, territories, events, and external identities
- the architecture preserves an escape hatch for future dedicated-database or dedicated-region customers

## Current foundation included

- Next.js App Router scaffold
- Supabase client/server runtime modules
- initial runtime health API
- polished rebuild shell and architecture overview
- tenant-first SQL migration for the runtime foundation
- architecture docs, ADRs, and roadmap

## Key docs

- [/Users/brycejohnson/Documents/New project/Map-APP/docs/ARCHITECTURE.md](/Users/brycejohnson/Documents/New%20project/Map-APP/docs/ARCHITECTURE.md)
- [/Users/brycejohnson/Documents/New project/Map-APP/docs/ROADMAP.md](/Users/brycejohnson/Documents/New%20project/Map-APP/docs/ROADMAP.md)
- [/Users/brycejohnson/Documents/New project/Map-APP/docs/adr/0001-supabase-as-runtime-source-of-truth.md](/Users/brycejohnson/Documents/New%20project/Map-APP/docs/adr/0001-supabase-as-runtime-source-of-truth.md)
- [/Users/brycejohnson/Documents/New project/Map-APP/docs/adr/0002-google-maps-platform-standard.md](/Users/brycejohnson/Documents/New%20project/Map-APP/docs/adr/0002-google-maps-platform-standard.md)
- [/Users/brycejohnson/Documents/New project/Map-APP/docs/adr/0003-adapter-based-integrations.md](/Users/brycejohnson/Documents/New%20project/Map-APP/docs/adr/0003-adapter-based-integrations.md)
- [/Users/brycejohnson/Documents/New project/Map-APP/docs/adr/0004-custom-fields-via-jsonb-first.md](/Users/brycejohnson/Documents/New%20project/Map-APP/docs/adr/0004-custom-fields-via-jsonb-first.md)

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. Run the app

```bash
npm run dev
```

## Rebuild priorities

1. tenant-first runtime schema and RLS
2. deterministic account identity model
3. event-driven Notion sync with incremental fallback
4. normalized Nabis ingestion and local order aggregates
5. unified account system across map, accounts, calendar, and vendor days
6. adapter-based BYO integrations for future customers
