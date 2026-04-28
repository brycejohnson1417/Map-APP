# ADR 0007: CLI-first product harness

## Status
Accepted

## Context
Migration, sync, health checks, verification, and tenant setup need repeatable operations that can run outside the browser.

## Decision
Treat the CLI as a first-class product surface alongside the web app. The same application services should power both, so agentic engineers and automation tooling can bootstrap tenants, install connectors, queue sync jobs, inspect health, and verify deployments without depending on browser-only flows.

## Rationale
This product is intended to support human operators and automated/agentic workflows. A CLI-first harness makes the system easier to automate, easier to verify, and easier to extend without coupling operational tasks to a web dashboard.

## Consequences
- service-layer design matters more than UI-only abstractions
- connector operations should be invocable from the CLI
- verification loops should be scriptable and usable by agents
- the web app remains important, but it is not the only control surface

## Alternatives considered
- Browser-only operations: rejected because automation and recovery workflows need scripts.
- Separate CLI logic that bypasses application services: rejected because it creates divergent behavior.
- Manual operator checklists only: rejected because sync and migration correctness needs repeatable evidence.

## Follow-up checks
- CLI commands should call shared application services where feasible.
- Verification scripts should cover docs, tenant isolation, build, and runtime smoke paths.
- CLI actions that mutate tenant data must require explicit org slug and safe defaults.
