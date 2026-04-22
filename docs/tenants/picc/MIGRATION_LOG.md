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

## 2026-04-22 — Row-level Supabase runtime migration and territory read surface
Commands run:
- `supabase db push --yes`
- `npm run mapapp -- migration apply picc`
- `npm run mapapp -- migration dry-run picc`
- `npm run mapapp -- migration validate picc`
- `npm run lint`
- `vercel deploy --prod -y`
- `APP_URL=https://map-app-supabase.vercel.app npm run mapapp -- health check picc`
- `SMOKE_BASE_URL=https://map-app-supabase.vercel.app NEXT_PUBLIC_DEFAULT_ORG_SLUG=picc npm run smoke:runtime`
- `curl https://map-app-supabase.vercel.app/api/runtime/organizations/picc/territory/pins?flag=missing_referral_source`

What changed:
- added canonical `order_record` runtime storage for migrated Nabis orders
- normalized stale territory runtime tables from an earlier partial schema so current `organization_id` scoping is authoritative
- `migration apply picc` now clears and reloads migrated runtime rows from the legacy Neon source into Supabase
- migrated runtime rows now include accounts, account identities, contacts, activities, orders, territory boundaries, and territory markers
- account order aggregates now update local `last_order_date` and `customer_since_date` from normalized order records
- `/territory` now reads migrated Supabase runtime data and exposes search plus `No Referral Source` and `No Last Sample Delivery Date` filters
- `/api/runtime/organizations/:slug/territory/pins` now returns a small pin payload for agent/browser smoke verification

What passed:
- migration apply loaded:
  - 793 accounts
  - 4,629 account identities
  - 30 contacts
  - 79 activities
  - 1,386 orders
  - 1 territory boundary
  - 1 territory marker
- read-only dry-run confirmed source/target connectivity after the apply
- migration validator passed all file, environment, TODO, and evidence checks
- lint passed with zero warnings
- Vercel production build passed on Node 22 and was aliased to `https://map-app-supabase.vercel.app`
- production health check passed
- production smoke test passed for `/`, `/architecture`, `/territory`, runtime org APIs, sync jobs API, and both territory filter APIs
- production territory pin API returned:
  - 793 accounts
  - 772 geocoded pins
  - 1,386 orders
  - 428 accounts with no referral source
  - 793 accounts with no last sample delivery date

Known caveats:
- the legacy source does not expose a confirmed sample-delivery column in `Account`, `TerritoryStoreReadModel`, or `NabisOrder`; the new filter is wired to the canonical `account.last_sample_delivery_date` field, but current migrated rows are expected to be null until a trusted sample source is connected
- the earlier local `npm run typecheck` / `npm run build` hang was observed in the older Documents checkout, not in the `/Users/brycejohnson/Code/Map-APP` checkout used for the next slice
- the `pg` SSL-mode warning is still emitted by the legacy Neon connection string and should be cleaned up separately by normalizing the source URL SSL mode

## 2026-04-22 — Supabase-backed account detail runtime slice
Commands run:
- `npm run lint`
- `npm run typecheck`
- `npm run verify`
- `SMOKE_BASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_DEFAULT_ORG_SLUG=picc npm run smoke:runtime`
- local Chrome browser checks for `/accounts/cb288b2b-9414-4754-a73e-fec77dd1ff45` at desktop and mobile widths

What changed:
- added a shared runtime REST helper for Supabase-backed server reads
- added `/api/runtime/organizations/:slug/accounts/:accountId`
- added `/accounts/:accountId`
- linked territory pin rows to the account detail page
- extended smoke verification so the first returned territory pin must resolve to both the account page and account API
- added runtime read-model migrations for `territory_pin_view`, `territory_runtime_summary_view`, `territory_rep_facet_view`, and `account_detail_view`

What passed:
- lint passed with zero warnings
- typecheck passed
- `npm run verify` passed, including Next production build
- local smoke verification passed against `http://127.0.0.1:3000`
- desktop and mobile Chrome checks rendered the new account detail surface and caught/fixed the Source CRM button contrast issue

Why this matters:
- the first account-detail surface now reads the same local Supabase account row as the territory map/list payload
- account detail joins local account identities, contacts, activity, and Nabis order records without live Notion reads
- this directly advances the PICC acceptance requirement that map, list, and detail agree for the same account

## 2026-04-22 — PICC field console parity push
Commands run:
- `npm run lint`
- `npm run typecheck`
- `npm run verify`
- `SMOKE_BASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_DEFAULT_ORG_SLUG=picc npm run smoke:runtime`
- local Chrome browser checks for `/`, `/territory`, and `/accounts` at desktop and mobile widths

What changed:
- `/` now opens the working territory console instead of the platform marketing page
- `/territory` now renders a PICC-oriented field map console backed by Supabase runtime APIs
- the territory console includes Google Maps, map/list mode, search, rep/status/referral/vendor filters, visible account metrics, route-stop selection, directions links, source CRM links, local account detail, local check-in creation, recent activity, and org-visible territory overlays
- added org-scoped runtime APIs for territory overlays and map config
- `/accounts` now provides a Supabase-backed account directory that links to account detail pages
- smoke verification now covers map config and overlays
- browser verification found zero client console errors on the new territory console

What passed:
- lint passed with zero warnings
- typecheck passed
- `npm run verify` passed, including Next production build
- local smoke verification passed against `http://127.0.0.1:3000`
- `/territory` browser check loaded Google Maps with 691 usable mapped pins and no console errors
- `/accounts` browser check loaded successfully and no console errors were observed

Known caveats:
- current migrated account data still contains `0,0` placeholder coordinates; the UI now ignores those for map rendering and viewport fitting, but the source data should be cleaned during the migration/backfill path
- check-ins save locally to Supabase activity/account runtime state; outbound fanout to Notion is still a separate sync-spine task
- vendor-day/calendar-specific data models are not yet fully rebuilt in Supabase, so those Neon app workflows are not complete yet

## 2026-04-22 — Runtime operations visibility and audit-backed check-ins
Commands run:
- `npm run typecheck`
- `npm run lint`
- `npm run verify`
- `npx playwright install chromium`
- `SMOKE_BASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_DEFAULT_ORG_SLUG=picc npm run smoke:runtime`
- `SMOKE_BASE_URL=http://127.0.0.1:3000 NEXT_PUBLIC_DEFAULT_ORG_SLUG=picc npm run verify:browser`

What changed:
- added a reusable Supabase audit-event repository and audit-event domain type
- runtime organization snapshots now include recent audit events and sync-job status counts
- `/runtime/:slug` now shows integration count, sync queue status, recent sync jobs, and recent audit events
- `/api/runtime/organizations/:slug/sync-jobs` now returns sync-job status counts alongside recent jobs
- field check-ins now write a local `account_updated` audit event after updating account activity state
- runtime smoke verification now asserts audit and sync status fields are present in the organization snapshot
- browser coverage now includes the runtime operations page when an organization slug is configured
- the shared Supabase REST helper now retries transient 429/5xx/network failures before failing a runtime read
- added runtime operations indexes for recent sync-job and audit-event reads

What passed:
- typecheck passed
- lint passed with zero warnings
- `npm run verify` passed, including Next production build
- production-mode local smoke verification passed against `http://127.0.0.1:3000`
- Playwright browser verification passed against the production-mode local server

What failed and was fixed:
- the first browser run could not launch because the local Playwright Chromium binary was missing; `npx playwright install chromium` fixed it
- stale browser assertions for the account and architecture pages were corrected to match actual accessible headings
- one transient Supabase DNS `ENOTFOUND` failure was observed under the dev server; the shared runtime REST helper now retries transient provider/network failures

Known caveats:
- audit recording is now present for local field check-ins, but outbound Notion fanout remains a separate sync-spine task
- the new runtime operations indexes are included as a migration, but they still need to be pushed to the linked Supabase project before production gets the index benefit
