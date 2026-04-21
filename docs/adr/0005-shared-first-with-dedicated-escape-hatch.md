# ADR 0005: Shared first with dedicated escape hatch

## Status
Accepted

## Decision
Start the platform as shared multi-tenant by default, but design the domain and application layers so individual customers can later move to a dedicated database, project, region, or deployment without changing the business model.

## Rationale
Shared multi-tenant is the fastest and cheapest way to prove the product. Larger customers may later require stronger isolation for security, procurement, compliance, or performance. If the application assumes shared infrastructure forever, that future split becomes expensive and risky.

## Consequences
- `organization_id` remains the fundamental tenant boundary.
- Connector configuration and sync state remain tenant-scoped.
- Infrastructure topology must stay out of the domain model.
