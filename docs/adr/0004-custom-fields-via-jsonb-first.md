# ADR 0004: Custom fields via JSONB first

## Status
Accepted

## Context
Tenant-specific fields are unavoidable, but adding columns for every tenant or building a full EAV system too early would slow delivery and complicate queries.

## Decision
Use typed core columns plus `jsonb` custom field storage for tenant-specific fields. Do not start with EAV.

## Rationale
The platform needs flexibility across tenants without sacrificing queryability or maintainability. A JSONB-first approach is simpler and more performant than a full entity-attribute-value model for the initial product stage.

## Consequences
- Important shared fields remain first-class columns.
- Tenant-specific fields can be added without schema churn.
- Frequently used custom fields can later be promoted into typed columns.

## Alternatives considered
- Full EAV model: rejected for initial product because it makes common queries harder and increases application complexity.
- One table per tenant or per vertical: rejected because it undermines shared primitives and tenant type reuse.
- Typed columns for every provider field: rejected because provider and tenant data quality varies too much.

## Follow-up checks
- Shared fields used by list filters, joins, or reporting should become typed columns.
- Tenant-specific JSON fields need documented mapping rules before they drive authoritative reports.
- Frequently queried JSON fields need expression indexes or promotion.
