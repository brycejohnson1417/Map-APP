# Platform Roadmap

This file is the concise execution view. The detailed acceptance criteria live in [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), and the live backlog lives in [docs/TODO.md](TODO.md).

## Current status

### Complete or substantially landed
- tenant-first Supabase schema
- organization and membership runtime foundation
- encrypted connector model
- architecture docs and ADRs
- seed/bootstrap workflow
- baseline verification scripts

### In progress
- runtime documentation and handoff discipline
- self-verification loop
- control-plane and migration-pack design

### Next
- strategy doc and migration-pack completion
- per-organization Google Maps credential model
- first CLI migration preflight/validation commands
- Notion webhook ingestion and sync event recording
- first thin territory pin read model
- generated database typing for repositories

## Phase sequence

### Phase 0 — Foundation alignment
- schema
- bootstrap
- docs
- verification

### Phase 1 — Control plane skeleton
- tenant setup and bootstrap
- connector installs
- field mappings
- migration preflight
- tenant-scoped Google Maps keys

### Phase 2 — Sync spine
- webhook ingestion
- sync cursors
- retryable jobs
- sync health visibility

### Phase 3 — Identity and orders core
- Nabis ingest
- deterministic matching
- reconciliation queue
- local order aggregates

### Phase 4 — Unified territory runtime
- pin read model
- shared boundaries and markers
- filter facets
- Google Maps runtime

### Phase 5 — Unified account detail
- local account detail view
- contacts
- activity
- audit-backed mutations

### Phase 6 — Calendar and operations
- local calendar model
- Google Calendar adapter
- vendor day and follow-up workflows

### Phase 7 — Customer migration and productization
- migration dry-run and validation tooling
- parity/shadow-mode tooling
- tenant admin UI
- field mapping UI
- onboarding
- sandbox/demo tenant
