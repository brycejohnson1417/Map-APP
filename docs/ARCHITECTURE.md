# Architecture

For vocabulary, read [GLOSSARY.md](GLOSSARY.md). For executable autonomous work, read [WORK_REGISTRY.md](WORK_REGISTRY.md) and [WORK_REGISTRY.json](WORK_REGISTRY.json). For table-level schema, read [DATA_MODEL.md](DATA_MODEL.md). For route payloads, read [API_CONTRACTS.md](API_CONTRACTS.md).

## Architectural thesis

Map App Harness should behave like a multi-tenant operational runtime on the inside and a set of opinionated vertical workspaces on the outside.

The platform must support:

- fast shipping for current tenants
- clean extraction of tenant behavior into primitives, packages, and workspace definitions
- a future change system that can safely adapt a tenant without rewriting the shared app

The current near-term foundation is [ARCHITECTURE_RUNWAY.md](ARCHITECTURE_RUNWAY.md). That runway adopts the configuration, adapter, feature-flag, audit, boundary-check, and agent-discipline pieces needed before the Screenprinting Sales/Social build, without forcing a full monorepo or schema topology rewrite.

The autonomous execution contract is [AUTONOMOUS_PRODUCT_BUILD.md](AUTONOMOUS_PRODUCT_BUILD.md). The completion contract is [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md). The work queue is [WORK_REGISTRY.json](WORK_REGISTRY.json).

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

The canonical table and view contracts live in [DATA_MODEL.md](DATA_MODEL.md). Do not infer schema from concept names alone.

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

### Tenant type layer
Tenant types are industry-level defaults above individual tenant workspaces.

Examples:
- `Screenprinting` for FraterniTees and similar Printavo/social screenprinting businesses
- `Cannabis Wholesale` for PICC and similar wholesale territory businesses

The tenant type layer owns universal docs and default configuration surfaces for an industry:
- standard adapters
- standard modules
- required admin settings
- dirty-data expectations
- safe default workflows
- security boundaries that every tenant of the type inherits

Tenant type docs live under `docs/tenant-types/<type>/`. Tenant-specific docs live under `docs/tenants/<tenant>/`.

### Workspace definition layer
Each tenant should move toward a portable, text-native workspace definition that declares:
- tenant type
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
- generic tenant-session routing for shared runtime APIs
- workspace-driven route defaults, account-detail labels, territory color/filter behavior, and geocoding policy
- explicit tenant type manifests for Screenprinting and Cannabis Wholesale
- tenant type documentation boundaries between universal industry behavior and tenant-specific rollout decisions

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
4. Keep industry-wide behavior in tenant type docs/config, not in one tenant's docs.
5. If a second tenant of the same type needs a behavior, it is probably a tenant type default or primitive candidate.
6. If a tenant request can only be solved with more shared branching, stop and reconsider the model.
7. Shared auth/session code should not know tenant-specific cookie names or tenant-specific default routes.

## Tenant isolation rules

Tenant type reuse must not weaken isolation.

- runtime rows stay scoped by `organization_id`
- provider credentials are tenant-scoped credentials
- dashboards, alerts, identity links, and manual imports read/write only the active organization
- a shared tenant type default must never create a shared data path between tenants
- public social account metadata may be watched by multiple tenants, but tenant-specific category, priority, alerts, notes, customer links, and campaign links remain scoped

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

## Future package direction

The platform may later move toward physical package boundaries for core, adapters, tenant types, and tools. That direction is tracked in [proposals/FUTURE_STACK_PROPOSAL.md](proposals/FUTURE_STACK_PROPOSAL.md).

Do not treat the future stack proposal as the current implementation contract. The current contract is:

- one codebase
- shared Supabase runtime
- tenant isolation through `organization_id`
- tenant type manifests and docs
- adapter boundaries where provider behavior is being extracted
- configuration schema foundation before large Screenprinting product work
