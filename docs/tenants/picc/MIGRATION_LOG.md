# PICC Migration Log

## Purpose
This file is the durable handoff state for migration work across Codex threads.

Each meaningful migration pass should append:
- date
- phase
- commands run
- what passed
- what failed
- open questions

## 2026-04-16 — Initial migration-pack scaffold
Status:
- scaffold created
- not ready for autonomous execution

Open questions:
- real legacy Neon schema snapshot is missing
- real baseline metrics are missing
- real field mappings are missing
- real parity validation queries are missing
- migration dry-run and validate commands only enforce repo readiness, not live data parity yet

## 2026-04-16 — Fresh-thread self-test
Commands run:
- `npm run mapapp -- migration dry-run picc`
- `npm run mapapp -- migration validate picc`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

What passed:
- required migration-pack files exist
- platform static checks passed
- production build passed

What failed:
- migration preflight is blocked on missing environment values:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ACCESS_TOKEN`
  - `APP_ENCRYPTION_KEY`
  - `NEON_SOURCE_DATABASE_URL`
  - `NABIS_API_KEY`
  - `GOOGLE_MAPS_BROWSER_API_KEY`
  - `GOOGLE_MAPS_SERVER_API_KEY`

Next inputs required from human operator:
- real PICC baseline measurements
- real legacy Neon schema and row-count facts
- real PICC Notion/Nabis field mappings
- final credential delivery path for migration and runtime

## 2026-04-16 — Legacy fact collection pass
Commands run:
- legacy source inspection from `Picc-web-app`
- production-row-count queries against the legacy Neon database through Prisma
- live Notion master-list schema read using the existing local Notion credentials
- public unauthenticated curl checks against `https://piccnewyork.org`

What changed:
- `FIELD_MAPPINGS.md` and `tenants/picc/field-mappings.json` now contain confirmed CRM, orders, and legacy model mappings
- `LEGACY_SYSTEM.md` now records confirmed models, routes, env names, and production row counts
- `DATA_MIGRATION.md` now contains concrete source-to-target mappings and validation SQL
- `BASELINE.md` now contains real count-based baseline facts plus limited public-route timing samples
- `CREDENTIALS.md` now records the real legacy env variable names without secrets

Current validator state:
- repo-shape checks pass
- migration evidence checks pass
- remaining validation failures are only missing environment values for the new repo:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ACCESS_TOKEN`
  - `APP_ENCRYPTION_KEY`
  - `NEON_SOURCE_DATABASE_URL`
  - `NABIS_API_KEY`
  - `GOOGLE_MAPS_BROWSER_API_KEY`
  - `GOOGLE_MAPS_SERVER_API_KEY`

Remaining blockers:
- authenticated map/account timing baselines are still missing
- representative authenticated payload-size samples are still missing
- final new-platform environment values still need to be supplied by the operator

## 2026-04-16 — Migration preflight env-loader fix
Commands run:
- `npm run mapapp -- migration validate picc`
- `npm run typecheck`
- `npm run lint`

What changed:
- `scripts/mapapp.mjs` now auto-loads `.env.local` and `.env` before evaluating migration preflight requirements
- `docs/SETUP.md` now documents the env-loading behavior so a fresh thread does not assume shell-exported values are required

What passed:
- tenant migration-pack file checks still pass
- TODO-marker and migration-evidence checks still pass
- `npm run typecheck` passed
- `npm run lint` passed

What failed:
- `migration validate` still fails because the new repo does not yet have the required runtime and migration credentials populated:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ACCESS_TOKEN`
  - `APP_ENCRYPTION_KEY`
  - `NEON_SOURCE_DATABASE_URL`
  - `NABIS_API_KEY`
  - `GOOGLE_MAPS_BROWSER_API_KEY`
  - `GOOGLE_MAPS_SERVER_API_KEY`

Current interpretation:
- the validator is now trustworthy for a fresh thread running from repo state alone
- the remaining blockers are factual environment/bootstrap inputs, not missing documentation or broken preflight logic

## 2026-04-21 — Supabase project restore, schema push, and tenant bootstrap
Commands run:
- `supabase login --token <redacted>`
- `supabase projects list -o json`
- Supabase Management API restore for project `qreegfarlwbzyeliirtw`
- `supabase link --project-ref qreegfarlwbzyeliirtw --yes`
- `supabase projects api-keys --project-ref qreegfarlwbzyeliirtw -o json`
- `npm run mapapp -- migration validate picc`
- `supabase migration repair --status reverted 20260411184025`
- `supabase db push --yes`
- `npm run seed:runtime`
- `supabase db query --linked ...`
- `npm run verify`

What changed:
- Supabase project `qreegfarlwbzyeliirtw` was restored from inactive/paused state to `ACTIVE_HEALTHY`
- local `.env.local` was populated with required ignored runtime and migration values
- the foundation migration was aligned to the remote migration version `20260411184025`
- the foundation migration was hardened for partially applied remote state:
  - enum creation is idempotent
  - PostGIS geography/geometry types are schema-qualified through `extensions`
  - missing generated geo columns are added when prior partial tables exist
- added migration `20260421143837_public_encrypted_integration_secret.sql`
  - creates `public.integration_secret`
  - enables RLS
  - leaves no client policies, so service-role server code is the supported access path
- replaced the Node-incompatible TypeScript seed command with `scripts/seed-runtime.mjs`
- seeded organization `picc`
- seeded active integrations:
  - Notion CRM
  - Nabis Orders
  - Google Maps
- seeded 19 field mappings:
  - 12 Notion mappings
  - 7 Nabis mappings
- stored 3 encrypted connector secrets

What passed:
- `npm run mapapp -- migration validate picc`
- `supabase db push --yes`
- `npm run seed:runtime`
- direct Supabase sanity checks for organization, integrations, encrypted secret count, and field mapping counts
- `npm run verify`

Remaining blockers:
- authenticated legacy app timing and payload baselines are still missing
- no real data migration has been executed yet; current migration CLI validates readiness, not row-level parity
- Vercel production environment still needs the new Supabase/tenant variables before deployed runtime health can be verified

## 2026-04-21 — Vercel production deployment
Commands run:
- `vercel env ls`
- `vercel env add ... production`
- `vercel deploy --prod -y`
- `curl https://map-app-supabase.vercel.app/api/runtime/health`
- `APP_URL=https://map-app-supabase.vercel.app npm run mapapp -- health check picc`

What changed:
- production Vercel environment variables were populated for the new Map App Harness project
- production deploy completed
- deployment was aliased to `https://map-app-supabase.vercel.app`
- health-check CLI now lets explicit `APP_URL` override local `NEXT_PUBLIC_APP_URL`

What passed:
- public runtime health endpoint returned `200`
- runtime health reported:
  - `supabaseConfigured: true`
  - `connectorSecretEnvelopeConfigured: true`
- `APP_URL=https://map-app-supabase.vercel.app npm run mapapp -- health check picc` passed

Remaining blockers:
- authenticated legacy app timing and payload baselines are still missing
- real row-level Neon-to-Supabase migration dry-run is not implemented yet
- production cutover is not ready; this deployment is the platform foundation/runtime health milestone

## 2026-04-21 — Read-only migration dry-run
Commands run:
- `npm install pg`
- `npm install -D @types/pg`
- `npm run mapapp -- migration dry-run picc`

What changed:
- `migration dry-run` now performs a real read-only connectivity/count check against:
  - the legacy Neon source database through `NEON_SOURCE_DATABASE_URL`
  - the new Supabase runtime through the service-role key
- `BASELINE.md` and `DATA_MIGRATION.md` now include the latest 2026-04-21 source counts from the dry-run

What passed:
- legacy Neon connection succeeded
- Supabase runtime connection succeeded
- source counts were visible for account, contact, activity, Nabis, identity, territory, audit, and territory read-model tables
- target counts were visible for organization, integration, encrypted secret, field mapping, and empty canonical runtime tables

Remaining blockers:
- dry-run still does not transform or write rows
- next migration slice must add staging writes plus parity validation for accounts, identities, orders, territory boundaries, and markers
