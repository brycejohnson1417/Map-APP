# Architecture Runway

## Purpose

This file defines the foundation work that should happen before the Screenprinting Sales/Social product build.

The goal is not a full platform rewrite. The goal is to add the contracts and guardrails that Screenprinting will immediately depend on, while preserving current FraterniTees and PICC behavior.

For vocabulary, read [GLOSSARY.md](GLOSSARY.md). For current database and API contracts, read [DATA_MODEL.md](DATA_MODEL.md) and [API_CONTRACTS.md](API_CONTRACTS.md).

For autonomous execution order, read [WORK_REGISTRY.md](WORK_REGISTRY.md) and parse [WORK_REGISTRY.json](WORK_REGISTRY.json).

## Decision

Build a small architecture runway now, then build Screenprinting on top of it.

For long-running implementation sessions, follow [AUTONOMOUS_PRODUCT_BUILD.md](AUTONOMOUS_PRODUCT_BUILD.md): if a documented future foundation item becomes the best prerequisite for the current feature, implement the smallest useful version of that foundation first and continue.

Do now:

- configuration schema foundation
- adapter port contracts
- Printavo ordering adapter boundary
- social adapter port and manual-import-first stub
- Screenprinting feature flags
- audit/activity hooks for risky actions
- static boundary checks
- run-report and agent-scope discipline
- additive Screenprinting database foundation

Do not block Screenprinting on:

- pnpm/Turborepo migration
- physical `packages/core`, `packages/verticals`, and `packages/adapters` restructuring
- schema-per-vertical
- custom migration runner
- branch-specific Supabase database infrastructure
- spinout drills
- generated package scaffolds
- full hypothetical-vertical corpus
- replacing current data access, auth, or routing infrastructure

## Why This Runway Comes First

Screenprinting requires tenant configuration everywhere:

- Printavo status mapping
- Printavo payment mapping
- Printavo tag mapping
- dirty field exclusions
- reorder cycles
- email templates
- owned/watched social accounts
- alert thresholds
- dashboard widgets and saved views
- feature flags for publishing, comments, messages, and catalog costs

If those are implemented as one-off UI state or FraterniTees-specific branches, later extraction will be expensive. The runway makes those decisions explicit before the product UI grows around them.

## Architecture Runway Items

### 1. Configuration Schema Foundation

Implement a small typed configuration system that supports:

- config definition key
- scope: global, tenant type, tenant, or user
- default value
- tenant override value
- validation
- impact preview function interface
- change history
- undo path
- display metadata for admin UI

Minimum config areas for the first pass:

- `screenprinting.printavo.status_mapping`
- `screenprinting.printavo.payment_mapping`
- `screenprinting.printavo.tag_mapping`
- `screenprinting.printavo.field_trust`
- `screenprinting.sales.reorder_rules`
- `screenprinting.sales.email_templates`
- `screenprinting.social.account_categories`
- `screenprinting.social.alert_rules`
- `screenprinting.dashboard.default_widgets`
- `screenprinting.features`

Acceptance criteria:

- a config definition can provide defaults
- a tenant override can replace the default
- invalid override values are rejected
- a config change can return impact preview metadata
- config changes are tenant-scoped
- config changes can be audited and undone

### 2. Adapter Port Contracts

Define adapter ports before building deeper Screenprinting provider behavior.

Initial ports:

- `OrderingPlatformAdapter`
- `SocialPlatformAdapter`
- future stub: `CatalogAdapter`

`OrderingPlatformAdapter` should cover:

- list statuses
- fetch orders
- fetch customers/accounts
- fetch contacts
- expose source deep links
- expose sync cursor metadata
- normalize provider data into canonical account/contact/order primitives

`SocialPlatformAdapter` should cover:

- list connected owned accounts when API access allows
- import watched/manual accounts
- fetch posts/media where permissions allow
- fetch comments/messages where permissions allow
- expose permission state and missing-permission reasons
- provide manual fallback paths

Acceptance criteria:

- Printavo runtime code calls an ordering adapter boundary instead of spreading provider logic across UI/runtime services.
- Social MVP can start with a manual adapter and later add Meta/Instagram API behavior without changing Social UI contracts.
- Provider credentials remain tenant-scoped.

### 3. Feature Flags

Add tenant-scoped feature flags for Screenprinting:

- `screenprinting.sales`
- `screenprinting.social`
- `screenprinting.social_publishing`
- `screenprinting.comments_replies`
- `screenprinting.messages`
- `screenprinting.catalog_costs`
- `screenprinting.profitability`

Acceptance criteria:

- FraterniTees can enable Sales/Social MVP without enabling publishing or catalog costs.
- Hidden/disabled features do not appear as broken UI.
- Feature flags are tenant-scoped and do not affect PICC.

### 4. Audit And Activity Hooks

The first Screenprinting build needs audit/activity records for:

- config changes
- config undo
- status/tag/field mapping changes
- identity suggestion confirmed/rejected/ignored
- opportunity created/updated
- reorder snoozed/converted/ignored
- draft email rendered/copied/opened/marked sent
- social account linked/unlinked
- alert marked read/resolved/dismissed
- manual social thread logged

Acceptance criteria:

- risky product-owned actions emit tenant-scoped audit or activity records
- audit/activity records include `organization_id`
- no provider write-back is implied by audit/activity creation

### 5. Static Boundary Checks

Extend static checks to guard against:

- Screenprinting code importing Cannabis Wholesale-specific modules
- Cannabis Wholesale code importing Screenprinting-specific modules
- shared runtime code depending directly on tenant-specific modules where a primitive/config/adapter boundary should be used
- new tenant business table docs/migrations missing `organization_id`
- new tenant business table docs/migrations missing RLS enablement
- generic provider credentials in tenant runtime paths
- lazy product requirements in docs

Acceptance criteria:

- `npm run verify` runs the boundary checks
- failures explain the broken rule in plain English
- existing tenant behavior remains untouched unless a failure reveals a real leak

### 6. Agent Run Discipline

Add lightweight run discipline now:

- agent scope docs
- run report template
- optional lock file for active breaking work

Acceptance criteria:

- meaningful implementation runs produce a run report under `docs/runs/`
- concurrent work can declare whether it is core, adapter, tenant type, tenant-specific, or docs-only
- the process helps future agents without requiring a full worktree/orchestration platform

## Implementation Order

1. Add config schema foundation.
2. Add adapter port types and first contract tests.
3. Move Printavo read-only calls behind the ordering adapter boundary.
4. Add Social manual adapter/stub boundary.
5. Add Screenprinting feature flags and flag resolution.
6. Add audit/activity helper paths for Screenprinting actions.
7. Add static boundary checks and wire them into `npm run verify`.
8. Add additive Screenprinting migrations from [DATA_MODEL.md](DATA_MODEL.md).
9. Build Screenprinting admin configuration.
10. Build Screenprinting Sales MVP.
11. Build Screenprinting Social MVP.

Each implementation item should update its matching registry status in [WORK_REGISTRY.json](WORK_REGISTRY.json).

## Future Architecture Proposal

The larger package/monorepo architecture is tracked separately in [proposals/FUTURE_STACK_PROPOSAL.md](proposals/FUTURE_STACK_PROPOSAL.md).

That proposal is not the current implementation contract. Pull from it when the repo has enough product proof to justify physical package boundaries, schema-per-vertical, custom migration tooling, branch-specific database infrastructure, and spinout drills.

If a future-stack idea becomes necessary to avoid hardcoded tenant logic, duplicated provider behavior, unsafe tenant isolation, or brittle config implementation, promote the minimal focused version into this runway instead of building around the missing foundation.

## Non-Negotiables

- Preserve current FraterniTees behavior.
- Preserve current PICC behavior.
- Keep Printavo read-only for MVP.
- Keep email draft-only for MVP.
- Keep publishing disabled unless explicitly feature-flagged later.
- Keep tenant data isolated by `organization_id`.
- Keep docs current with every schema/API/config change.
