# Roadmap

This file is the phase view. The autonomous execution queue is [WORK_REGISTRY.json](WORK_REGISTRY.json). The human backlog view is [TODO.md](TODO.md). Current live/planned surface status is [STATUS.md](STATUS.md).

For vocabulary, read [GLOSSARY.md](GLOSSARY.md). For the immediate foundation sequence, read [ARCHITECTURE_RUNWAY.md](ARCHITECTURE_RUNWAY.md).

For long-running implementation behavior, read [AUTONOMOUS_PRODUCT_BUILD.md](AUTONOMOUS_PRODUCT_BUILD.md), [WORK_REGISTRY.md](WORK_REGISTRY.md), and [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md). If a planned or future foundation item becomes the best prerequisite for a requested feature, promote the smallest useful version first, then continue the feature.

## Phase 1: Stabilize Product Contracts

Priority: highest

Status: in progress

Definition of done:

- [x] tenant type manifests exist for Screenprinting and Cannabis Wholesale
- [x] self-contained product requirements rule exists
- [x] canonical data model doc exists
- [x] canonical API contract doc exists
- [x] tenant type/workspace schema doc exists
- [x] architecture runway exists for the pre-Screenprinting foundation
- [x] autonomous product build policy exists for foundation-first promotion during long Codex CLI runs
- [x] work registry exists as the machine-readable execution queue
- [x] definition of done exists
- [x] fixture, environment, deployment, and migration safety policies exist
- [x] work registry validation is wired into verification
- [x] docs remain current after the first Screenprinting implementation slice

Primary risk: implementation drifting back into code-first behavior without updating docs.

## Phase 2: Architecture Runway Before Screenprinting

Priority: highest

Status: complete

Definition of done:

- [x] minimal typed config schema foundation exists
- [x] tenant override resolution, validation, impact preview interface, change history, and undo path exist
- [x] ordering adapter port exists
- [x] Printavo read-only behavior goes through an ordering adapter boundary
- [x] social adapter port/manual adapter stub exists
- [x] Screenprinting feature flags exist and are tenant-scoped
- [x] audit/activity hooks exist for config changes, identity decisions, opportunities, reorders, draft emails, alert state, and manual social logs
- [x] static boundary checks guard tenant type leaks, missing `organization_id`, missing RLS, and generic provider credentials
- [x] run-report and agent-concurrency docs are in use
- [x] existing FraterniTees and PICC behavior still passes verification

Primary risk: turning a focused runway into a broad platform rewrite.

## Phase 3: Screenprinting Data Foundation

Priority: highest

Status: complete

Definition of done:

- [x] additive migrations exist for Screenprinting primitives listed in [DATA_MODEL.md](DATA_MODEL.md)
- [x] every new tenant business table has `organization_id`
- [x] RLS is enabled for every new tenant business table
- [x] repository/service contracts exist for mappings, opportunities, reorders, social accounts, posts, threads, campaigns, alerts, dashboards, and identity resolution
- [x] existing FraterniTees Printavo sync, scoring, account directory, account detail, map, top-customer leaderboard, and change requests still pass verification

Primary risk: building UI before the mapping and identity foundation is stable.

## Phase 4: Screenprinting Admin Configuration

Priority: high

Status: MVP complete

Definition of done:

- [x] tenant admins can configure Printavo statuses, payment states, tags, field trust, dirty-data exclusions, customer categories, follow-up ownership, reorder rules, email templates, social accounts, alerts, dashboards, and feature flags
- [x] risky mapping changes show impact previews when feasible
- [x] config changes affect Sales/Social behavior without code edits
- [x] tenant-specific config does not affect other tenants

Primary risk: too much flexibility without stable primitives underneath.

## Phase 5: Screenprinting Sales MVP

Priority: high

Status: MVP complete

Definition of done:

- [x] Sales dashboard, Orders, Order Detail, Accounts Cleanup, Opportunities, Reorders, Email Templates, Goals, and Sales Admin screens exist at MVP/API level
- [x] Printavo remains read-only
- [x] email remains draft-only
- [x] tenant mappings drive reporting buckets
- [x] existing FraterniTees scoring and customer-protection views remain available
- [x] fixture-backed checks cover mapping, tenant isolation prerequisites, migration shape, and route availability

Primary risk: treating dirty Printavo statuses/tags as authoritative before tenant review.

## Phase 6: Screenprinting Social MVP

Priority: high

Status: MVP complete

Definition of done:

- [x] Social dashboard, Accounts Registry, Account Detail, Posts, Post Detail, Alerts, Alert Rules, Calendar, Campaigns, Conversations, Compose Gate, and Social Admin screens exist at MVP/API level
- [x] owned and watched accounts support manual import paths, with API-backed scan represented as permission-gated fallback
- [x] comments/replies are permission-gated
- [x] messages/comments/manual threads can link to customers, organizations, contacts, opportunities, and campaigns
- [x] publishing is disabled by default and remains feature-gated
- [x] fixture-backed checks cover alert route availability and identity link prerequisites

Primary risk: platform API limitations creating false UI promises.

## Phase 7: Multi-Tenant Scale

Priority: medium

Status: MVP complete

Definition of done:

- [x] a second Screenprinting tenant can onboard from the Screenprinting tenant type without a code fork
- tenant type versioning and upgrade previews are implemented
- tenant dashboards and saved views are configurable by role
- tenant-specific docs record actual tenant decisions after configuration
- direct browser Supabase access either remains avoided or has explicit RLS policies

Primary risk: custom one-off tenant branches returning through urgent customer requests.

## Phase 8: Future Stack Extraction

Priority: future

Status: proposal

Definition of done:

- future package/monorepo migration has an approved plan
- physical package boundaries are introduced only after current tenant behavior is verified
- schema topology changes have a migration and rollback plan
- any spinout/readiness tooling proves value before becoming mandatory

Primary risk: pausing product learning for speculative platform migration.

## Phase 9: Later Expansion

Priority: future

Status: future

Definition of done:

- catalog adapter boundary supports tenant-selected vendor cost APIs
- profitability uses reliable line item and cost data
- Art module has proof/assets/licensing workflow contracts
- Warehouse module has inventory/SKU/fulfillment workflow contracts

Primary risk: expanding into profitability, art, or warehouse before the sales/customer/social foundation is dependable.
