# Data Model

## Purpose

This file is the canonical database contract for current runtime tables and the next additive Screenprinting data model.

For vocabulary, read [GLOSSARY.md](GLOSSARY.md). API payloads are documented in [API_CONTRACTS.md](API_CONTRACTS.md). Tenant type and tenant workspace JSON contracts are documented in [tenant-types/SCHEMA.md](tenant-types/SCHEMA.md).

## Global Rules

- `organization_id` is the tenant boundary for business data.
- Tenant-facing tables must enable RLS.
- Current committed migrations enable RLS but do not define browser/client policies. Existing runtime code uses trusted server/service-role paths.
- Add direct browser Supabase access only after adding explicit RLS policies and documenting the expected auth claim and membership lookup.
- Provider IDs must be preserved through identity rows, source fields, or `source_payload`.
- Provider data that may be dirty must remain reviewable and remappable. Do not overwrite it destructively.
- Additive migrations are preferred. Breaking schema changes require migration notes and rollback planning.

## Current Enum Types

| Type | Values |
|---|---|
| `public.membership_role` | `owner`, `admin`, `manager`, `member`, `guest` |
| `public.external_provider` | `notion`, `nabis`, `printavo`, `google_sheets`, `google_calendar`, `google_maps`, `hubspot`, `salesforce`, `airtable`, `csv_import` |
| `public.external_entity_type` | `organization`, `account`, `contact`, `order`, `calendar`, `calendar_event`, `territory_boundary`, `territory_marker` |
| `public.sync_status` | `idle`, `queued`, `running`, `success`, `error` |
| `public.sync_job_kind` | `notion_pages`, `notion_comments`, `orders_accounts`, `orders_events`, `calendar_pull`, `calendar_push`, `read_model_refresh`, `reconciliation` |
| `public.audit_event_type` | `sync_started`, `sync_succeeded`, `sync_failed`, `account_created`, `account_updated`, `boundary_created`, `boundary_updated`, `marker_created`, `marker_updated`, `integration_connected`, `integration_updated`, `integration_disconnected` |

## Current Tables

### `public.organization`

Tenant runtime record.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key, default `gen_random_uuid()`. |
| `slug` | `text` | yes | Unique tenant slug. |
| `name` | `text` | yes | Display name. |
| `status` | `text` | yes | Default `active`. |
| `settings` | `jsonb` | yes | Organization-level overrides, plugin settings, automation settings, workspace overrides. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: primary key on `id`; unique `slug`.

RLS: enabled. Current access path is trusted server-side code.

### `public.organization_member`

Tenant user membership.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `clerk_user_id` | `text` | yes | External auth user id or tenant-session synthetic id. |
| `email` | `text` | yes | Member email. |
| `full_name` | `text` | no | Optional display name. |
| `role` | `membership_role` | yes | Owner/admin/manager/member/guest. |
| `settings` | `jsonb` | yes | Member preferences. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(organization_id, clerk_user_id)`; unique `(organization_id, email)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.integration_installation`

Tenant connector installation metadata.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `provider` | `external_provider` | yes | Connector provider. |
| `external_account_id` | `text` | no | Provider account identifier when safe to store. |
| `display_name` | `text` | yes | Tenant-visible connector label. |
| `config` | `jsonb` | yes | Non-secret config and browser-safe values. |
| `status` | `text` | yes | Default `active`. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(organization_id, provider, display_name)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.integration_secret`

Encrypted tenant connector secrets. This table exists in `public` in the latest migration path.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `installation_id` | `uuid` | yes | FK to `integration_installation(id)` with cascade delete. |
| `key_name` | `text` | yes | Secret name within the install. |
| `ciphertext` | `text` | yes | Encrypted value. |
| `metadata` | `jsonb` | yes | Rotation and secret metadata. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(installation_id, key_name)`.

RLS: enabled. No client policies are defined; server service-role code is the supported access path.

### `app_private.integration_secret`

Earlier private-schema secret table with the same column contract as `public.integration_secret`.

Required implementation note: when editing secret resolution, inspect current repository code before choosing one table. The product target is tenant-scoped encrypted installation secrets; a cleanup migration can consolidate duplicate secret storage only after confirming deployed database state.

### `public.field_mapping`

Current per-tenant external-to-internal field mapping table. This is the predecessor/foundation for the broader `mapping_rule` primitive.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `installation_id` | `uuid` | no | FK to `integration_installation(id)` with cascade delete. |
| `provider` | `external_provider` | yes | Source provider. |
| `external_entity_type` | `external_entity_type` | yes | Source entity kind. |
| `external_field_key` | `text` | yes | Provider field key. |
| `internal_field_key` | `text` | yes | Internal destination key. |
| `transform` | `jsonb` | yes | Mapping transform config. |
| `is_required` | `boolean` | yes | Default `false`. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(organization_id, provider, external_entity_type, external_field_key, internal_field_key)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.account`

Canonical tenant account/customer/location record.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `name` | `text` | yes | Canonical account name. |
| `legal_name` | `text` | no | Legal name. |
| `display_name` | `text` | no | Tenant-facing display override. |
| `account_status` | `text` | no | Normalized account status. |
| `lead_status` | `text` | no | Lead status. |
| `referral_source` | `text` | no | Source/category signal. |
| `vendor_day_status` | `text` | no | Tenant-specific operational status currently used by PICC. |
| `licensed_location_id` | `text` | no | External/location id. |
| `license_number` | `text` | no | License/reference number. |
| `address_line_1` | `text` | no | Street. |
| `address_line_2` | `text` | no | Unit/suite. |
| `city` | `text` | no | City. |
| `state` | `text` | no | State. |
| `postal_code` | `text` | no | Postal code. |
| `country` | `text` | no | Default `US`. |
| `latitude` | `double precision` | no | Geocoded latitude. |
| `longitude` | `double precision` | no | Geocoded longitude. |
| `location` | `geography(point,4326)` | no | Spatial point. |
| `sales_rep_names` | `text[]` | yes | Default empty array. |
| `account_manager_names` | `text[]` | yes | Default empty array. |
| `last_contacted_at` | `date` | no | Latest account activity date. |
| `last_sample_order_date` | `date` | no | PICC/sample workflow support. |
| `last_sample_delivery_date` | `date` | no | PICC/sample workflow support. |
| `last_order_date` | `date` | no | Latest order date. |
| `customer_since_date` | `date` | no | First known customer date. |
| `crm_updated_at` | `timestamptz` | no | CRM source timestamp. |
| `external_updated_at` | `timestamptz` | no | Provider source timestamp. |
| `custom_fields` | `jsonb` | yes | Tenant-specific attributes and computed fields. |
| `source_payload` | `jsonb` | yes | Source/debug payload. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints:

- unique `(organization_id, licensed_location_id)` where `licensed_location_id is not null`
- full unique `(organization_id, licensed_location_id)` from migration `20260422025134`
- unique `(organization_id, custom_fields ->> 'nabisRetailerId')` when present
- unique `(organization_id, custom_fields ->> 'notionPageId')` when present
- `(organization_id, account_status, lead_status)`
- `(organization_id, vendor_day_status)`
- `(organization_id, latitude, longitude)` where coordinates are present
- `(organization_id, last_contacted_at desc)`
- GiST on `location`
- FraterniTees read-model helper indexes on JSON fields `leadScore`, `closeRate`, and `totalOrders`

RLS: enabled. Current access path is trusted server-side code.

### `public.account_identity`

Non-destructive provider identity link for accounts.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `account_id` | `uuid` | yes | FK to `account(id)` with cascade delete. |
| `provider` | `external_provider` | yes | Provider. |
| `external_entity_type` | `external_entity_type` | yes | Source entity kind. |
| `external_id` | `text` | yes | Source id. |
| `match_method` | `text` | yes | Default `deterministic`. |
| `match_confidence` | `numeric(5,4)` | yes | Default `1.0`. |
| `metadata` | `jsonb` | yes | Evidence, source fields, matching notes. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(organization_id, provider, external_entity_type, external_id)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.contact`

Canonical tenant contact.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `account_id` | `uuid` | no | FK to `account(id)` with cascade delete. |
| `full_name` | `text` | yes | Contact name. |
| `title` | `text` | no | Job title or role label. |
| `email` | `text` | no | Email. |
| `phone` | `text` | no | Phone. |
| `role` | `text` | no | Tenant-defined role. |
| `custom_fields` | `jsonb` | yes | Tenant-specific contact fields. |
| `source_payload` | `jsonb` | yes | Provider/source payload. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints:

- `(organization_id, account_id)`
- unique `(organization_id, account_id, lower(email))` where email is present
- unique `(organization_id, account_id, lower(full_name))` where email is null
- unique `(organization_id, custom_fields ->> 'notionPageId')` when present

RLS: enabled. Current access path is trusted server-side code.

### `public.activity`

Tenant activity/event log.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `account_id` | `uuid` | no | FK to `account(id)` with cascade delete. |
| `contact_id` | `uuid` | no | FK to `contact(id)` with set null. |
| `actor_member_id` | `uuid` | no | FK to `organization_member(id)` with set null. |
| `activity_type` | `text` | yes | Example: check-in, email draft copied, social comment logged. |
| `summary` | `text` | yes | Human-readable summary. |
| `occurred_at` | `timestamptz` | yes | Activity timestamp. |
| `metadata` | `jsonb` | yes | Structured activity payload. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

RLS: enabled. Current access path is trusted server-side code.

### `public.order_record`

Canonical tenant order record from provider order systems.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `account_id` | `uuid` | no | FK to `account(id)` with set null. |
| `provider` | `external_provider` | yes | Default `nabis`; Printavo is supported by enum. |
| `external_order_id` | `text` | yes | Provider order id. |
| `order_number` | `text` | no | Provider order number. |
| `licensed_location_id` | `text` | no | Source location id. |
| `nabis_retailer_id` | `text` | no | Nabis-specific retailer id. |
| `licensed_location_name` | `text` | no | Source customer/location name. |
| `status` | `text` | no | Provider status; tenant mappings decide reporting buckets. |
| `payment_status` | `text` | no | Provider payment state; tenant mappings decide paid/unpaid. |
| `order_total` | `numeric(12,2)` | no | Order total. |
| `order_created_at` | `timestamptz` | no | Source creation timestamp. |
| `delivery_date` | `date` | no | Delivery/production/customer date depending on provider. |
| `sales_rep_name` | `text` | no | Source rep/manager. |
| `is_internal_transfer` | `boolean` | yes | Default `false`. |
| `source_payload` | `jsonb` | yes | Provider/source payload. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints:

- unique `(organization_id, provider, external_order_id)`
- `(organization_id, account_id)`
- `(organization_id, order_created_at desc)`
- `(organization_id, delivery_date desc)`
- `(organization_id, licensed_location_id)`
- `(organization_id, nabis_retailer_id)`

RLS: enabled. Current access path is trusted server-side code.

### `public.territory_boundary`

Tenant map boundary.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `name` | `text` | yes | Boundary name. |
| `description` | `text` | no | Description. |
| `color` | `text` | yes | Default `#ef4444`. |
| `border_width` | `integer` | yes | Default `2`. |
| `is_visible_by_default` | `boolean` | yes | Default `true`. |
| `geometry` | `geometry(multipolygon,4326)` | no | PostGIS geometry. |
| `geojson` | `jsonb` | yes | Source geometry payload. |
| `custom_fields` | `jsonb` | yes | Tenant-specific fields. |
| `created_by_member_id` | `uuid` | no | FK to `organization_member(id)` with set null. |
| `updated_by_member_id` | `uuid` | no | FK to `organization_member(id)` with set null. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(organization_id, name)`; GiST on `geometry`.

RLS: enabled. Current access path is trusted server-side code.

### `public.territory_marker`

Tenant map marker.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `name` | `text` | yes | Marker name. |
| `description` | `text` | no | Description. |
| `marker_type` | `text` | yes | Default `custom`. |
| `address` | `text` | no | Address. |
| `latitude` | `double precision` | yes | Latitude. |
| `longitude` | `double precision` | yes | Longitude. |
| `location` | `geography(point,4326)` | yes | Generated point. |
| `color` | `text` | yes | Default `#0f172a`. |
| `icon` | `text` | yes | Default `marker`. |
| `is_visible_by_default` | `boolean` | yes | Default `true`. |
| `custom_fields` | `jsonb` | yes | Tenant-specific fields. |
| `created_by_member_id` | `uuid` | no | FK to `organization_member(id)` with set null. |
| `updated_by_member_id` | `uuid` | no | FK to `organization_member(id)` with set null. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(organization_id, marker_type, name)`; GiST on `location`.

RLS: enabled. Current access path is trusted server-side code.

### `public.sync_cursor`

Tenant/provider sync cursor state.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `installation_id` | `uuid` | no | FK to `integration_installation(id)` with cascade delete. |
| `provider` | `external_provider` | yes | Provider. |
| `scope` | `text` | yes | Cursor scope. |
| `cursor_payload` | `jsonb` | yes | Cursor body. |
| `status` | `sync_status` | yes | Default `idle`. |
| `last_successful_sync_at` | `timestamptz` | no | Last successful sync. |
| `last_attempted_sync_at` | `timestamptz` | no | Last attempted sync. |
| `last_error` | `text` | no | Latest error. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes and constraints: unique `(organization_id, provider, scope)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.sync_job`

Tenant/provider background job state.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `installation_id` | `uuid` | no | FK to `integration_installation(id)` with set null. |
| `kind` | `sync_job_kind` | yes | Job kind. |
| `status` | `sync_status` | yes | Default `queued`. |
| `dedupe_key` | `text` | no | Idempotency key. |
| `payload` | `jsonb` | yes | Job payload. |
| `attempts` | `integer` | yes | Default `0`. |
| `last_error` | `text` | no | Last error. |
| `available_at` | `timestamptz` | yes | Default `now()`. |
| `started_at` | `timestamptz` | no | Start timestamp. |
| `finished_at` | `timestamptz` | no | Finish timestamp. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes: `(organization_id, status, available_at)` and `(organization_id, created_at desc)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.audit_event`

Tenant audit event log.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `actor_member_id` | `uuid` | no | FK to `organization_member(id)` with set null. |
| `event_type` | `audit_event_type` | yes | Event type. |
| `entity_type` | `text` | yes | Entity kind. |
| `entity_id` | `text` | yes | Entity id. |
| `payload` | `jsonb` | yes | Event payload. |
| `created_at` | `timestamptz` | yes | Default `now()`. |

Indexes: `(organization_id, entity_type, entity_id, created_at desc)` and `(organization_id, created_at desc)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.change_request`

Tenant change/request queue item.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `requested_by_email` | `text` | yes | Tenant-session email. |
| `title` | `text` | yes | Request title. |
| `current_url` | `text` | no | Runtime URL when captured. |
| `surface` | `text` | no | Surface/module. |
| `classification` | `text` | yes | Check: `config`, `package`, `primitive`, `core`. |
| `status` | `text` | yes | Default `queued`; check: `queued`, `resolved`, `declined`, `stale`, `requires_additional_feedback`. |
| `problem` | `text` | yes | What is wrong or missing. |
| `requested_outcome` | `text` | yes | Desired outcome. |
| `business_context` | `text` | no | Business context. |
| `acceptance_criteria` | `text` | no | Acceptance criteria. |
| `classifier_notes` | `text` | no | Internal classification notes. |
| `capture_context` | `jsonb` | no | Screenshot/comment capture context. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Indexes: `(organization_id, created_at desc)`.

RLS: enabled. Current access path is trusted server-side code.

### `public.change_request_attachment`

Attachment metadata for change requests.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | FK to `organization(id)` with cascade delete. |
| `change_request_id` | `uuid` | yes | FK to `change_request(id)` with cascade delete. |
| `file_name` | `text` | yes | Uploaded file name. |
| `content_type` | `text` | no | MIME type. |
| `file_size_bytes` | `integer` | no | Size. |
| `storage_path` | `text` | yes | Supabase Storage path. |
| `created_at` | `timestamptz` | yes | Default `now()`. |

Indexes: `(change_request_id, created_at desc)`.

RLS: enabled. Current access path is trusted server-side code.

Storage bucket: `change-request-attachments`, private.

## Current Views

| View | Purpose | Important fields |
|---|---|---|
| `public.territory_pin_view` | Small account pin payload for territory map runtime. | account id, organization id, display name, statuses, address city/state, coordinates, rep names, latest dates, days overdue |
| `public.account_detail_view` | Account detail base payload. | account identity fields, address, rep/manager arrays, dates, custom fields |
| `public.territory_runtime_summary_view` | Tenant-level counts for territory/account/order/contact runtime. | accounts, geocoded pins, orders, contacts, territory boundaries, territory markers, missing referral/source counts |
| `public.territory_rep_facet_view` | Rep filter counts for territory maps. | organization id, rep name, account count |
| `public.fraternitees_account_directory_view` | FraterniTees account directory read model. | account, lead priority, lead score, close rate, closed/lost/open orders, revenue, DNC flag, lead grade |
| `public.fraternitees_account_directory_summary_view` | FraterniTees account directory summary metrics. | accounts, scored accounts, DNC flagged accounts, average non-DNC score |

## Required Additive Screenprinting Tables

The following tables are not fully committed yet. They are required for the Screenprinting Sales and Social build. Implement them with additive migrations, tenant-scoped RLS, and service/repository tests where behavior is non-trivial.

### `public.mapping_rule`

Generalized tenant-scoped mapping rules. This should coexist with or supersede `field_mapping` only through an explicit migration plan.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `installation_id` | `uuid` | no | Connector install. |
| `provider` | `external_provider` | yes | Example: `printavo`, `csv_import`. |
| `source_object` | `text` | yes | Example: `order`, `customer`, `contact`, `tag`, `status`, `payment_status`, `social_account`. |
| `source_field` | `text` | yes | Provider field key or pseudo-field. |
| `source_value` | `text` | no | Exact value when mapping an enum/tag/status. |
| `target_object` | `text` | yes | Primitive or reporting object. |
| `target_field` | `text` | yes | Internal field/bucket. |
| `target_value` | `jsonb` | yes | Structured mapped value. |
| `trust_level` | `text` | yes | Suggested values: `trusted`, `review`, `dirty`, `ignored`. |
| `priority` | `integer` | yes | Lower number wins. |
| `enabled` | `boolean` | yes | Default `true`. |
| `created_by_member_id` | `uuid` | no | Actor. |
| `updated_by_member_id` | `uuid` | no | Actor. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: `(organization_id, provider, source_object, source_field)`, `(organization_id, target_object, target_field)`, and unique active rule protection when exact source mappings must not conflict.

### `public.opportunity`

Tenant sales opportunity.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `account_id` | `uuid` | no | Linked account. |
| `contact_id` | `uuid` | no | Linked contact. |
| `source_order_id` | `uuid` | no | Linked order signal. |
| `source_activity_id` | `uuid` | no | Linked activity/social signal. |
| `pipeline_key` | `text` | yes | Tenant-configured pipeline. |
| `stage_key` | `text` | yes | Tenant-configured stage. |
| `title` | `text` | yes | Opportunity title. |
| `value` | `numeric(12,2)` | no | Expected value. |
| `currency` | `text` | yes | Default `USD`. |
| `owner_member_id` | `uuid` | no | Assigned owner. |
| `source_type` | `text` | yes | Example: `manual`, `reorder`, `social_alert`, `printavo_quote`. |
| `status` | `text` | yes | Suggested values: `open`, `won`, `lost`, `archived`. |
| `due_at` | `timestamptz` | no | Follow-up due date. |
| `metadata` | `jsonb` | yes | Extra source/context. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: `(organization_id, pipeline_key, stage_key)`, `(organization_id, owner_member_id, due_at)`, `(organization_id, account_id)`.

### `public.reorder_signal`

Tenant repeat-order signal generated from order history and tenant reorder rules.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `account_id` | `uuid` | yes | Account. |
| `source_order_id` | `uuid` | no | Order that produced the anniversary/seasonal signal. |
| `opportunity_id` | `uuid` | no | Created/linked opportunity. |
| `rule_key` | `text` | yes | Tenant rule key. |
| `bucket` | `text` | yes | `overdue`, `due`, `upcoming`, `snoozed`, `converted`, `ignored`. |
| `expected_reorder_date` | `date` | yes | Target date. |
| `last_action_at` | `timestamptz` | no | Latest follow-up. |
| `snoozed_until` | `date` | no | Snooze date. |
| `owner_member_id` | `uuid` | no | Follow-up owner. |
| `metadata` | `jsonb` | yes | Cycle/category/evidence. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: `(organization_id, bucket, expected_reorder_date)`, `(organization_id, owner_member_id, expected_reorder_date)`, `(organization_id, account_id)`.

### `public.email_template`

Tenant editable draft template.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `template_key` | `text` | yes | Example: `reorder_follow_up`, `quote_follow_up`. |
| `name` | `text` | yes | Tenant-visible name. |
| `subject_template` | `text` | yes | Tokenized subject. |
| `body_template` | `text` | yes | Tokenized body. |
| `enabled` | `boolean` | yes | Default `true`. |
| `metadata` | `jsonb` | yes | Available tokens and category scope. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: unique `(organization_id, template_key)`.

### `public.social_account`

Tenant-owned or tenant-watched social account registry.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `platform` | `text` | yes | `instagram`, `tiktok`, `x`, `facebook`, or future platform key. |
| `handle` | `text` | yes | Platform handle without forcing global uniqueness. |
| `display_name` | `text` | no | Profile display name. |
| `external_account_id` | `text` | no | Provider id when API-backed. |
| `ownership` | `text` | yes | `owned`, `watched`, `ignored`. |
| `source` | `text` | yes | `api`, `manual`, `csv_import`. |
| `category` | `text` | no | Tenant-configured category. |
| `priority` | `text` | no | Tenant-configured priority. |
| `status` | `text` | yes | `active`, `paused`, `needs_auth`, `archived`. |
| `account_id` | `uuid` | no | Linked customer/account. |
| `contact_id` | `uuid` | no | Linked contact. |
| `school_or_org_key` | `text` | no | Tenant-defined org/school/team key. |
| `profile_url` | `text` | no | Source profile URL. |
| `follower_count` | `integer` | no | Latest known count. |
| `last_synced_at` | `timestamptz` | no | Latest sync. |
| `metadata` | `jsonb` | yes | Profile and provider metadata. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: unique `(organization_id, platform, lower(handle))`; `(organization_id, ownership, status)`; `(organization_id, category, priority)`.

### `public.social_post`

Tenant social post/media record.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `social_account_id` | `uuid` | yes | FK to `social_account(id)`. |
| `external_post_id` | `text` | no | Provider post/media id. |
| `post_type` | `text` | yes | `post`, `reel`, `story`, `video`, `manual`. |
| `caption` | `text` | no | Caption/text when available. |
| `permalink` | `text` | no | Source link. |
| `media_url` | `text` | no | Cached/source media URL if allowed. |
| `status` | `text` | yes | `published`, `scheduled`, `planned`, `draft`, `imported`, `deleted`. |
| `published_at` | `timestamptz` | no | Published timestamp. |
| `scheduled_for` | `timestamptz` | no | Calendar timestamp. |
| `metrics` | `jsonb` | yes | Likes, comments, shares, views, reach, replies, navigation, profile visits, follows, engagement rate. |
| `campaign_id` | `uuid` | no | Linked campaign. |
| `account_id` | `uuid` | no | Linked customer/account. |
| `metadata` | `jsonb` | yes | Provider metadata. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: unique `(organization_id, social_account_id, external_post_id)` where present; `(organization_id, published_at desc)`; `(organization_id, status, scheduled_for)`.

### `public.social_thread`

Comment/message/manual conversation thread.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `platform` | `text` | yes | Platform key. |
| `thread_type` | `text` | yes | `comment`, `dm`, `manual`. |
| `social_account_id` | `uuid` | no | Owned/watched account context. |
| `social_post_id` | `uuid` | no | Linked post. |
| `external_thread_id` | `text` | no | Provider thread id. |
| `participant_handle` | `text` | no | External participant. |
| `account_id` | `uuid` | no | Linked account/customer/org. |
| `contact_id` | `uuid` | no | Linked contact. |
| `opportunity_id` | `uuid` | no | Linked opportunity. |
| `status` | `text` | yes | `open`, `replied`, `needs_review`, `closed`, `ignored`. |
| `owner_member_id` | `uuid` | no | Assigned owner. |
| `last_message_at` | `timestamptz` | no | Latest message/comment. |
| `metadata` | `jsonb` | yes | Messages, snippets, API permission state, manual notes. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: `(organization_id, status, last_message_at desc)`, `(organization_id, owner_member_id, status)`, unique `(organization_id, platform, external_thread_id)` where present.

### `public.campaign`

Sales/social campaign.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `name` | `text` | yes | Campaign name. |
| `campaign_type` | `text` | yes | Tenant-defined type. |
| `status` | `text` | yes | `planned`, `active`, `paused`, `completed`, `archived`. |
| `owner_member_id` | `uuid` | no | Owner. |
| `starts_on` | `date` | no | Start date. |
| `ends_on` | `date` | no | End date. |
| `goal` | `text` | no | Campaign goal. |
| `metadata` | `jsonb` | yes | Target accounts, schools, channels, assets, KPIs. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: `(organization_id, status, starts_on)`, `(organization_id, owner_member_id, status)`.

### `public.alert_rule`

Tenant-configured actionable alert rule.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `rule_key` | `text` | yes | Stable tenant rule key. |
| `name` | `text` | yes | Tenant-visible name. |
| `module` | `text` | yes | `sales`, `social`, or future module. |
| `event_type` | `text` | yes | Example: `engagement_spike`, `new_post`, `due_reorder`. |
| `scope` | `jsonb` | yes | Account/category/status scope. |
| `threshold` | `jsonb` | yes | Numeric/baseline thresholds. |
| `severity` | `text` | yes | Tenant-defined severity. |
| `owner_member_id` | `uuid` | no | Default owner. |
| `cooldown_minutes` | `integer` | yes | Default cooldown. |
| `enabled` | `boolean` | yes | Default `true`. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: unique `(organization_id, rule_key)`, `(organization_id, module, enabled)`.

### `public.alert_instance`

Tenant alert inbox item.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `alert_rule_id` | `uuid` | no | Rule that generated it. |
| `module` | `text` | yes | `sales`, `social`, or future module. |
| `event_type` | `text` | yes | Alert event type. |
| `title` | `text` | yes | Inbox title. |
| `body` | `text` | no | Detail text. |
| `severity` | `text` | yes | Severity at creation. |
| `status` | `text` | yes | `unread`, `read`, `assigned`, `resolved`, `dismissed`. |
| `owner_member_id` | `uuid` | no | Assigned owner. |
| `account_id` | `uuid` | no | Linked account/customer. |
| `opportunity_id` | `uuid` | no | Linked opportunity. |
| `social_account_id` | `uuid` | no | Linked social account. |
| `social_post_id` | `uuid` | no | Linked social post. |
| `dedupe_key` | `text` | no | Prevents duplicate alerts inside cooldown windows. |
| `metadata` | `jsonb` | yes | Evidence and source metrics. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: `(organization_id, status, created_at desc)`, `(organization_id, owner_member_id, status)`, unique `(organization_id, dedupe_key)` where present.

### `public.identity_resolution`

Non-destructive review queue for account/contact/social/customer links.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `source_type` | `text` | yes | Example: `printavo_customer`, `instagram_account`, `social_thread`. |
| `source_ref` | `jsonb` | yes | Source id and display evidence. |
| `target_type` | `text` | yes | Example: `account`, `contact`, `opportunity`, `campaign`. |
| `target_id` | `uuid` | no | Internal target id when known. |
| `status` | `text` | yes | `suggested`, `confirmed`, `rejected`, `ignored`, `needs_review`. |
| `confidence` | `numeric(5,4)` | yes | Match confidence. |
| `reason` | `text` | yes | Human-readable match reason. |
| `metadata` | `jsonb` | yes | Matching features and rejection memory. |
| `reviewed_by_member_id` | `uuid` | no | Reviewer. |
| `reviewed_at` | `timestamptz` | no | Review timestamp. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: `(organization_id, status, confidence desc)`, `(organization_id, source_type)`, `(organization_id, target_type, target_id)`.

### `public.dashboard_definition`

Tenant dashboard and saved-view definition.

| Column | Type | Required | Notes |
|---|---:|---:|---|
| `id` | `uuid` | yes | Primary key. |
| `organization_id` | `uuid` | yes | Tenant boundary. |
| `dashboard_key` | `text` | yes | Stable key. |
| `name` | `text` | yes | Tenant-visible name. |
| `module` | `text` | yes | `sales`, `social`, `territory`, `accounts`, or custom. |
| `role_scope` | `text[]` | yes | Roles that see it by default. |
| `definition` | `jsonb` | yes | Widgets, filters, layouts, metrics, saved views. |
| `is_default` | `boolean` | yes | Default `false`. |
| `created_at` | `timestamptz` | yes | Default `now()`. |
| `updated_at` | `timestamptz` | yes | Default `now()`. |

Required indexes: unique `(organization_id, dashboard_key)`, `(organization_id, module, is_default)`.

## Additive Migration Acceptance Criteria

Any migration adding Screenprinting tables must satisfy:

- every tenant business table has `organization_id`
- every tenant business table has RLS enabled
- every provider-sourced table preserves source ids and source metadata
- every risky action has an audit or activity record path
- every matching/merge/link table is non-destructive by default
- read-heavy list screens have indexes matching expected filters
- existing FraterniTees lead scoring, account directory, top-customer leaderboard, Printavo sync, map, and change-request flows still work
- `npm run verify` passes after the migration and related code changes

## Current Screenprinting Implementation

The additive Screenprinting data foundation is committed in `supabase/migrations/20260427120000_screenprinting_foundation.sql`.

It adds `mapping_rule`, `opportunity`, `reorder_signal`, `email_template`, `social_account`, `social_post`, `social_thread`, `campaign`, `alert_rule`, `alert_instance`, `identity_resolution`, and `dashboard_definition`.

Every new table includes `organization_id`, has RLS enabled, and preserves product-owned source metadata where applicable. The migration also adds Screenprinting-specific audit event values for config changes, identity review, opportunities, reorders, draft email events, social account changes, manual social threads, and alert state changes.
