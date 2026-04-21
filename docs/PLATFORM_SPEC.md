# Map App Harness Platform Spec

## Product Positioning
Map App Harness is intended to become a multi-tenant field operations platform that combines:
- CRM-linked account intelligence
- geospatial territory planning
- order and activity context
- field team collaboration
- calendar and operational workflows
- pluggable integrations for customer-specific systems

## Product Thesis
Most field teams work across disconnected systems: a CRM, an order platform, a calendar, spreadsheets, notes, and a map. The runtime truth is fragmented, slow, and frequently inconsistent.

Map App Harness exists to provide one operational surface where:
- the account system is canonical,
- the map is first-class instead of bolted on,
- external systems sync into a local runtime,
- collaboration is fast and shared,
- tenants can bring their own systems without breaking the core product.

## Product Outcomes

### Near-term
- Make Notion-first changes propagate into the app within seconds to a few minutes.
- Make territory collaboration, map filtering, and account truth consistent.

### Medium-term
- Support additional tenants with their own CRM, order, and calendar providers.
- Provide admin-level integration setup, field mapping, and sync visibility.
- Support sandbox/demo tenants and clean onboarding.

### Long-term
- Become a reusable product platform for field sales and revenue operations teams.
- Support enterprise isolation needs such as dedicated database, region, or deployment.
- Support an internal or external connector/plugin ecosystem.
- Become the operational harness that sales teams and brand ambassadors use across map, CRM, orders, calendar, and field workflows.

## Non-Negotiable Requirements
1. `Supabase Postgres` is the runtime source of truth for user-facing reads.
2. `organization_id` scopes every business row and every permission boundary.
3. RLS protects all exposed tenant data.
4. External systems sync into normalized local models. User-facing screens do not depend on live provider reads.
5. `Google Maps Platform` is the platform mapping, routing, and geocoding stack.
6. Territory layers and shared markers are collaborative organization assets, not user-private artifacts.
7. Matching is deterministic first, reviewable second, heuristic last.
8. Every meaningful mutation is auditable.
9. The platform supports shared multi-tenant by default and dedicated isolation later without changing the domain model.
10. Repo documentation must be sufficient for a new developer or coding agent to continue work without hidden context.

## Target Customers
- field sales teams
- territory-driven account management teams
- operators coordinating vendor days, demos, or customer visits
- companies that already have CRM/order/calendar systems but lack a unified operational runtime

## Primary Personas
- `Org owner/admin`: configures the tenant, integrations, permissions, and operational defaults
- `Manager`: oversees territories, team coverage, account state, and sync health
- `Rep`: works from the map, account views, tasks, and calendar
- `Operator`: coordinates vendor days, follow-ups, and event-driven workflows
- `Tenant developer/admin`: connects external systems and configures field mappings or plugin behavior

## Product Surfaces

### Shared operational surfaces
- Map
- Accounts
- Calendar
- Activities and tasks
- Territory layers
- Markers
- Sync health

### Tenant administration
- integrations
- connector credentials
- field mappings
- role and permission configuration
- feature flags
- branding and workspace defaults

### Developer and platform administration
- connector/plugin diagnostics
- audit and event history
- replay/reconciliation tooling
- deployment and environment health

## Runtime Model
The runtime model is the foundation of the product.

It consists of:
- organizations
- memberships
- accounts
- external identities
- contacts
- activities
- orders and aggregates
- territories
- markers
- sync cursors
- sync jobs
- audit events

Every user-facing surface reads from this runtime. External providers feed this runtime, but they do not replace it.

## Global Schema with Tenant Flexibility
The product should keep a strong global schema for shared concepts:
- organizations
- accounts
- contacts
- activities
- territories
- markers
- events
- orders
- external identities

Tenant flexibility comes from:
- `jsonb custom_fields` on important runtime entities
- tenant-scoped `field_mapping`
- tenant-scoped `integration_installation`
- tenant-scoped connector secrets

That balance matters. The core schema should stay queryable and understandable across all customers, while still letting an individual organization map its own CRM fields, order fields, and calendar semantics into the runtime.

## Control Plane vs Runtime Plane

### Runtime plane
Tenant-scoped data and user-facing operations:
- accounts
- territories
- markers
- events
- activities
- sync jobs
- local read models

### Control plane
Product-level management and tenant configuration:
- tenant lifecycle and onboarding
- connector installation state
- feature flags
- plan entitlements
- deployment topology selection
- observability and support tooling

The product should start with a lightweight control plane in the same codebase if needed, but the architecture should keep it conceptually separate from the tenant runtime.

## Multi-Tenant Strategy

### Default mode
Shared multi-tenant:
- one codebase
- one shared Supabase project
- one shared cluster
- strict `organization_id` scoping
- strong RLS and auditing

### Escape hatch
Some customers will later need:
- dedicated database
- dedicated Supabase project
- dedicated region
- dedicated deployment

The domain model and application layer must not assume one shared environment forever. Infrastructure topology is allowed to change; the business model should not.

## Integration and Plugin Strategy

### Bring-your-own integrations
Customers must be able to connect their own:
- CRM
- order platform
- calendar
- directory/identity source
- internal webhooks and outbound event consumers

Each organization should be able to choose its own source systems for:
- CRM
- ordering
- calendar
- identity/directory
- notifications

### Connector contracts
The core platform talks to contracts, not providers:
- `crm_adapter`
- `orders_adapter`
- `calendar_adapter`
- `directory_adapter`
- `notification_adapter`

### Mapping standard and billing model
Map App Harness does not support pluggable map providers in the core product.

- `Google Maps Platform` is the only supported mapping provider in year one.
- each organization brings its own Google Cloud project and billing
- each organization stores its own browser-safe Maps JavaScript key and encrypted server-side maps key
- the platform never uses one organization's Google Maps quota or billing account for another organization

### Plugin model
The product should evolve toward a connector/plugin platform where a tenant can install:
- first-party adapters
- private customer-specific adapters
- future marketplace adapters

Plugins should be isolated behind stable contracts. Tenant logic can be configured, but plugin code should not leak provider assumptions into the core domain.

## CLI-First and Agent-Friendly Operations
The platform should not assume the web app is the only control surface.

It should support a first-class CLI so agentic engineers and operational tooling can:
- bootstrap organizations
- install or rotate connectors
- map fields
- queue sync jobs
- replay failed sync work
- inspect health
- verify deployments

The web app is the human-facing control surface. The CLI should expose the same application services for automation, background operations, and agentic workflows.

## Connector Responsibilities
- auth and credential handling
- incremental sync
- raw payload preservation
- field mapping
- retry/backoff
- dedupe and idempotency
- outbound updates where supported
- health reporting

## Data Ownership Rules
- local runtime tables are the operational truth for the product
- source payloads are stored for debug/replay
- provider-specific data is normalized into generic internal models
- local computed aggregates win over provider rollups when the product needs fast, reliable filters

## Identity and Matching Rules
- external identities are first-class
- deterministic identifiers are preferred over fuzzy matching
- ambiguous matches go to a reconciliation queue
- one account can have many external identities across providers

This is especially important for order-platform matching and CRM consistency.

## Performance Rules
- no giant catch-all endpoints
- read models per surface
- tiny map pin payloads
- separate detail payloads
- event-driven invalidation before polling
- bounded polling only where justified
- payload size and latency observability on hot routes

## Enterprise Requirements
- audit log on every important mutation
- role-aware access control
- SSO-ready identity model
- tenant-scoped secrets and configuration
- environment isolation path for enterprise customers
- structured logs, traces, and correlation ids
- clear sync health visibility

## Security Requirements
- RLS on all exposed tenant tables
- encrypted connector secrets
- no provider secrets in browser-exposed config
- least-privilege admin/service operations
- explicit mutation auditability
- support for future compliance and data residency requirements

## AI and Automation Expectations
The platform should be agent-friendly from the start.

That means:
- a stable CLI layer should exist alongside the web app
- the same application services should back web, CLI, and automation workflows
- verification loops should be scriptable and repeatable
- docs and specs should live with the code

## What Success Looks Like
The platform is successful when:
1. a second company can onboard without a code fork,
2. a tenant can bring its own APIs using stable connector contracts,
3. the map, accounts, calendar, and activities all operate on one runtime truth,
4. the architecture supports both team-scale efficiency and enterprise isolation later,
5. the repo looks like a serious product foundation, not a brittle internal hack.
