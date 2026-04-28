# Migration Safety

## Purpose

This file defines the migration safety contract for autonomous implementation.

The default is additive, tenant-scoped, reversible-by-follow-up, and verifiable.

## Rules

- Prefer additive migrations.
- Do not drop tables, columns, indexes, policies, or schemas without explicit approval.
- Do not rewrite production data without a dry-run, row count, and rollback notes.
- Every tenant business table must include `organization_id`.
- Every tenant business table must enable RLS.
- New foreign keys should specify delete behavior intentionally.
- New high-cardinality tenant queries need supporting indexes.
- Preserve provider source IDs and raw source metadata for imported records.
- Dirty or unmapped provider values must have a review state.
- Migration docs must match committed SQL.

## Required Migration Notes

Every meaningful migration run report must include:

- migration filename
- tables changed
- whether the migration is additive
- whether `organization_id` is present
- whether RLS is enabled
- indexes added
- policies added or deferred
- backfill behavior, if any
- rollback notes

## Destructive Change Gate

A destructive migration requires explicit review when it would:

- drop data
- overwrite provider source fields
- merge identities destructively
- remove tenant configuration
- remove existing FraterniTees behavior
- remove existing PICC behavior
- expose tenant data directly to the browser without RLS policy coverage

## Backfill Rules

Backfills must be:

- idempotent where practical
- tenant-scoped
- resumable or safe to rerun
- measured before and after
- documented in the run report

When a backfill cannot be made safe, stop and document the exact review decision needed.

## Verification

Before claiming migration work is done, run:

```bash
npm run check:self-contained-requirements
npm run verify
```

When database-specific tooling is added, wire it into `npm run verify` and update this file.
