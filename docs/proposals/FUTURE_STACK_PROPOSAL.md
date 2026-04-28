# Future Stack Proposal

## Status

Proposal, not current implementation contract.

This document captures a larger future architecture direction. It should not replace [ARCHITECTURE.md](../ARCHITECTURE.md), [ARCHITECTURE_RUNWAY.md](../ARCHITECTURE_RUNWAY.md), [DATA_MODEL.md](../DATA_MODEL.md), or [API_CONTRACTS.md](../API_CONTRACTS.md).

## Core Idea

The future product may benefit from stronger physical boundaries:

- monorepo workspaces
- core packages
- adapter packages
- tenant type or vertical packages
- package-scoped migrations
- package-scoped tests
- strict import boundaries
- agent work lanes with branch/worktree conventions

The reason to consider this later is that each tenant type should eventually become portable, testable, and extractable without dragging the whole product with it.

## Valuable Ideas To Adopt Now

These are already promoted into [ARCHITECTURE_RUNWAY.md](../ARCHITECTURE_RUNWAY.md):

- configuration schema foundation
- adapter port contracts
- feature flags
- audit/activity hooks
- static boundary checks
- run reports
- lightweight agent concurrency rules

## Future Ideas To Reconsider Later

Do not implement these before Screenprinting Sales/Social unless there is a separate approved migration plan:

- pnpm workspaces and Turborepo migration
- physical `packages/core`, `packages/adapters`, and `packages/verticals` structure
- schema-per-tenant-type or schema-per-vertical database layout
- custom migration runner
- branch-specific Supabase database infrastructure
- spinout drills
- generator-driven package scaffolds
- full hypothetical tenant type test corpus
- CI checks for package-level import/export privacy

## Trigger Conditions For Revisiting

Revisit this proposal when at least two of these are true:

- a second Screenprinting tenant is onboarding
- a third tenant type is being designed
- adapter code is duplicated across multiple providers
- tenant type code is hard to isolate during implementation
- multiple agents are consistently colliding in the same files
- a tenant type needs standalone product packaging or sale-readiness

## Guardrails

- Do not pause Screenprinting product delivery for a speculative platform migration.
- Do not migrate repository structure without proving existing FraterniTees and PICC behavior remains intact.
- Do not use future physical boundaries as an excuse to skip current logical boundaries.
- Keep current docs authoritative until the future stack is actually implemented.
