# ADR 0004: Custom fields via JSONB first

## Status
Accepted

## Decision
Use typed core columns plus `jsonb` custom field storage for tenant-specific fields. Do not start with EAV.

## Rationale
The platform needs flexibility across tenants without sacrificing queryability or maintainability. A JSONB-first approach is simpler and more performant than a full entity-attribute-value model for the initial product stage.

## Consequences
- Important shared fields remain first-class columns.
- Tenant-specific fields can be added without schema churn.
- Frequently used custom fields can later be promoted into typed columns.
