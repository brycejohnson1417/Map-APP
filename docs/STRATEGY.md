# Strategy

## The point of this repo

This repo exists to build a multi-tenant business-operations harness that can serve many vertical workspaces from one product foundation.

The immediate product is not a generic no-code builder. It is a set of strong, opinionated tenant workspaces that solve painful operational jobs now while extracting reusable platform primitives underneath.

## The governing test

Every material architecture and product decision should be judged against this question:

> Does this make tenant #10 more likely to onboard, configure, and keep moving without founder involvement?

This is the discipline that matters most.

It means:

- current tenants still need to ship fast
- tenant-specific shortcuts are acceptable only when they leave behind a cleaner extraction path
- abstractions are justified when they reduce future founder dependence, not when they merely sound elegant

## External story vs internal architecture

Externally, tenants buy a vertical workspace:

- cannabis wholesale territory ops
- fraternity sales and lead scoring
- future vertical operational workspaces

Internally, the platform is being designed as a harness that can compose those workspaces from:

- canonical entities
- reusable primitives
- installable packages
- tenant workspace definitions
- compiled read models
- a governed change system

Do not confuse the internal architecture with the customer-facing story.

## What we are optimizing for

### Product outcomes
- a tenant can sign in and reach a useful workspace quickly
- a tenant can bring its own systems through adapters
- a tenant can request meaningful changes without waiting on bespoke founder work every time
- the platform can widen to new verticals without code forks

### Engineering outcomes
- one strong canonical runtime model
- local-first reads with small, purpose-built payloads
- tenant behavior expressed through config, packages, and read-model compilation
- clear platform-vs-tenant boundaries in code and docs
- enough documentation that a fresh human or AI can continue from repo state alone

## Product rules

1. The platform is the product. PICC and FraterniTees are tenants.
2. A tenant request should become one of:
   - workspace config
   - package behavior
   - a new primitive proposal
   - a core-platform change
3. Tenant-specific logic should not accumulate indefinitely in shared components.
4. AI should primarily translate intent into config/package changes and primitive proposals, not generate ad hoc tenant production code.
5. Every tenant workspace should move toward a portable, text-native definition.
6. The platform should ship dense, useful vertical value before chasing abstract generality.

## What current tenants have already taught us

### PICC
- map/account/runtime parity matters
- local order-derived workflows matter
- tenant-specific documents and pricing logic exist and need package boundaries

### FraterniTees
- the same shell can support a different vertical if the data model is generic enough
- scoring, filters, DNC rules, and trend logic should become reusable primitives
- connector ingestion and account runtime can stay shared while tenant behavior diverges

These are not edge cases. They are the first proof that the product must extract behavior out of shared code.

## Current strategic gap

The repo already has working multi-tenant product value. The main gap is not "do more features." The main gap is:

- document the platform truth clearly
- define the primitive and workspace model explicitly
- keep shipping tenant value while converting tenant-specific behavior into reusable platform structure

## Non-goals for the current stage

- building a generic no-code app builder
- letting AI freely edit production tenant code
- replacing every third-party service with custom infrastructure
- over-optimizing for enterprise isolation before the workspace/package model is real

## Success condition

This repo is on the right path when:

- tenant #3 adds less shared-code branching than tenant #2 did
- tenant-specific changes increasingly land as config/package changes
- new engineers or agents can explain the architecture from the docs alone
- onboarding becomes more template/package driven and less founder-driven
