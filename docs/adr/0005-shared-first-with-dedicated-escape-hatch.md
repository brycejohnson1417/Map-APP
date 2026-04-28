# ADR 0005: Shared first with dedicated escape hatch

## Status
Accepted

## Context
The product needs fast iteration and low operating cost now, while leaving room for larger tenants to require dedicated infrastructure later.

## Decision
Start the platform as shared multi-tenant by default, but design the domain and application layers so individual customers can later move to a dedicated database, project, region, or deployment without changing the business model.

## Rationale
Shared multi-tenant is the fastest and cheapest way to prove the product. Larger customers may later require stronger isolation for security, procurement, compliance, or performance. If the application assumes shared infrastructure forever, that future split becomes expensive and risky.

## Consequences
- `organization_id` remains the fundamental tenant boundary.
- Connector configuration and sync state remain tenant-scoped.
- Infrastructure topology must stay out of the domain model.

## Alternatives considered
- Dedicated infrastructure for every tenant from day one: rejected because it increases cost and operational overhead before product fit is proven.
- Shared-only forever: rejected because future procurement, compliance, data residency, or performance needs may require a dedicated path.
- Tenant-specific codebases: rejected because the product must scale by tenant type and configuration, not forks.

## Follow-up checks
- Keep all business rows tenant-scoped.
- Avoid infrastructure assumptions in domain primitives.
- Document any migration path that would be needed to split a tenant out later.
