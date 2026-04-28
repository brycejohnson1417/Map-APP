# Autonomous Product Build Policy

## Purpose

This file defines how a long-running Codex CLI implementation session should behave when building the architecture runway and Screenprinting product work.

The goal is that one strong prompt can carry the implementation forward without repeatedly stopping for obvious next steps.

## Authority Order

When requirements conflict, use this authority order:

1. [../AGENTS.md](../AGENTS.md)
2. This file
3. [WORK_REGISTRY.json](WORK_REGISTRY.json)
4. [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)
5. [DATA_MODEL.md](DATA_MODEL.md)
6. [API_CONTRACTS.md](API_CONTRACTS.md)
7. [tenant-types/SCHEMA.md](tenant-types/SCHEMA.md)
8. Tenant type docs under `docs/tenant-types/<type>/`
9. Tenant-specific docs under `docs/tenants/<tenant>/`
10. [ROADMAP.md](ROADMAP.md)
11. [TODO.md](TODO.md)
12. Older docs and proposal docs

If a proposal doc conflicts with a current executable work item, the executable work item wins. Proposal docs are not implementation approval by themselves.

## Core Rule

Do not knowingly build a weaker feature implementation when a documented foundational slice should come first.

If a planned or future foundation item becomes the best prerequisite for the current feature, implement the smallest useful version of that foundation first, update docs, add verification, then continue the feature.

## Work Registry Rule

[WORK_REGISTRY.json](WORK_REGISTRY.json) is the execution queue.

A long-running Codex CLI session should:

1. Parse the registry.
2. Execute `ready` items in priority order.
3. Promote `planned` items to `ready` when dependencies become `done`.
4. Skip `done` items.
5. Stop on `blocked` items only when they block the active path.
6. Update the registry, docs, tests, verification evidence, and run report after every meaningful slice.

Human-readable docs explain why. The registry tells Codex what to do next.

## Foundation-First Promotion Rule

During implementation, Codex should promote a future/proposal item into the active build when all are true:

1. The current feature would otherwise require hardcoded tenant logic, duplicated provider logic, unsafe tenant data handling, or brittle UI state.
2. A documented foundation item already describes the better boundary.
3. The foundation can be implemented in a focused, revertable way.
4. The implementation can preserve existing FraterniTees and PICC behavior.

Examples:

| Current feature pressure | Promote this foundation first |
|---|---|
| Screenprinting mapping UI would hardcode status buckets | config schema foundation |
| Printavo order UI would call Printavo directly from runtime UI | ordering adapter port |
| Social manual import would not leave room for Meta/Instagram API | social adapter port/manual adapter |
| Sales/Social module would expose partial surfaces to all tenants | tenant-scoped feature flags |
| Identity suggestions would be unreviewable | identity-resolution primitive and audit/activity hooks |
| Alert thresholds would be hardcoded | config schema plus alert rule primitive |
| New table would be queried without tenant boundary | data model/RLS foundation first |
| Multiple agents would collide on shared contracts | lock/run-report discipline |

## Continue-Until-Done Rule

A Codex CLI session given the full build prompt should continue through:

1. architecture runway
2. additive database foundation
3. Screenprinting admin configuration
4. Screenprinting Sales MVP
5. Screenprinting Social MVP
6. identity resolution
7. targeted tests
8. docs updates
9. verification
10. run report

It should not stop after only a plan unless the prompt explicitly asks for planning only.

The session is complete only when no `ready` or newly unblocked registry item remains, or an allowed stop condition applies.

## Allowed Stop Conditions

Stop and request review only when one of these is true:

- a destructive migration is needed
- production data or provider write-back is required
- tenant secrets are missing and no safe stub/manual fallback exists
- a tenant business decision is required and no safe configurable default can preserve progress
- verification reveals a failure that cannot be fixed safely in the current scope
- a future stack migration would require broad package manager/repo topology changes
- implementing the next step would remove or break existing FraterniTees or PICC behavior

When stopping, write a blocker note in the run report with exact files, failed commands, and the decision needed.

## Safe Defaults

When tenant decisions are pending, use safe defaults:

- mark unmapped provider values as `needs_review` or `dirty`
- keep Printavo read-only
- keep email draft-only
- keep publishing disabled
- allow manual social import/logging when API access is unavailable
- show warning states instead of pretending reports are authoritative
- preserve source payloads and source IDs
- use non-destructive identity suggestions

## Do Not Invent Tenant Facts

When tenant-specific facts are unknown:

- do not invent exact tenant status mappings, social handles, tags, reorder windows, owners, or trusted fields
- choose a safe default only when it is documented
- mark the unknown value as configurable, `needs_review`, or `dirty`
- expose the decision in admin configuration
- record the open decision in the tenant-specific docs

## Future Proposal Boundary

Future-stack ideas are useful but not automatically executable.

Codex may implement a future proposal item only when:

- [WORK_REGISTRY.json](WORK_REGISTRY.json) marks it `ready`
- or it is the smallest necessary foundation for the current active item

Do not begin a broad package manager migration, repository topology migration, schema-topology migration, spinout system, generator system, or package extraction unless a registry item explicitly marks that work `ready` or the run report explains why the minimal promoted slice is required now.

## Documentation Requirements

If a future proposal item is promoted into the active build:

1. Update [ARCHITECTURE_RUNWAY.md](ARCHITECTURE_RUNWAY.md) if it becomes part of the current foundation.
2. Update [TODO.md](TODO.md) and [ROADMAP.md](ROADMAP.md).
3. Update [WORK_REGISTRY.json](WORK_REGISTRY.json).
4. Update [DATA_MODEL.md](DATA_MODEL.md), [API_CONTRACTS.md](API_CONTRACTS.md), or [tenant-types/SCHEMA.md](tenant-types/SCHEMA.md) if contracts change.
5. Record the reason in the run report.

## Verification Requirements

Every promoted foundation slice must include at least one observable check:

- route returns expected shape
- service test proves behavior
- static check fails on the forbidden pattern
- migration adds expected table/index/RLS
- UI shows expected enabled/disabled state
- config impact preview returns expected affected counts or placeholder warnings

`npm run verify` must pass before claiming completion.
