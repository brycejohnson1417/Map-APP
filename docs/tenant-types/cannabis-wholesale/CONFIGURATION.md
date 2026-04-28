# Cannabis Wholesale Configuration

## Tenant type rule

Tenant type defaults should support wholesale territory operations, not screenprinting sales/social workflows.

Tenant-specific PICC settings belong in `docs/tenants/picc/`, `tenants/picc/`, organization settings, or encrypted integration installs.

## Required admin configuration surfaces

| Surface | Tenant decides | Standardized primitive |
|---|---|---|
| Business profile | name, territory geography, timezone, terminology | organization |
| Users and roles | owner, rep, ops, finance, admin | organization_member |
| CRM mapping | account fields, contact fields, statuses, referral/source fields | mapping_rule |
| Distributor mapping | order fields, product fields, revenue windows, cancellation rules | mapping_rule |
| Territory settings | color modes, filters, route planning, unmapped account rules | territory primitives |
| Account categories | retailer type, region, status, rep assignment, program participation | account custom fields |
| Documents | proposal modules, savings modules, output rules | document |
| Dashboards | widgets, saved views, rep/territory filters | dashboard |
| Feature flags | route planning, proposal generation, savings, sync automation | plugin settings |

## Dirty-data handling

Cannabis wholesale data may include incomplete CRM fields, missing referral sources, stale contacts, duplicated retailers, inconsistent order states, and missing addresses.

The tenant type should support:

- explicit field mappings
- source payload preservation
- account identity links
- unmapped account review
- missing-address rules
- source-specific exclusion lists
- tenant-specific acceptance criteria

## What stays stable

The tenant can customize fields, labels, dashboards, routes, documents, and sync policies.

The tenant cannot customize away:

- tenant isolation
- encrypted credential handling
- canonical runtime entities
- audit logging for sync and document actions
