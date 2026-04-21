# Map App Harness Strategy

## Purpose
This document explains the two missions this repo must support without mixing them together:

1. build Map App Harness as an original multi-tenant product
2. migrate customer organizations from legacy systems onto that product safely

The platform is the product. Customer migrations validate the platform, but they do not define it.

## Product vs Customer Migration

### Platform mission
Map App Harness is a field-sales and brand-ambassador operations harness.

It provides:
- a unified account runtime
- geospatial territory planning
- activities and operational state
- connector-driven CRM, orders, and calendar ingest
- a control plane for credentials, mappings, sync health, and onboarding
- a CLI surface that agents and humans can operate without relying on browser-only workflows

### Customer migration mission
Each customer migration is a separate operational project.

Customer migration artifacts must live under `docs/tenants/<org>/` and describe:
- what system the customer is leaving
- what data sources they use today
- how field mappings work for that customer
- how cutover, validation, and rollback work for that customer

The core platform docs should never absorb customer-specific behavior.

## Strategic Rule
If a customer requirement cannot be expressed through:
- tenant configuration
- field mappings
- connector installation state
- custom fields
- documented platform contracts

then the problem is probably in the platform design, not in the customer.

## What the platform must optimize for
- local-first runtime reads
- deterministic external identity matching
- cheap and auditable sync semantics
- organization-scoped credentials and configuration
- control plane and runtime plane separation
- CLI-first operability for human operators and coding agents
- shared multi-tenant by default with a dedicated-tenant escape hatch later

## What customer migrations must optimize for
- measurable improvement over the legacy system
- safe shadow-mode and validation before cutover
- documented rollback criteria
- truthful mapping from legacy facts to platform facts
- no hidden dependencies on chat history or outside memory

## Platform Validation Standard
The platform is proven when:
- a customer can be onboarded through configuration and documented connector setup
- a customer migration can be executed from the repo docs and commands
- a fresh coding agent can continue work from repo state alone

## Scope Discipline
The platform should start with the smallest strong set of primitives that are already justified:
- organizations and memberships
- accounts
- contacts
- activities
- orders and aggregates
- territories and markers
- external identities
- sync jobs and cursors
- audit events
- custom fields and field mappings
- connector installations and secrets

Do not invent speculative core primitives until a second customer forces the abstraction.
