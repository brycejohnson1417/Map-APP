# Operating Environment

## Purpose

This file states the runtime and tooling contract that a fresh agent or engineer needs before editing the app.

For vocabulary, read [GLOSSARY.md](GLOSSARY.md).

## Runtime Stack

| Area | Current contract |
|---|---|
| App framework | Next.js `16.2.3` |
| Router | App Router. Runtime routes live under `app/api/**/route.ts`; user pages live under `app/**/page.tsx`. |
| React | React `19.2.4` and React DOM `19.2.4` |
| Node | `22.x`, declared in `package.json` `engines.node` |
| TypeScript | TypeScript `5.x` with `tsc --noEmit -p tsconfig.typecheck.json` |
| Lint | `oxlint app components lib scripts --deny-warnings` |
| Styling | Tailwind CSS `4.x` through PostCSS and `app/globals.css` |
| Icons | `lucide-react` |
| Maps | Leaflet is present in the app. Google Maps keys are tenant-scoped where Google services are used for browser/server map features. OpenStreetMap tile config is used as the browser fallback when no tenant Google Maps browser key is configured. |
| Database | Supabase Postgres with additive SQL migrations under `supabase/migrations/` |
| Supabase client | `@supabase/supabase-js` `^2.57.4` |
| Auth state | Current tenant access uses tenant-session cookies and server-side checks. Clerk env vars are listed in setup, but the committed tenant runtime routes currently enforce tenant-session access rather than relying on a direct Clerk client policy. |
| PDF generation | `pdfkit` plus route-level PDF handlers |
| Browser verification | Playwright `^1.59.1` |

For environment and deployment safety rules, read [ENVIRONMENT_AND_DEPLOYMENT_POLICY.md](ENVIRONMENT_AND_DEPLOYMENT_POLICY.md).

## Required Commands

Run these before claiming a development slice is complete:

```bash
npm run typecheck
npm run lint
npm run check:tenant-isolation
npm run check:work-registry
npm run check:self-contained-requirements
npm run check:tenant-types
npm run build
npm run verify
```

`npm run verify` runs the main verification sequence. Browser and live smoke checks require opt-in environment variables.

## Supabase Migration Contract

- Migrations are plain SQL files in `supabase/migrations/`.
- Prefer additive migrations for tenant-facing data.
- Every tenant business table must include `organization_id uuid not null references public.organization(id) on delete cascade` unless the table is global immutable metadata.
- Tenant-facing tables must enable RLS.
- The current committed runtime uses server/service-role access paths for tenant data. Do not expose direct browser Supabase access to a tenant table until matching RLS policies are committed and documented.
- Provider secrets must be stored through tenant-scoped encrypted integration installs or tenant-scoped environment variables.
- Platform-owned Meta OAuth app credentials are backend environment variables because they identify the product's Meta app; OAuth access tokens returned for tenants must still be stored as tenant-scoped encrypted integration secrets.

## Local Environment

Use [SETUP.md](SETUP.md) for environment variables. Important groups:

- Supabase runtime and service-role keys
- tenant-session and auth settings
- tenant-scoped connector credentials
- platform-owned Meta OAuth app credentials
- tenant-scoped Google Maps keys
- optional Vercel verification variables

## Next.js Version Warning

`AGENTS.md` contains the repo-level warning that this Next.js version may differ from older App Router behavior. Before making framework-sensitive changes, inspect local docs in `node_modules/next/dist/docs/` and the current route/page conventions in this repo.
