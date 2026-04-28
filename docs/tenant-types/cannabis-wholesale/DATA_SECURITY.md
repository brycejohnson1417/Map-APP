# Cannabis Wholesale Data Security

## Tenant type security rule

No cross-tenant data access is allowed.

Every Cannabis Wholesale runtime row must be scoped by `organization_id`. Every retailer, contact, order, route, document, sync job, dashboard, and credential must preserve that boundary.

Tenant-specific docs can define PICC credential names and migration details, but they cannot weaken the tenant type security rules.

## Required boundaries

| Boundary | Requirement |
|---|---|
| Runtime rows | all business rows include and enforce `organization_id` |
| Credentials | tenant-scoped credentials only, stored in encrypted integration installs or tenant-scoped env keys |
| Provider access | one tenant's Nabis, Notion, CRM, or map credentials must never be used for another tenant |
| Territory | maps and route payloads only read active organization data |
| Documents | generated docs only use tenant-scoped source rows |
| Dashboards | widgets only read active organization scope |
| Logs | sync, document, route, and audit logs include organization context |
| Admin UX | tenant admins can configure only their tenant unless platform-admin authorized |

## Credential handling

Use tenant-scoped credentials for:

- Nabis
- Notion or CRM systems
- Google Maps
- future distributor systems
- future document storage

Generic global provider fallbacks are not allowed for tenant-facing runtime paths.

## Data sensitivity

Cannabis wholesale data can include sensitive account, pricing, order, route, and sales information.

Protect:

- retailer account lists
- order history
- pricing and revenue rollups
- route plans
- referral/source attribution
- generated savings/proposal documents
- CRM notes and contacts

## Verification expectations

Cannabis Wholesale changes should be checked for:

- `organization_id` query scoping
- no generic provider credential fallback
- tenant-scoped sync cursors
- tenant-scoped document generation
- tenant-scoped map and route data
- tenant-scoped dashboard reads
