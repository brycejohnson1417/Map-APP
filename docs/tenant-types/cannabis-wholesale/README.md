# Cannabis Wholesale Tenant Type

## Tenant type scope

Tenant type: `Cannabis Wholesale`

This Tenant type applies to cannabis wholesale businesses that manage retailer accounts, distributor orders, CRM data, territory coverage, field follow-up, and proposal or savings workflows.

PICC New York is the first tenant for this type.

## Tenant-specific scope

Tenant-specific docs for PICC live under `docs/tenants/picc/`. Those docs define PICC-only requirements, Nabis/Notion field mappings, migration history, acceptance checks, credential setup, and operational exceptions.

The Cannabis Wholesale tenant type docs define the reusable industry contract only. They should not include FraterniTees, Printavo, Instagram, or screenprinting defaults.

## Product intent

Cannabis Wholesale tenants need:

- account and retailer visibility
- territory map and route planning
- distributor order history
- contact and CRM context
- account-level activities
- proposal and savings documents
- field rep workflows
- tenant-scoped integration setup

## Default module family

| Module | Default status | Purpose |
|---|---|---|
| Territory | Required | Map/list/detail field operating shell |
| Accounts | Required | Retailer and account directory |
| Orders | Required | Distributor order history and rollups |
| Documents | Optional | Proposal, savings, and account-specific generated docs |
| Integrations | Required | Nabis, Notion, Google Maps, and future CRM connectors |
| Change Requests | Required | Tenant-visible request capture and maintainer workflow |

## Separation from Screenprinting

Cannabis Wholesale tenants should not inherit:

- Printavo settings
- screenprinting reorder defaults
- Instagram monitoring defaults
- school/team/athlete social taxonomy
- screenprinting catalog cost assumptions

The same platform primitives can support both tenant types, but the default adapters, workflows, dashboards, and docs are different.
