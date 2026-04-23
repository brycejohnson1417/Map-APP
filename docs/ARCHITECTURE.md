# Architecture

## Architectural thesis

Map App Harness should behave like a multi-tenant operational runtime on the inside and a set of opinionated vertical workspaces on the outside.

The platform must support:

- fast shipping for current tenants
- clean extraction of tenant behavior into primitives, packages, and workspace definitions
- a future change system that can safely adapt a tenant without rewriting the shared app

## Four-plane model

The target architecture is easiest to reason about in four planes.

### 1. Control plane
Owns:
- organizations and memberships
- provider credentials and installs
- package installs and versions
- feature/plugin settings
- change requests
- policy decisions
- audit and release history

### 2. Data plane
Owns:
- canonical tenant data
- external identities
- sync cursors and sync jobs
- raw source payload preservation
- normalized aggregates

### 3. Runtime plane
Owns:
- map/list/detail shell
- dashboards
- account surfaces
- tenant-visible workflows
- read models and runtime payloads

### 4. Execution plane
Owns:
- connector sync work
- geocoding
- preview generation
- read-model refresh
- future request translation and change application workers

The current repo can keep these in one codebase and one deployment. The separation is architectural, not necessarily deployment-level yet.

## Core architectural layers

### Canonical entity layer
This is the most durable layer in the product.

Core concepts:
- organization
- organization_member
- account
- account_identity
- contact
- order_record
- activity
- territory_boundary
- territory_marker
- sync_job
- sync_cursor
- audit_event

Tenant differences should not redefine these. They should map into them.

### Primitive layer
Primitives are reusable units of business behavior that can be installed or configured without tenant forks.

Examples already emerging in the repo:
- lead scoring
- DNC rules
- map pins and map filters
- account detail sections
- order-derived summary cards
- PDF generators
- sync connectors

### Package layer
Packages are reusable bundles of tenant behavior assembled from primitives and configuration.

Examples the repo is moving toward:
- territory map kit
- lead scoring kit
- FraterniTees sales kit
- PICC pricing/proposal kit

### Workspace definition layer
Each tenant should move toward a portable, text-native workspace definition that declares:
- installed packages
- enabled modules
- scoring models
- filter registries
- sync mappings
- document templates

### Read-model/compiler layer
Canonical data should stay stable. Tenant runtime behavior should increasingly compile into:
- small list payloads
- pin payloads
- detail payloads
- score summaries
- trend summaries
- document inputs

### Change system
Tenant requests should eventually route through a governed system that produces:
- config changes
- package changes
- primitive proposals
- core-platform queue items

## Current repo truth

The repo already has shared runtime and tenant-specific surfaces, but it is not fully extracted yet.

Current strengths:
- shared runtime APIs for territory, accounts, sync, and geocoding
- working tenant-specific flows for PICC and FraterniTees
- runtime data mapped into shared types
- tenant-scoped settings and connector state

Current weakness:
- some tenant behavior still lives directly in shared UI/service code instead of package/config boundaries

That is the main extraction work now.

## Read-model rule

User-facing surfaces should read purpose-built payloads, not giant catch-all joins or live provider data.

Current examples:
- `territory` dashboard payload
- `account` detail payload

Next direction:
- extract tenant-specific scoring/trend outputs into stable runtime shapes
- reduce ad hoc interpretation of `custom_fields`
- move toward clearer compiled summaries per tenant surface

## Tenant boundary rules

1. Keep the core domain generic.
2. Keep provider-specific assumptions in adapters or mapping layers.
3. Keep tenant-specific business behavior moving toward package/config space.
4. If a second tenant needs a behavior, it is probably a primitive candidate.
5. If a tenant request can only be solved with more shared branching, stop and reconsider the model.

## AI boundary rules

AI is useful in this system, but it should be constrained.

Use AI for:
- request translation
- spec drafting
- config/package generation
- primitive proposals
- maintainer-reviewed core work

Do not make unrestricted tenant-specific production code generation the primary customization mechanism.

## Topology stance

Today:
- shared multi-tenant runtime
- one codebase
- one shared database project

Future:
- dedicated tenant infrastructure remains an escape hatch

But the more immediate concern is not database topology. It is making tenant behavior portable and governable.
