# ADR 0012: Customer migration and shadow validation

## Status
Accepted

## Decision
Treat customer migration as a phased operational workflow: baseline capture, dry-run, shadow validation, controlled cutover, and rollback readiness.

## Rationale
A live customer migration is not just a data copy. It must prove parity and better runtime behavior before users are switched.

## Consequences
- each customer gets a migration pack under `docs/tenants/<org>/`
- migration docs must include baseline measurements, validation gates, and rollback criteria
- cutover requires human approval even when preparation is automated
- migration tooling should optimize for dry-run and validation before destructive steps
