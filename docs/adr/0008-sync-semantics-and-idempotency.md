# ADR 0008: Sync semantics and idempotency

## Status
Accepted

## Context
External providers can retry webhooks, return overlapping pages, reorder events, or fail mid-sync. The product must tolerate repeated processing without duplicate business effects.

## Decision
Treat inbound provider sync as at-least-once delivery with explicit idempotency keys, durable event recording, retry state, and dead-letter handling.

## Rationale
Webhook providers can replay, reorder, or drop events. The platform cannot assume exactly-once delivery or global ordering.

## Consequences
- every inbound sync event should have a durable event record
- sync jobs should use a documented dedupe key shape
- retries must not create duplicate side effects
- failed jobs eventually move to a dead-letter state with operator visibility
- migration validation should prefer replayable events over hidden side effects

## Alternatives considered
- Assume exactly-once delivery: rejected because providers do not guarantee it.
- Fire-and-forget sync without durable state: rejected because failures become invisible.
- Manual rerun scripts without dedupe keys: rejected because reruns could duplicate accounts, contacts, orders, or activities.

## Follow-up checks
- Sync jobs need dedupe keys where replay is possible.
- Provider source ids need unique constraints or identity rows.
- Errors should be visible through sync cursors/jobs and tenant/operator surfaces.
