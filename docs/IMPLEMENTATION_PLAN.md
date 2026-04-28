# Implementation Plan

## Planning rule

This plan is not time-boxed by month count. It is outcome-driven.

The target is to architect for scale and self-serve onboarding while still shipping meaningful value quickly for current tenants.

Executable work is tracked in [WORK_REGISTRY.json](WORK_REGISTRY.json). This file explains implementation strategy; the registry controls autonomous execution order, dependencies, stop conditions, safe defaults, docs to update, and verification commands.

Every slice should satisfy both:

- it improves life for a current tenant now
- it leaves the platform more reusable for tenant #10 later

## Track A: Current tenant delivery

This track exists so the platform does not become an abstract architecture project.

### Immediate expectations
- keep PICC operational and advancing
- keep FraterniTees operational and advancing
- ship tenant improvements when the business case is clear
- implement those improvements so they leave behind cleaner runtime, package, or config boundaries

### Acceptance criteria
- current tenants can actively use the product
- requested features land without uncontrolled shared-code sprawl
- each tenant slice produces either a documented primitive candidate, package extraction, or reusable runtime contract

## Track B: Platform extraction

This track turns tenant-specific behavior into durable platform structure.

### Slice 1 — Document the platform truth
Status: landed and now maintenance-required

Scope:
- repo-level philosophy and product direction
- current-state documentation
- primitive catalog v1
- workspace/package model v1
- updated roadmap and backlog

Acceptance:
- a fresh engineer or AI can explain what the platform is, what exists, and what comes next from the repo alone
- autonomous execution docs, definition of done, and work registry exist

### Slice 2 — Freeze the core contracts
Status: active

Scope:
- canonical entity definitions
- adapter contract boundaries
- package manifest definition
- workspace definition contract
- read-model output contracts for territory/accounts/detail

Acceptance:
- new tenant work can reference stable platform contracts instead of implicit repo conventions

### Slice 3 — Extract tenant behavior
Status: active

Scope:
- move current tenant scoring/filter/module behavior toward config/package boundaries
- move repeated industry behavior into tenant type defaults before it becomes tenant-specific branching
- reduce shared component branching
- standardize registry-style filter/sort/module definitions

Acceptance:
- FraterniTees and PICC behavior become more declarative and less bespoke
- a second screenprinter can start from Screenprinting tenant type docs/config instead of a FraterniTees fork

### Slice 4 — Read-model compilation
Status: planned

Scope:
- compile tenant-facing summaries from canonical data and workspace config
- formalize score outputs, trend outputs, filter facets, and document inputs

Acceptance:
- tenant behavior changes affect compiled outputs more than shared React branching

### Slice 5 — Self-serve onboarding
Status: landed v1, needs expansion

Scope:
- tenant type selection or matching
- adapter install flow
- connection tests
- initial sync bootstrap
- generated first workspace
- tenant-specific override preview for statuses, tags, fields, dashboards, and feature flags

Acceptance:
- a new tenant can reach a useful workspace without code changes

### Slice 6 — Change system
Status: landed v1, needs policy/preview layer

Scope:
- in-app request capture
- structured request schema
- config/package/core classification
- preview and policy checks
- maintainer queue

Acceptance:
- safe tenant requests can be handled without bespoke founder implementation

### Slice 7 — Package and tenant type distribution
Status: planned

Scope:
- package registry
- tenant type export/import
- versioning and upgrades
- forkable workspace definitions

Acceptance:
- one tenant's solved shape can become a tenant type default or another tenant's starting point

## Verification standard

Every implementation slice should include:

- updated docs
- local verification
- explicit statement of what became more reusable

Baseline verification:

```bash
npm run check:work-registry
npm run lint
npm run typecheck
npm run build
npm run verify
```

When browser-facing changes land, add runtime or Playwright checks as appropriate.

## Definition of progress

Progress is not "more code."

Progress is:

- more tenant value shipped
- fewer hidden assumptions
- more behavior expressed through shared contracts
- a clearer path for tenant #10 to onboard without you
