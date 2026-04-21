# PICC Legacy System

## Purpose
This file captures the facts a fresh migration thread needs about the legacy `picc-push` system without copying that source tree into this repo.

## Legacy repo reference
- repo: `https://github.com/bryce-picc/Picc-web-app.git`
- reference commit: `3694769dfc9ae16a0c7f7ccb6b7667659ff9b5ea`
- host: `https://piccnewyork.org`

## Confirmed legacy stack facts
- Next.js application
- Prisma over PostgreSQL
- production database host in local production env points to Neon
- legacy auth used Clerk
- the codebase contains both older Neon-backed runtime routes and newer Supabase-first runtime experiments

## Important legacy architectural reality
The legacy system is not one clean runtime.

Confirmed from production database counts:
- shared company workspace data lives under `picc_company_workspace`
- territory read-model and queue artifacts live under `org_picc_demo`

That split is one of the reasons the new platform must migrate into one coherent tenant runtime.

## Confirmed key models from Prisma
- `OrganizationWorkspace`
- `Membership`
- `Account`
- `Contact`
- `ActivityLog`
- `NabisRetailer`
- `NabisOrder`
- `AccountIdentityMapping`
- `IntegrationConnection`
- `SyncCheckpoint`
- `SyncRun`
- `Territory`
- `TerritoryMarker`
- `TerritoryStoreReadModel`
- `TerritoryStoreSyncJob`
- `TerritoryCheckInMirror`
- `AuditEvent`

## Confirmed identity model facts
Legacy identity types included:
- `ACCOUNT_ID`
- `NOTION_PAGE_ID`
- `LICENSED_LOCATION_ID`
- `NABIS_RETAILER_ID`
- `LICENSE_NUMBER`
- `ALIAS`

Legacy account rows also carried:
- `notionPageId`
- `licensedLocationId`
- `nabisRetailerId`
- `licenseNumber`

## Confirmed route and runtime facts
- heavy territory route: `app/api/territory/stores/route.ts`
  - broad filtered payload
  - in-process response cache TTL of 30 seconds
- thin territory route: `app/api/v2/territory/pins/route.ts`
  - Supabase-backed experiment
  - defaulted `workspace` to `picc-cmd-center`
- Notion webhook route: `app/api/webhooks/notion/route.ts`
- map config route: `app/api/territory/map-config/route.ts`
- Google routes optimization route: `app/api/territory/optimize-route/route.ts`

## Confirmed environment contract from legacy source
- `DATABASE_URL`
- `TERRITORY_ORG_ID`
- `NOTION_API_KEY`
- `NOTION_MASTER_LIST_DATABASE_ID`
- `NOTION_CONTACTS_DATABASE_ID`
- `NOTION_MEETING_NOTES_DATABASE_ID`
- `NOTION_VENDOR_DAY_DATABASE_ID`
- `NOTION_VENDOR_DAY_EVENTS_DATABASE_ID`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_SERVER_API_KEY`
- `GOOGLE_GEOCODING_API_KEY`
- `GOOGLE_ROUTES_API_KEY`
- `NABIS_API_KEY`
- `NABIS_API_BASE_URL`

## Confirmed production row counts captured on 2026-04-16

### Shared company workspace (`picc_company_workspace`)
- `Membership`: 19
- `Account`: 757
- `Contact`: 0
- `ActivityLog`: 0
- `NabisRetailer`: 762
- `NabisOrder`: 1350
- `AccountIdentityMapping`: 4590
- `IntegrationConnection`: 1
- `SyncCheckpoint`: 3
- `SyncRun`: 13
- `Territory`: 1
- `TerritoryMarker`: 1
- `AuditEvent`: 760

### Territory/runtime overlay org (`org_picc_demo`)
- `TerritoryStoreReadModel`: 769
- `TerritoryCheckInMirror`: 742
- `TerritoryStoreSyncJob`: 1686

## Confirmed production shape examples
- company workspace accounts with all three deterministic ids exist
- territory read-model rows store:
  - `name`
  - `status`
  - `repNames`
  - `notionPageId`
  - `city`
  - `state`
  - `daysOverdue`
  - `followUpDate`
  - `lastCheckIn`
  - `locationSource`
  - `locationPrecision`

## Still needed for final cutover confidence
- authenticated route timings from the live app
- representative heavy payload samples from the live territory endpoint
- representative slow-query `EXPLAIN ANALYZE` output against the production Neon database
