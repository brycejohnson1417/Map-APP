# Running To-Do List

This backlog follows the shape required by [AUTONOMOUS_EXECUTION.md](AUTONOMOUS_EXECUTION.md): current focus, next slices, blocked, and debt to retire.

For vocabulary, read [GLOSSARY.md](GLOSSARY.md). The machine-readable execution queue is [WORK_REGISTRY.json](WORK_REGISTRY.json), explained by [WORK_REGISTRY.md](WORK_REGISTRY.md). For the immediate pre-Screenprinting foundation, read [ARCHITECTURE_RUNWAY.md](ARCHITECTURE_RUNWAY.md). For long-running implementation behavior, read [AUTONOMOUS_PRODUCT_BUILD.md](AUTONOMOUS_PRODUCT_BUILD.md).

When this file and [WORK_REGISTRY.json](WORK_REGISTRY.json) disagree, the registry wins.

## Current Focus

- [x] Add the autonomous execution control plane: work registry, authority order, definition of done, fixture policy, environment/deployment policy, migration safety policy, and registry validation.
- [x] Implement the architecture runway before Screenprinting: config schema foundation, adapter ports, feature flags, audit/activity hooks, static boundary checks, and run-report discipline.
- [x] During implementation, promote any documented future foundation item that becomes the best prerequisite for the current feature, then continue the feature after documenting the promotion.
- [x] Implement the Screenprinting additive database foundation from [DATA_MODEL.md](DATA_MODEL.md): `mapping_rule`, `opportunity`, `reorder_signal`, `email_template`, `social_account`, `social_post`, `social_thread`, `campaign`, `alert_rule`, `alert_instance`, `identity_resolution`, and `dashboard_definition`.
- [x] Implement the Screenprinting API routes from [API_CONTRACTS.md](API_CONTRACTS.md) with tenant-session protection and `organization_id` scoping.
- [x] Build the Screenprinting admin configuration UX for statuses, payment states, tags, fields, dirty-data trust, categories, owners, reorder rules, social account rules, alerts, dashboards, and feature flags.
- [x] Build the Screenprinting Sales module from [tenant-types/screenprinting/SALES_MODULE.md](tenant-types/screenprinting/SALES_MODULE.md).
- [x] Build the Screenprinting Social module from [tenant-types/screenprinting/SOCIAL_MODULE.md](tenant-types/screenprinting/SOCIAL_MODULE.md).
- [x] Close the competitor-demo parity gaps that are safe for the current MVP: order cockpit saved views, reorder lifecycle controls, editable goals, account cleanup queues, opportunity editing, margin worksheet, social alert/post filters, account taxonomy controls, draft-only composer, and custom dashboard definitions.
- [x] Add tenant-facing Meta/Instagram OAuth for owned account connection, watched account import, publishing, comment replies, and message replies behind token/scope/owned-account feature gates.
- [x] Add tenant-facing onboarding/help docs in the Screenprinting Admin UI and repo docs.
- [x] Preserve existing FraterniTees Printavo sync, lead scoring, score trends, DNC behavior, top-customer leaderboard, account directory, account detail, map, and change-request capabilities while improving the UI/UX.

## Architecture Runway Tasks

- [x] Keep [WORK_REGISTRY.json](WORK_REGISTRY.json) current as items move from `planned` to `ready`, `in_progress`, `blocked`, or `done`.
- [x] Add typed config definition and tenant override resolution.
- [x] Add config validation, impact preview interface, change history, and undo path.
- [x] Add initial config definitions for Screenprinting status mapping, payment mapping, tag mapping, field trust, reorder rules, email templates, social account categories, alert rules, dashboard defaults, and feature flags.
- [x] Add `OrderingPlatformAdapter` port and contract tests.
- [x] Move Printavo read-only fetch/preview/sync behavior behind the ordering adapter boundary.
- [x] Add `SocialPlatformAdapter` port and manual social adapter stub.
- [x] Add future `CatalogAdapter` stub without implementing profitability.
- [x] Add Screenprinting tenant-scoped feature flags.
- [x] Add audit/activity helpers for config changes, identity decisions, opportunities, reorders, draft emails, social links, alert state, and manual social threads.
- [x] Extend static boundary checks for tenant type leaks, missing `organization_id`, missing RLS, and provider credential leakage.
- [x] Add run report for the foundation build under `docs/runs/`.

## Next Slices

- [x] Add acceptance tests that use [fixtures/screenprinting/sample-screenprinting-data.json](../fixtures/screenprinting/sample-screenprinting-data.json).
- [ ] Add targeted tests for mapping-rule evaluation, dirty-data exclusions, reorder signal generation, alert-rule evaluation, and identity-resolution decisions.
- [x] Add browser/runtime verification for Screenprinting Sales and Social flows once UI routes exist.
- [ ] Add authenticated tenant-session E2E tests for Screenprinting saved views, manager goals, draft social posts, manual social import, manual thread logging, campaign creation, alert updates, and identity-resolution approvals.
- [ ] Convert more FraterniTees score/trend/read-model behavior into reusable primitives and package contracts.
- [ ] Move remaining tenant-specific map filter/facet behavior into explicit registry config.
- [ ] Generalize recurring connector sync beyond the first FraterniTees Printavo automation slice.
- [ ] Add tenant type version/upgrade previews to onboarding/admin UX.
- [ ] Expand self-serve connector save/sync behavior for more providers.
- [ ] Add preview/policy automation to the change-request queue.

## Blocked Or Pending Tenant Decisions

- [ ] FraterniTees must choose which Printavo statuses count as quoted, in production, completed, cancelled/lost, paid, unpaid, ignored, or dirty.
- [ ] FraterniTees must choose tag/category mappings and field trust settings before new reports are authoritative.
- [ ] FraterniTees must choose reorder cycles, high-value windows, follow-up owners, and email templates.
- [ ] FraterniTees must choose final owned and watched Instagram/social accounts, alert thresholds, and social follow-up owners. Platform operators must configure production Meta app credentials/scopes for OAuth.
- [ ] Tenant role enforcement for admin-only config changes needs a final auth policy decision before broad customer rollout.
- [ ] Direct browser Supabase access needs explicit RLS policies before any tenant table is exposed to the client.

## Future Stack Proposal

- [ ] Revisit [proposals/FUTURE_STACK_PROPOSAL.md](proposals/FUTURE_STACK_PROPOSAL.md) after the Screenprinting foundation has real implementation pressure.
- [ ] Promote only the smallest useful future-stack slice when it prevents hardcoded tenant logic, duplicated provider behavior, unsafe data handling, or brittle config work.
- [ ] Do not start pnpm/Turborepo/package/schema-topology migration without a separate approved migration plan.
- [ ] Do not pause Screenprinting product delivery for spinout drills, generated package scaffolds, or schema-per-vertical work.

## Debt To Retire

- [ ] Keep [WORK_REGISTRY.json](WORK_REGISTRY.json) and [ROADMAP.md](ROADMAP.md) aligned.
- [ ] Remove or migrate duplicate integration secret table paths after confirming deployed database state.
- [ ] Reduce direct interpretation of tenant-specific `custom_fields` in shared components.
- [ ] Keep [DATA_MODEL.md](DATA_MODEL.md), [API_CONTRACTS.md](API_CONTRACTS.md), and [tenant-types/SCHEMA.md](tenant-types/SCHEMA.md) current after schema/API/config changes.
- [ ] Keep [ARCHITECTURE_RUNWAY.md](ARCHITECTURE_RUNWAY.md) current until the pre-Screenprinting foundation is complete.
- [ ] Keep [STATUS.md](STATUS.md) as a one-page state summary rather than a commit log.
- [ ] Keep tenant-specific docs populated with real tenant decisions once admin config is chosen.
- [ ] Avoid adding shared-code branches when a mapping rule, tenant type default, workspace override, adapter, or package config can express the behavior.
