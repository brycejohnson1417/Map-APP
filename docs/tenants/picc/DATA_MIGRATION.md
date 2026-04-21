# PICC Data Migration

## Purpose
This file defines how legacy PICC data moves into Map App Harness and how parity is validated.

## Source -> target mapping
- legacy `OrganizationWorkspace` -> platform `organization`
- legacy `Membership` -> platform `organization_member`
- legacy `Account` -> platform `account`
- legacy `AccountIdentityMapping` plus account identity columns -> platform `account_identity`
- legacy `Contact` -> platform `contact`
- legacy `ActivityLog` -> platform `activity`
- legacy `AuditEvent` -> platform `audit_event`
- legacy `NabisRetailer` -> normalized retailer/account identity inputs
- legacy `NabisOrder` -> normalized order inputs and local aggregates
- legacy `Territory` -> platform `territory_boundary`
- legacy `TerritoryMarker` -> platform `territory_marker`
- legacy `TerritoryStoreReadModel` -> comparison-only read-model evidence, not a source of truth to preserve as-is
- legacy `TerritoryStoreSyncJob` / `SyncCheckpoint` / `SyncRun` -> migration/audit inputs for new sync spine, not 1:1 product entities

## Important migration rule
Do not preserve the legacy org split.

Legacy production data is split across:
- `picc_company_workspace`
- `org_picc_demo`

The new runtime should consolidate the accepted PICC data into one organization-scoped runtime.

## Transformation rules
- preserve deterministic identities such as `licensed_location_id`, `nabis_retailer_id`, and `notion_page_id`
- compute sample/order aggregates locally from normalized order data instead of carrying forward display-only rollup values as truth
- treat `TerritoryStoreReadModel` as parity evidence, not as a long-term canonical model to copy blindly
- move tenant-specific display fields into mapped runtime fields or custom fields instead of hardcoded logic

## Current accepted source counts
- shared workspace `Account`: 757
- shared workspace `NabisRetailer`: 762
- shared workspace `NabisOrder`: 1350
- shared workspace `AccountIdentityMapping`: 4590
- shared workspace `Territory`: 1
- shared workspace `TerritoryMarker`: 1
- overlay-org `TerritoryStoreReadModel`: 769
- overlay-org `TerritoryCheckInMirror`: 742
- overlay-org `TerritoryStoreSyncJob`: 1686

## Validation SQL

### Legacy counts by table
```sql
select 'Account' as entity, count(*) as row_count
from "Account"
where "orgId" = 'picc_company_workspace'
union all
select 'NabisRetailer' as entity, count(*) as row_count
from "NabisRetailer"
where "orgId" = 'picc_company_workspace'
union all
select 'NabisOrder' as entity, count(*) as row_count
from "NabisOrder"
where "orgId" = 'picc_company_workspace';
```

### Legacy deterministic identity coverage
```sql
select
  count(*) as account_count,
  count("notionPageId") as notion_page_ids,
  count("licensedLocationId") as licensed_location_ids,
  count("nabisRetailerId") as nabis_retailer_ids
from "Account"
where "orgId" = 'picc_company_workspace';
```

### Legacy overlay read-model counts
```sql
select 'TerritoryStoreReadModel' as entity, count(*) as row_count
from "TerritoryStoreReadModel"
where "orgId" = 'org_picc_demo'
union all
select 'TerritoryStoreSyncJob' as entity, count(*) as row_count
from "TerritoryStoreSyncJob"
where "orgId" = 'org_picc_demo';
```

## Dry-run policy
Migration dry-runs must be non-destructive.

- read from legacy source in read-only mode
- write only to staging or validation targets
- never delete from the legacy source
- record every blocker in `MIGRATION_LOG.md`
