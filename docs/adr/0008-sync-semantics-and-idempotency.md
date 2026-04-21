# ADR 0008: Sync semantics and idempotency

## Status
Accepted

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
