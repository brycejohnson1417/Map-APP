# Running To-Do List

This file is the live execution backlog for the platform. It is intentionally blunt. If a task matters to the next slice, it belongs here.

## Current focus
- [ ] Add strategy doc and finish the platform-vs-customer migration split
- [ ] Add ADRs for sync semantics, RLS, secrets, Google Maps tenant keys, migration/backfill, and multi-tenant schema migrations
- [ ] Add the full PICC migration pack with explicit TODO markers where real facts are still missing
- [ ] Add `.env.example`, setup docs, and a fresh-thread migration playbook
- [ ] Define the first real CLI commands for migration dry-run, validation, and health checks
- [ ] Apply Supabase migrations to project `qreegfarlwbzyeliirtw`
- [ ] Seed the first organization and tenant-scoped integrations

## Near-term product tasks
- [x] Add first Supabase-backed account detail API and page that agree with territory pin data
- [x] Replace report-style territory page with a PICC field map console backed by Supabase runtime APIs
- [x] Add root app routing into the working territory console
- [x] Add first Supabase-backed account directory UI
- [ ] Add Notion webhook ingestion with durable event recording and job enqueueing
- [x] Add sync event and audit visibility to the runtime UI
- [x] Land the first thin `territory_pin_view` and its API route
- [ ] Add Playwright smoke coverage for the core runtime surfaces
- [ ] Build deterministic account identity services around `licensed_location_id` and `nabis_retailer_id`
- [ ] Add normalized Nabis retailer and order ingest tables
- [ ] Compute local order aggregates instead of relying on Notion rollups
- [ ] Build boundary and marker APIs with org-scoped permissions
- [ ] Build the first shared map shell on top of Supabase runtime data
- [ ] Add tenant admin integration status and field mapping views
- [ ] Harden the global schema and review where tenant-specific data should stay in `custom_fields`

## Documentation and process tasks
- [x] Establish architecture docs and ADRs
- [x] Add platform spec
- [x] Add implementation plan
- [x] Add verification strategy
- [x] Add autonomous execution protocol
- [ ] Add migration-ready tenant packs for the first customer
- [ ] Add baseline and acceptance docs that a fresh migration thread can use without chat history
- [ ] Keep the roadmap aligned with real repo status after each major slice
- [ ] Record adversarial review findings after each major slice
- [ ] Make the next real implementation slices runnable from both web and CLI service surfaces

## Technical debt to eliminate early
- [ ] Remove `as any` Supabase repository calls by introducing generated DB types
- [ ] Replace placeholder runtime/territory preview pages with real data-backed surfaces
- [ ] Add route and service tests for sync orchestration
- [ ] Add structured logging and correlation ids
- [ ] Add retry/backoff semantics for sync jobs
- [ ] Add migration validation queries and parity checks backed by real customer data

## Strategic non-goals for the current slice
- [ ] Do not turn the platform docs into a customer-specific rewrite plan
- [ ] Do not re-create a tenant’s old application inside this repo
- [ ] Do not support pluggable map providers in year one

## Tactical anti-patterns to avoid
- [ ] Do not hardcode tenant-specific CRM field names into the core domain
- [ ] Do not add another giant catch-all stores endpoint
- [ ] Do not claim migration readiness while required facts are still placeholders
