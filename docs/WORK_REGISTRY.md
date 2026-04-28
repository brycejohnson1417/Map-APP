# Work Registry

## Purpose

[WORK_REGISTRY.json](WORK_REGISTRY.json) is the machine-readable execution queue for autonomous Codex CLI work.

[ROADMAP.md](ROADMAP.md) is the phase view. [TODO.md](TODO.md) is the human backlog view. The registry is the source for what an autonomous agent should execute next.

## Authority Order

When docs conflict, use this order:

1. [AGENTS.md](../AGENTS.md)
2. [AUTONOMOUS_PRODUCT_BUILD.md](AUTONOMOUS_PRODUCT_BUILD.md)
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

Proposal docs are not executable unless a registry item says they are `ready` or they are the smallest necessary foundation for a current ready item.

## Registry Fields

Every work item must define:

| Field | Required meaning |
|---|---|
| `id` | Stable unique identifier used in docs, run reports, and dependency lists. |
| `title` | Human-readable work name. |
| `status` | One of `planned`, `ready`, `in_progress`, `blocked`, or `done`. |
| `phase` | Roadmap phase or execution lane. |
| `priority` | One of `P0`, `P1`, `P2`, `P3`, or `future`. |
| `type` | Work kind such as `foundation`, `database`, `api`, `ui-workflow`, `testing`, or `future-product`. |
| `dependencies` | Work item IDs that must be done first. |
| `blocking_foundation` | Foundation items that must be built before the item can be implemented correctly. |
| `description` | Direct product or architecture requirement. |
| `acceptance_criteria` | Observable completion checks. |
| `verification_commands` | Commands or checks that prove the item. |
| `docs_to_update` | Docs that must be reviewed and updated when the item changes behavior. |
| `stop_conditions` | Conditions that require review before continuing. |
| `safe_defaults` | Decisions Codex should make to keep moving without unsafe assumptions. |

## Execution Algorithm

An autonomous implementation session should:

1. Read the authority docs.
2. Parse [WORK_REGISTRY.json](WORK_REGISTRY.json).
3. Skip `done` items.
4. Stop on `blocked` items only when they are required by the current ready item.
5. Execute `ready` items in priority order.
6. Before each item, check dependencies and stop conditions.
7. If a planned item's dependencies become `done`, promote it to `ready` and continue.
8. If current work would otherwise require hardcoded tenant behavior, duplicated provider logic, unsafe tenant data handling, or brittle UI state, promote the smallest useful documented foundation item first.
9. Update code, docs, tests, registry status, and run report.
10. Continue until no `ready` or newly unblocked item remains, or an allowed stop condition applies.

## Future Proposal Boundary

Future plans belong in the registry as `planned` with `priority: future` until they become executable.

Codex may promote future work only when all are true:

- the current approved work would be worse without it
- the promoted slice is the smallest useful foundation
- the slice is reversible or additive
- existing FraterniTees and PICC behavior can be preserved
- the reason is recorded in the run report

Broad package manager migrations, repository topology migrations, schema-topology migrations, spinout tooling, and generator systems require a separate approved plan unless they are explicitly marked `ready`.

## Validation

Run:

```bash
npm run check:work-registry
```

The check validates JSON parseability, unique IDs, allowed status/priority values, dependency references, non-empty acceptance criteria, non-empty verification commands, non-empty docs update lists, stop conditions, and safe defaults.

`npm run verify` includes this check.

## Current Queue State

The current Screenprinting foundation run completed all non-future registry items through `SCALE-001`.

Remaining planned/future items are intentionally not promoted by this run:

- `FUTURE-001` Catalog adapter foundation
- `FUTURE-002` Profitability and cost reporting
- `FUTURE-003` Screenprinting art workflow module
- `FUTURE-004` Screenprinting warehouse workflow module
- `FUTURE-005` Future stack extraction proposal

Those items still require separate approval or a future registry promotion.
