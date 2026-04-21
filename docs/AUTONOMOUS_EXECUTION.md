# Autonomous Execution Protocol

## Purpose
This repo should be operable by a strong coding agent for long-running work, not just by a human developer opening files manually.

The goal is not blind automation. The goal is disciplined autonomous execution:
- clear specs
- visible backlog
- cheap verification loops
- fresh-context review
- durable handoff artifacts

## Core Rules
1. Every meaningful slice starts from the docs, not from memory.
2. Every meaningful slice updates the running to-do list.
3. Every meaningful slice has a direct verification path.
4. Every meaningful slice gets reviewed from a fresh context before being considered complete.
5. If the verification loop is broken, fix the loop before piling on more features.

## Required Artifacts
An agent should be able to orient itself from these files alone:
- [README.md](../README.md)
- [docs/STRATEGY.md](STRATEGY.md)
- [docs/PLATFORM_SPEC.md](PLATFORM_SPEC.md)
- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [docs/TODO.md](TODO.md)
- [docs/VERIFICATION_STRATEGY.md](VERIFICATION_STRATEGY.md)
- [docs/SETUP.md](SETUP.md)

If one of these is stale, the agent should update it before pushing the next meaningful slice.

## Default Agent Loop
For a normal work item:

1. Read the spec and architecture.
2. Read the current todo list and choose the next highest-leverage item.
3. Update the plan if the scope changed.
4. Implement the smallest meaningful slice.
5. Run the repo verification loop.
6. Run `npm run review:adversarial` or `npm run verify:full` to invoke a fresh Codex review context.
7. Fix the gaps or document why they remain.
8. Update the todo list and handoff docs.
9. For tenant migration work, run the tenant playbook and record gaps in the tenant migration log.

## Long-Running Queue Discipline
The repo should support a queue of autonomous work without losing clarity.

Work should be organized as:
- `current focus`
- `next slices`
- `blocked`
- `debt to retire`

Tasks should be written as small, inspectable units with clear completion criteria.

Bad queue item:
- "finish sync system"

Good queue item:
- "add Notion webhook ingestion route with signature verification and durable sync-event persistence"

## Sub-Agent Use
Fresh-context review is required for architecture-heavy or risk-heavy slices.

Use a sub-agent when:
- the spec changed materially
- the architecture changed materially
- the verification approach changed
- tenant isolation, sync correctness, or identity matching changed

The reviewer should challenge:
- hidden tenant-specific assumptions
- unclear tenant boundaries
- weak verification
- unscoped connector logic
- premature UI coupling
- missing operational visibility

## Verification Expectations for Agents
The agent should prefer the cheapest loop that proves the changed behavior.

Minimum baseline:
- `npm run verify`
- `npm run mapapp -- health check <org>`

When a local server is available:
- `SMOKE_BASE_URL=http://localhost:3000 npm run verify`

When sync logic changes:
- add or update deterministic tests or replay fixtures

When UI flows change:
- add or update browser verification

## Definition of Autonomous Readiness
A work slice is autonomously ready when:
1. the next agent can understand it from repo docs,
2. the verification commands are obvious,
3. the backlog clearly shows what is next,
4. a fresh reviewer can identify gaps without extra human explanation.

## What to Avoid
- undocumented architectural decisions
- giant multi-week tasks with no intermediate acceptance criteria
- relying on chat history instead of repo state
- claiming “done” without verification artifacts
- leaving the todo list stale after implementation
