# PICC Baseline

## Purpose
This file records the measured or source-confirmed behavior of the legacy `picc-push` system before migration.

## Source-confirmed baseline facts

### Legacy data volume captured on 2026-04-16
- shared workspace accounts: 757
- shared workspace Nabis retailers: 762
- shared workspace Nabis orders: 1350
- shared workspace account identity mappings: 4590
- shared workspace audit events: 760
- territory read-model rows in separate overlay org: 769
- territory comment mirror rows in separate overlay org: 742
- territory sync-job rows in separate overlay org: 1686

### Legacy data volume captured by read-only dry-run on 2026-04-21
- `Account`: 775
- `Contact`: 30
- `ActivityLog`: 78
- `NabisRetailer`: 765
- `NabisOrder`: 1386
- `AccountIdentityMapping`: 4605
- `Territory`: 1
- `TerritoryMarker`: 1
- `AuditEvent`: 761
- `TerritoryStoreReadModel`: 770
- `TerritoryCheckInMirror`: 912
- `TerritoryStoreSyncJob`: 1864

### Legacy route and cache behavior
- heavy territory response route existed at `app/api/territory/stores/route.ts`
- heavy route used an in-process cache TTL of `30000 ms`
- thin experimental pin route existed at `app/api/v2/territory/pins/route.ts`

### Public unauthenticated live-site samples taken on 2026-04-16
- `GET /` returned `200` in `2.180421 s` with `12221 bytes`
- unauthenticated `GET /territory` returned `404` in `1.103698 s` with `11872 bytes`
- unauthenticated `GET /api/v2/runtime/health` returned `404` in `1.081844 s` with `11872 bytes`

These unauthenticated samples are not the main migration benchmark, but they do confirm the live host was reachable when this baseline was captured.

## User-visible pain confirmed by source and prior production behavior
- map pins and account detail could disagree for the same account
- territory data depended on a broad cached stores payload
- order/sample filters depended on CRM rollups and parsing logic
- territory/runtime state and company workspace state were split across different org ids

## Remaining baseline work before final cutover
- capture authenticated P50/P95 timings for map and account detail
- capture heavy territory payload sizes from authenticated runtime routes
- capture representative `EXPLAIN ANALYZE` output for the slowest Neon-backed queries
