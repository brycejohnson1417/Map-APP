# Definition Of Done

## Purpose

This file defines what complete means for a meaningful implementation slice.

A slice is not done when code compiles. A slice is done when behavior, tenant isolation, docs, tests, verification, registry status, and run reporting are all current.

## Universal Done Checklist

Every meaningful slice must satisfy:

- the relevant [WORK_REGISTRY.json](WORK_REGISTRY.json) item has acceptance criteria
- dependencies are done or explicitly promoted first
- implementation preserves existing FraterniTees and PICC behavior
- no tenant-specific shared-code branch is added when config, adapter, primitive, or tenant type defaults can express the behavior
- every new tenant business row is scoped by `organization_id`
- provider credentials remain tenant-scoped
- unsafe provider write-back remains disabled unless explicitly approved
- docs are updated in the same slice as contract changes
- verification commands have been run and recorded
- a run report exists for meaningful implementation work
- the registry item status is updated

## Database Done

Database work is done when:

- migrations are additive unless a destructive change has explicit approval
- every tenant business table includes `organization_id`
- RLS is enabled for every tenant business table
- indexes exist for high-cardinality tenant queries and foreign keys used by runtime screens
- source IDs and raw source metadata are preserved for provider-imported data
- dirty or unmapped provider values have a review state
- [DATA_MODEL.md](DATA_MODEL.md) is current
- [MIGRATION_SAFETY.md](MIGRATION_SAFETY.md) has not been violated

## API Done

API work is done when:

- route request and response shapes match [API_CONTRACTS.md](API_CONTRACTS.md)
- tenant-mutating routes require a tenant session
- every query is organization-scoped
- validation rejects malformed input with a clear error
- provider write-back is not introduced unless the registry item explicitly allows it
- errors distinguish validation failure, permission failure, missing configuration, missing provider permissions, and unexpected failure
- tests or smoke checks prove the route shape

## UI Done

UI work is done when:

- the screen has success, empty, loading, error, and partial-data states where relevant
- tenant configuration controls are available where the decision naturally lives
- disabled features render as intentionally unavailable, not broken
- dirty data is visible before it affects authoritative reporting
- text fits on mobile and desktop
- the UX preserves existing tenant value while improving the workflow
- browser or smoke verification is run when a runnable target exists

## Configuration Done

Configuration work is done when:

- defaults exist at the right scope
- tenant overrides can be saved without code changes
- invalid values are rejected
- changes are auditable
- impact preview exists or clearly states why impact cannot be calculated yet
- undo is available or a rollback path is documented
- downstream screens read resolved configuration, not hardcoded tenant choices

## Integration Done

Integration work is done when:

- runtime UI depends on an adapter or service boundary, not scattered provider-specific calls
- credentials are tenant-scoped
- provider API limitations and missing permissions are visible in the UI/API response
- manual or fixture fallback exists for MVP when live credentials are unavailable
- read-only providers remain read-only unless explicitly approved
- rate-limit and retry behavior is documented when provider calls are live

## Testing Done

Testing work is done when:

- unit or service tests cover core mapping and workflow rules
- fixture-backed tests cover missing credentials where possible
- tenant isolation is tested for tenant-scoped routes or data services
- live-provider tests skip cleanly when credentials are absent
- [ACCEPTANCE_AND_FIXTURES.md](ACCEPTANCE_AND_FIXTURES.md) is current

## Documentation Done

Documentation work is done when:

- requirements are self-contained and do not depend on chat history, attachments, hidden memory, or outside context
- [WORK_REGISTRY.json](WORK_REGISTRY.json) status and dependencies are current
- [ROADMAP.md](ROADMAP.md) reflects phase-level changes
- [TODO.md](TODO.md) reflects human backlog changes
- affected data/API/tenant type/tenant docs are updated
- a run report is written for meaningful implementation work

## Verification Commands

Minimum verification before claiming done:

```bash
npm run check:work-registry
npm run check:self-contained-requirements
npm run check:tenant-types
npm run verify
```

When UI behavior changes and a local server is available:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:runtime
SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_VERIFY=1 npm run verify:browser
```

If verification cannot run, the final response and run report must state the exact command, failure, reason, and remaining risk.
