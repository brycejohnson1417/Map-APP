# Screenprinting Data Security

## Tenant type security rule

No cross-tenant data access is allowed.

Every Screenprinting runtime row must be scoped by `organization_id`. Every query, sync job, alert, dashboard, identity link, social account, and order record must preserve that boundary.

Tenant-specific docs can describe one tenant's credential names and rollout state, but they cannot weaken the tenant type security rules.

## Required boundaries

| Boundary | Requirement |
|---|---|
| Runtime rows | all business rows include and enforce `organization_id` |
| Credentials | tenant-scoped credentials only, stored in encrypted integration installs or tenant-scoped env keys |
| Provider access | one tenant's Printavo or Meta credentials must never be used for another tenant |
| Dashboards | widgets only read the active organization scope |
| Alerts | alert rules and read state are tenant-scoped |
| Identity links | confirmed links are tenant-scoped and never global |
| Manual imports | imported rows carry tenant scope and source metadata |
| Logs | audit and sync logs include organization context |
| Admin UX | tenant admins can configure only their tenant unless explicitly platform-admin authorized |

## Credential handling

Use tenant-scoped credentials for:

- Printavo
- Meta/Instagram
- future email providers
- future catalog APIs
- future asset storage

Do not use generic global provider fallbacks for tenant-facing runtime paths. Shared developer test credentials must not be a production fallback.

## Public social accounts

Public social data can still leak business intelligence if mishandled.

Examples:

- watched competitor lists
- school/team targeting priorities
- campaign plans
- engagement spike thresholds
- customer-to-handle links

These records must be tenant-scoped even if the public account itself is visible to everyone.

## Cross-tenant same-account case

Two screenprinting tenants may watch the same Instagram account or sell to the same public organization.

The app may store normalized public metadata in a future shared cache only if tenant-specific state is separated:

- tenant-specific category
- priority
- owner
- alert state
- notes
- identity links
- campaign links
- customer links

Until that cache boundary exists, store social account records tenant-scoped.

## Verification expectations

Screenprinting changes should be checked for:

- `organization_id` query scoping
- no generic Printavo or Meta credential fallback
- tenant-scoped sync cursors
- tenant-scoped dashboard filters
- tenant-scoped alert reads/writes
- tenant-scoped identity resolution
- tenant-scoped manual imports
