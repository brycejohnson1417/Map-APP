# ADR 0013: Multi-tenant schema migration strategy

## Status
Accepted

## Decision
Design schema changes so they can be rolled forward safely in a shared environment now and across future dedicated tenant deployments later.

## Rationale
Customer migrations do not end at initial cutover. The platform must keep evolving without turning schema rollout into an ad hoc manual process per tenant.

## Consequences
- schema changes should prefer additive migrations and explicit backfills
- long-running backfills need verification and resumability
- migration planning must account for both shared and future dedicated tenant topologies
- tenant-facing docs and tooling should separate schema rollout from customer cutover activities
