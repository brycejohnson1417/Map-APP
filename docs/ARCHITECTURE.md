# Map App Architecture

## Product Thesis
Map App is a multi-tenant revenue operations platform for field sales teams. PICC is tenant zero, not the product itself. The system must support additional companies bringing their own CRM, order, calendar, and directory providers without changing the domain model.

## Core Runtime Decisions
- `Supabase Postgres` is the operational source of truth.
- `Clerk` remains the authentication layer.
- `Google Maps Platform` is the rendering, geocoding, and routing provider.
- `Notion`, `Nabis`, and future systems are external integrations, not runtime databases.
- User-facing reads come from local Postgres tables and read models only.

## Non-Negotiable Rules
1. No sync-on-read for normal UI surfaces.
2. Every business row is scoped by `organization_id`.
3. Connector configuration is tenant-scoped and encrypted.
4. Matching is deterministic first, queued for review when ambiguous.
5. The map, accounts, calendar, and activity all read the same account system.
6. Customer-specific fields are mapped into a generic runtime model instead of hardcoded throughout the app.

## Tenant Model
The platform starts shared multi-tenant by default and reserves an escape hatch for later single-tenant isolation.

### Shared Multi-Tenant Default
- one codebase
- one Supabase project
- one shared Postgres cluster
- strict `organization_id` scoping
- Row Level Security on exposed tables
- tenant-scoped integration credentials and sync state

### Single-Tenant Escape Hatch
Some customers will later need:
- dedicated database
- dedicated project
- dedicated region
- stricter isolation for compliance, procurement, or performance

The application domain should not care whether a tenant is hosted in a shared or dedicated environment. That is an infrastructure concern, not a domain concern.

## Layered Architecture

### `domain/`
Business concepts and invariants.
- accounts
- contacts
- orders
- activities
- territories
- calendar events
- external identities
- sync state

### `application/`
Use-cases and orchestration.
- account reconciliation
- territory boundary updates
- marker management
- sync job scheduling
- calendar aggregation
- outbound CRM updates

### `infrastructure/`
Database, queue, and provider adapters.
- Supabase repositories
- Notion adapter
- Nabis adapter
- Google Maps adapter
- Google Calendar adapter
- encryption and secret storage

### `presentation/`
Interfaces over the same use-cases.
- Next.js route handlers
- server components
- client components
- CLI commands
- webhooks

## Canonical Entity Model

### Core entities
- `organization`
- `organization_member`
- `account`
- `account_identity`
- `contact`
- `activity`
- `territory_boundary`
- `territory_marker`
- `calendar_event`
- `sync_cursor`
- `sync_job`
- `audit_event`

### Generic external identity model
Every provider-specific object link is stored explicitly.
- provider
- external type
- external id
- internal entity id
- match method
- confidence
- metadata

## Connector Architecture
Each external system plugs into a connector contract, not the core domain.

### Contracts
- `crm_adapter`
- `orders_adapter`
- `calendar_adapter`
- `directory_adapter`
- `maps_adapter`

### Connector responsibilities
- credential handling
- incremental sync
- field mapping
- retries and backoff
- sync health reporting
- outbound updates when supported

### Connector configuration
Tenant connector credentials and config live in encrypted storage and are always keyed by `organization_id`.

## Data Flow

### Notion-first updates
- Notion webhook receives change
- write dirty record / enqueue sync work
- worker fetches only changed page ids
- normalized account rows update
- read models refresh
- UI revalidates local data

Target freshness is seconds to a few minutes, with a scheduled incremental fallback every 1-2 minutes if webhook delivery fails.

### Order data
- provider ingest lands raw data
- normalization produces stable retailer/order records
- local aggregates compute `last_order_date`, `last_sample_order_date`, customer flags, and related analytics
- CRM sync writes display fields outward when needed

## Read Models
The UI never uses one giant catch-all endpoint.

- `territory_pin_view`: tiny map payload only
- `account_detail_view`: richer detail payload
- `calendar_event_view`: merged local event feed
- `territory_boundary_view`: collaborative layers
- `territory_marker_view`: rep homes and shared markers
- `account_filter_facet_view`: filter counts and facet values

## Performance Rules
- small map payloads
- separate detail payloads
- webhook/event-driven invalidation before polling
- no broad refetches on every screen
- background sync into local tables, not external reads in user flows
- use PostGIS for spatial intelligence and Google APIs for UX-quality maps/routes

## BYO APIs
The platform should support customers bringing their own providers.

Examples:
- CRM: Notion, HubSpot, Salesforce, Airtable
- Orders: Nabis, LeafLink, Dutchie, CSV/SFTP import
- Calendar: Google Calendar, Microsoft 365

This is achieved through adapters plus tenant field mappings, not forks of the application.

## Observability
Operational visibility matters as much as the feature surface.

- structured logs with correlation ids
- per-tenant sync metrics
- payload size and latency tracking on hot endpoints
- connector error rates
- dead-letter queues for failed sync jobs
- audit history for every important mutation

## Security
- Row Level Security on exposed tenant tables
- encrypted tenant connector secrets
- no provider secrets in browser-exposed configuration
- explicit admin/member/guest roles per organization
- complete mutation audit trail

## Product Strategy
PICC remains the first real tenant and the fastest proving ground. The product architecture, schema, and adapters should be generic enough that a second company can onboard without code forks.
