# ADR 0013: Multi-tenant schema migration strategy

## Status
Accepted

## Context
The shared database must evolve while serving multiple tenants, and future dedicated tenant deployments should be able to receive the same schema evolution.

## Decision
Design schema changes so they can be rolled forward safely in a shared environment now and across future dedicated tenant deployments later.

## Rationale
Customer migrations do not end at initial cutover. The platform must keep evolving without turning schema rollout into an ad hoc manual process per tenant.

## Consequences
- schema changes should prefer additive migrations and explicit backfills
- long-running backfills need verification and resumability
- migration planning must account for both shared and future dedicated tenant topologies
- tenant-facing docs and tooling should separate schema rollout from customer cutover activities

## Alternatives considered
- Destructive migrations by default: rejected because current tenant workflows must keep working.
- Manual per-tenant schema edits: rejected because it will not scale to many tenants.
- Delay schema docs until implementation is done: rejected because future agents need the contract before writing migrations.

## Follow-up checks
- Prefer additive migrations.
- Backfills must be resumable and verified.
- Data model docs must be updated with every schema change.
