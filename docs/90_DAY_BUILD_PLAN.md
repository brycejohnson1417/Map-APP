# 90-Day Build Plan

## Purpose

This plan turns [AI_NATIVE_OPS_STRATEGY.md](AI_NATIVE_OPS_STRATEGY.md) into a practical build sequence.

This is a strategy plan, not executable approval for every item. Work becomes executable when it is added to [WORK_REGISTRY.json](WORK_REGISTRY.json), attached to a coherent issue, and validated against [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md).

## Boundaries

- Keep PICC-Web-App in production triage mode. Do not refactor or rebuild it here.
- Keep Map App Harness as the scalable platform where PICC is a first tenant/customer, not the product identity.
- Keep provider write-back disabled unless a future approved slice adds explicit permission, preview, audit, and rollback behavior.
- Do not change Notion, GHL, Nabis, Printavo, Meta, Supabase production data, auth, RLS, schema, or Vercel linkage without explicit approval for that slice.
- Do not ship backend-only AI features. The user-visible browser workflow is the product.

## 90-day definition of done

By the end of this plan, Map App Harness should have one visible AI-native operations loop that is useful for current tenants and reusable for tenant #10.

The target proof:

- a tenant-facing Operations Brief surface exists
- the brief uses tenant-scoped runtime data
- the brief ranks next actions with visible provenance
- drafts or proposed actions are human-approved
- missing, stale, dirty, or conflicting data is visible
- at least one PICC workflow and one Screenprinting workflow use the same underlying action/recommendation contract
- verification covers deterministic recommendation logic
- browser proof shows the workflow end to end
- docs explain the workflow, data contract, UI behavior, guardrails, and acceptance criteria

## Workstream 1: AI action contract

Objective: define the shared shape for recommendations before building one-off AI UI.

Deliverables:

- `ai_action` or equivalent domain concept documented in [DATA_MODEL.md](DATA_MODEL.md)
- API contract for read-only recommendation output in [API_CONTRACTS.md](API_CONTRACTS.md)
- action types for brief, draft, data-quality suggestion, proposal suggestion, and config/change request suggestion
- provenance fields for source records and sync freshness
- risk state fields for stale, missing, dirty, conflicted, fixture-backed, and approval-required data
- audit/event path for accepted or dismissed suggestions

Acceptance criteria:

- no tenant-specific action type requires a shared-code fork
- a future PICC or Screenprinting action can use the same base shape
- sensitive actions are approval-gated by contract
- fixture-backed examples exist

## Workstream 2: Operations Brief v1

Objective: give operators a useful daily/situational work surface.

Initial surface:

- route: a tenant-scoped operations/brief surface or existing dashboard section
- audience: tenant operator, manager, and platform admin
- mode: read-only recommendations and draft-only outputs

Inputs:

- account records
- contact records
- order records
- territory or map state
- recent activity
- sync freshness
- identity conflicts
- tenant configuration

Outputs:

- top next actions
- source-backed account priorities
- stale data warnings
- suggested follow-up drafts
- proposed review queues

Acceptance criteria:

- real saved tenants show real runtime data or explicit empty states
- source records are visible from each recommendation
- fixture rows are never silently shown for saved tenants
- no provider write-back occurs
- browser verification covers the visible workflow

## Workstream 3: Data Quality Review v1

Objective: turn dirty operational data into a visible, safe review queue.

Initial queues:

- duplicate or conflicting account identity
- missing contact
- stale sync
- unmapped provider status/tag
- dirty field value
- unresolved tenant-specific mapping decision

Acceptance criteria:

- each item shows source provider and affected tenant surface
- destructive cleanup is not automatic
- accepted decisions are auditable
- unresolved decisions remain visible

## Workstream 4: PICC wholesale proof

Objective: prove the shared action contract with a cannabis wholesale workflow.

Candidate first workflow:

PICC account brief for territory follow-up and Preferred Partner or VMI proposal readiness.

Inputs:

- account status
- territory ownership
- order history
- contact availability
- PPP/VMI package rules
- credit or account flags when available
- sync freshness

Outputs:

- ranked accounts to follow up
- draft follow-up copy
- proposal readiness checklist
- missing data warnings

Acceptance criteria:

- output is draft-only
- pricing/program logic is package or tenant config, not scattered shared-code branching
- source orders/accounts are visible
- missing live inventory data is disclosed instead of invented

## Workstream 5: Screenprinting proof

Objective: prove the shared action contract with a Screenprinting workflow.

Candidate first workflow:

FraterniTees reorder and social follow-up brief.

Inputs:

- Printavo order history
- account scoring
- reorder rules
- social account state
- campaign or alert state
- dirty status/tag mappings

Outputs:

- reorder candidates
- draft customer follow-ups
- social/account mapping review items
- warning states for dirty data

Acceptance criteria:

- Printavo remains read-only
- social publishing remains disabled or permission-gated
- dirty mappings are visible
- recommendations use tenant-scoped data only

## Workstream 6: Change Request Copilot

Objective: make tenant requests safer and more actionable.

Initial behavior:

- classify request as config, package, primitive, adapter, data, or core-platform
- list impacted docs/contracts
- propose acceptance criteria
- propose verification commands
- identify whether provider writes, schema changes, auth/RLS changes, or production data changes are required

Acceptance criteria:

- proposal-only until maintainer approval
- generated items are self-contained
- risky categories are visibly approval-gated
- suggested work items can be copied into [WORK_REGISTRY.json](WORK_REGISTRY.json) after review

## 90-day sequence

### Days 1-14: Contract and proof design

- Add a work-registry item for the AI action contract.
- Document the data/API/UI contract before implementation.
- Create fixture examples for PICC and Screenprinting recommendations.
- Define the first browser-visible Operations Brief path.

Exit criteria:

- reviewed contract docs
- fixture examples
- executable work item
- no production write requirement

### Days 15-30: Operations Brief v1

- Implement read-only brief generation from runtime data or fixtures.
- Build the tenant-visible brief UI.
- Show provenance, stale data, missing data, and approval-required states.
- Verify with deterministic tests and browser proof.

Exit criteria:

- browser-visible brief
- no fake tenant data for saved tenants
- no provider write-back
- verification passing

### Days 31-45: Data Quality Review v1

- Add review queues for identity, contact, stale-sync, and dirty-mapping issues.
- Connect accepted or dismissed decisions to audit/activity behavior where safe.
- Keep destructive cleanup manual.

Exit criteria:

- visible review queue
- source provider and affected surfaces shown
- accepted/dismissed states auditable or documented

### Days 46-60: PICC proof workflow

- Build the PICC territory/account brief on the shared action contract.
- Add Preferred Partner or VMI proposal readiness as draft-only output.
- Document package/config boundaries for PICC-specific logic.

Exit criteria:

- PICC workflow uses the shared action shape
- source data visible
- no invented inventory or pricing facts
- draft-only output

### Days 61-75: Screenprinting proof workflow

- Build the FraterniTees reorder/social brief on the shared action contract.
- Reuse existing Screenprinting scoring, reorder, and social state where possible.
- Keep Printavo read-only and social writes gated.

Exit criteria:

- Screenprinting workflow uses the shared action shape
- dirty mappings visible
- draft-only output
- browser proof captured

### Days 76-90: Change Request Copilot and portfolio proof

- Add proposal-only change request classification.
- Generate acceptance criteria and verification suggestions from request context.
- Capture screenshots, workflow metrics, and a public-safe case-study packet.

Exit criteria:

- request classifier visible in product or admin workflow
- work item proposal is self-contained
- proof packet has screenshots, metrics, safety boundaries, and architecture tradeoffs

## First implementation slice to promote

Recommended first executable slice:

`AI-OPS-001: AI action contract and read-only Operations Brief foundation`

Scope:

- docs for data/API/UI behavior
- fixture recommendation examples
- typed contract for recommendations/actions
- read-only tenant-scoped brief endpoint or service
- minimal browser-visible brief surface

Out of scope:

- provider write-back
- outbound messaging
- schema migration unless explicitly approved
- changing PICC-Web-App
- autonomous production data mutation

Suggested verification:

- `npm run check:work-registry`
- `npm run typecheck`
- `npm run lint`
- `npm run verify`
- browser verification for the brief route if UI changes land

## Metrics to track

Product metrics:

- time from login to useful next action
- number of recommendations with complete provenance
- number of stale/missing/conflicted data warnings surfaced
- number of accepted versus dismissed recommendations
- draft follow-up acceptance rate
- tenant requests classified without founder rewrite

Engineering metrics:

- number of workflows using the shared action contract
- number of tenant-specific branches avoided
- verification pass rate
- route payload size for brief surfaces
- time to onboard a new tenant type workflow from docs alone

Portfolio proof metrics:

- screenshots of visible workflows
- before/after operator workflow time
- examples of safety boundaries
- examples of architecture tradeoffs
- examples of AI-assisted implementation with human review

## Stop conditions

Stop and request review before continuing if a slice requires:

- production provider write-back
- schema migration or RLS/auth changes
- secret or environment changes
- destructive data cleanup
- live customer messaging
- replacing existing PICC or FraterniTees behavior
- broad repo topology or package-manager migration

