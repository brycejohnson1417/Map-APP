# ADR 0007: CLI-first product harness

## Status
Accepted

## Decision
Treat the CLI as a first-class product surface alongside the web app. The same application services should power both, so agentic engineers and automation tooling can bootstrap tenants, install connectors, queue sync jobs, inspect health, and verify deployments without depending on browser-only flows.

## Rationale
This product is intended to support human operators and automated/agentic workflows. A CLI-first harness makes the system easier to automate, easier to verify, and easier to extend without coupling operational tasks to a web dashboard.

## Consequences
- service-layer design matters more than UI-only abstractions
- connector operations should be invocable from the CLI
- verification loops should be scriptable and usable by agents
- the web app remains important, but it is not the only control surface
