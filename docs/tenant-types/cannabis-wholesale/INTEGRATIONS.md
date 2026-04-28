# Cannabis Wholesale Integrations

## Tenant type scope

Cannabis Wholesale integrations should support field operations and account management while keeping source systems protected.

Tenant-specific integration details for PICC live under `docs/tenants/picc/`.

## Nabis or distributor systems

Default mode: read-only sync unless a tenant-specific write-back workflow is approved.

Pull:

- retailers/accounts
- orders
- line items where available
- order totals
- order dates
- product information
- cancellation or internal-transfer signals
- source IDs and metadata

Tenant-specific configuration:

- API base URL
- orders path
- cancellation/internal-transfer filters
- revenue reporting windows
- account matching fields

## Notion or CRM systems

Default mode: read-only for core account/contact sync unless a tenant-specific automation contract allows writes.

Pull:

- accounts
- contacts
- account statuses
- referral/source fields
- rep assignments
- program fields
- operational notes where approved

Tenant-specific configuration:

- source IDs
- field mappings
- relation mappings
- read/write contract
- manual approval gates

## Google Maps

Use tenant-scoped browser and server keys or tenant-scoped integration installs.

Pull/use:

- geocoding
- maps rendering
- route planning where enabled

Do not use generic shared Google Maps keys for tenant-facing runtime paths.

## Document generation

Documents should be generated from tenant-scoped runtime data, not live provider calls.

Examples:

- proposal PDFs
- savings PDFs
- account summaries

Every generated document should include tenant context and source timestamps.
