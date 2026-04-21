# Implementation Plan

## Planning Standard
Every phase in this file needs:
- clear scope
- acceptance criteria
- verification path
- known risks

If a change does not improve one of those, it is probably not the next thing to build.

## Phase 0 — Foundation Alignment
Status: in progress

### Scope
- tenant-first schema
- shared-first topology with dedicated escape hatch
- encrypted connector model
- connector/plugin contract direction
- strong global schema with controlled custom-field extension points
- architecture docs and ADRs
- runtime status routes
- seed/bootstrap path
- verification scripts
- strategy and migration-pack scaffolding

### Acceptance criteria
- runtime schema exists in Supabase migrations
- repo contains spec, roadmap, backlog, and verification docs
- local verification commands are defined and runnable
- org bootstrap path can create the first tenant and integrations
- repo can explain platform-vs-customer migration responsibilities without chat history

### Verification
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run verify`

### Risks
- Supabase project not linked yet
- missing tenant secrets or env values can block runtime seed work

## Phase 1 — Control Plane Skeleton and Connector Contracts
Status: next

### Scope
- strategy and setup docs
- tenant bootstrap and connector install surface
- field mapping config model and machine-readable tenant mapping files
- connector contract hardening for CRM, orders, and calendar adapters
- per-organization Google Maps credential model
- first CLI-oriented service contracts for bootstrap, migration preflight, and health

### Acceptance criteria
- a tenant can be described through repo docs plus machine-readable config
- CLI commands exist for migration preflight, validation, and health checks
- setup docs define the environment contract for a fresh thread
- control-plane responsibilities are no longer deferred to the end of the roadmap

### Verification
- `npm run verify`
- command-level checks for migration preflight and health
- fresh-thread self-test documented in the tenant migration log

### Risks
- platform contracts may still be too loose for a second tenant
- fake or incomplete migration docs create a false sense of readiness

## Phase 2 — Sync Spine
Status: next

### Scope
- Notion webhook ingestion
- sync event recording and dedupe
- sync job queue behavior
- incremental fallback polling contract
- sync health visibility

### Acceptance criteria
- webhook route accepts valid provider events
- dirty page sync jobs are deduped and auditable
- failed webhook processing does not silently lose events
- per-org recent sync activity is inspectable from the app

### Verification
- unit tests around payload validation and dedupe logic
- smoke test hitting runtime APIs
- local replay of a webhook payload into queued work

### Risks
- webhook signature verification details differ by provider and version
- replay/idempotency bugs can duplicate or drop work

## Phase 3 — Identity and Orders Core
Status: planned

### Scope
- normalized Nabis retailer/order ingest
- deterministic account identity model
- reconciliation queue for ambiguous matches
- local order aggregates

### Acceptance criteria
- `licensed_location_id` and `nabis_retailer_id` are explicit identities
- orders feed local account aggregates without reading Notion rollups
- ambiguous matches are reviewable instead of auto-merged

### Verification
- deterministic test fixtures for matching logic
- aggregate calculation tests
- reconciliation queue integration tests

### Risks
- historical CRM data may be inconsistent
- provider identifiers may not be universally present

## Phase 4 — Territory Runtime
Status: planned

### Scope
- territory pin read model
- territory boundary and marker APIs
- shared visibility semantics
- small pin payload and filter facets
- Google Maps runtime integration

### Acceptance criteria
- map pins come from a small local view
- shared boundaries and markers are org-visible
- role-gated edits are enforced
- filters read local runtime fields only

### Verification
- view-level SQL checks
- route smoke tests
- browser verification of map load and shared layer visibility

### Risks
- map polish can hide data model mistakes if verification is weak
- broad payload creep can undo egress savings

## Phase 5 — Unified Account Detail
Status: planned

### Scope
- account detail read model
- contacts and activity
- audit-backed mutations
- local CRM freshness signals

### Acceptance criteria
- account detail never needs a live provider read to become correct
- activity and changes are auditable
- detail surface reads the same account truth as the map

### Verification
- service-layer tests
- API route tests
- browser smoke path from pin -> detail

## Phase 6 — Calendar and Ops
Status: planned

### Scope
- local calendar event model
- Google Calendar adapter
- vendor day and follow-up workflow parity
- operational views

### Acceptance criteria
- event surfaces operate on local models
- role-aware event visibility is enforced
- outbound calendar sync rules are explicit

### Verification
- adapter tests
- integration tests for event merge logic
- browser checks for calendar views

## Phase 7 — Customer Migration Tooling and Productization
Status: planned

### Scope
- migration dry-run and validation workflows
- shadow-mode and parity tooling
- tenant admin UI on top of the existing control-plane model
- field mapping UI
- connector setup UI
- sandbox tenant
- onboarding flow for a second customer

### Acceptance criteria
- a customer migration can be prepared and validated without relying on hidden knowledge
- a new tenant can be created without code changes
- a new provider mapping can be configured from the product
- sandbox/demo environment is usable for showcasing the platform

### Verification
- onboarding smoke test
- config-driven adapter bootstrap test
- docs reviewed for external developer handoff
