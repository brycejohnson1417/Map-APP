# ADR 0012: Customer migration and shadow validation

## Status
Accepted

## Context
Migrating a live tenant means preserving business continuity while proving the new runtime is correct enough to trust.

## Decision
Treat customer migration as a phased operational workflow: baseline capture, dry-run, shadow validation, controlled cutover, and rollback readiness.

## Rationale
A live customer migration is not just a data copy. It must prove parity and better runtime behavior before users are switched.

## Consequences
- each customer gets a migration pack under `docs/tenants/<org>/`
- migration docs must include baseline measurements, validation gates, and rollback criteria
- cutover requires human approval even when preparation is automated
- migration tooling should optimize for dry-run and validation before destructive steps

## Alternatives considered
- Direct cutover after import: rejected because hidden parity bugs would affect live users.
- Manual spreadsheet validation only: rejected because it is slow and incomplete.
- Rewrite source systems during migration: rejected unless a tenant explicitly approves the write path and rollback plan.

## Follow-up checks
- Tenant migration docs must record baseline, validation, and acceptance criteria.
- Dry-run output must be reviewable.
- Cutover steps must be reversible or have documented rollback criteria.
