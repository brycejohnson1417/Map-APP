# Self-contained product requirements

## Purpose

Product requirements in this repo must be complete enough for a new human, AI agent, or Codex CLI session to build the intended product without chat history, memory, screenshots, transcripts, videos, or private context.

## No chat dependency

Requirements must describe the product directly. They must not depend on something a user said in a prior conversation.

Every requirement should define:

- the user or tenant type it serves
- the workflow it supports
- the expected UI behavior
- the data it depends on
- the configuration needed
- the security boundary
- the acceptance criteria
- the registry work item when it is planned implementation work
- any known gaps or deferred work

## No external attachment dependency

Requirements must not require a reader to inspect an external screenshot, video, transcript, competitor demo, or attached file to understand what to build.

If an attachment inspired a requirement, convert the observed behavior into explicit product requirements before committing docs.

## No lazy references

Do not write requirement docs that point at missing context.

Bad patterns:

- vague references to prior discussion
- vague references to a demo
- vague references to attached screenshots or video
- unexplained competitor product names
- "build what was shown" style instructions

Good patterns:

- name the actual module or workflow
- list each required screen
- list each required user action
- list each required data object
- list each required integration behavior
- list the safe MVP boundary
- list future-phase capabilities separately

## Tenant type and tenant docs

Tenant type docs must define universal behavior for every tenant of that type.

Tenant-specific docs must define only one tenant's decisions, overrides, rollout notes, credentials, dirty-data exceptions, and acceptance criteria.

If a tenant-specific request reveals a reusable industry pattern, move the reusable pattern into the tenant type docs and keep the tenant-specific decision in the tenant docs.

## Implementation handoff standard

Any implementation handoff must include:

- where to start reading
- which `docs/WORK_REGISTRY.json` item or items are in scope
- what to inspect in the codebase
- what to build
- what not to build
- database expectations
- API expectations
- UI expectations
- security expectations
- verification commands
- documentation update requirements

The handoff should assume the next agent has no memory of the conversation that created it.

## Verification

`npm run check:self-contained-requirements` enforces the baseline documentation contract. If a product requirement needs external context to make sense, the fix is to document the behavior explicitly, not to ask the next agent to infer it.

`npm run check:work-registry` validates the autonomous execution queue. Planned implementation work should be represented there with acceptance criteria, verification commands, docs to update, stop conditions, and safe defaults.
