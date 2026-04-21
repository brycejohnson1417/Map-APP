create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

do $$
begin
  create type public.membership_role as enum ('owner', 'admin', 'manager', 'member', 'guest');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.external_provider as enum (
    'notion',
    'nabis',
    'google_calendar',
    'google_maps',
    'hubspot',
    'salesforce',
    'airtable',
    'csv_import'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.external_entity_type as enum (
    'organization',
    'account',
    'contact',
    'order',
    'calendar',
    'calendar_event',
    'territory_boundary',
    'territory_marker'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.sync_status as enum ('idle', 'queued', 'running', 'success', 'error');
exception
  when duplicate_object then null;
end
$$;
alter type public.sync_status add value if not exists 'idle';
alter type public.sync_status add value if not exists 'queued';
alter type public.sync_status add value if not exists 'running';
alter type public.sync_status add value if not exists 'success';
alter type public.sync_status add value if not exists 'error';

do $$
begin
  create type public.sync_job_kind as enum (
    'notion_pages',
    'notion_comments',
    'orders_accounts',
    'orders_events',
    'calendar_pull',
    'calendar_push',
    'read_model_refresh',
    'reconciliation'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.audit_event_type as enum (
    'sync_started',
    'sync_succeeded',
    'sync_failed',
    'account_created',
    'account_updated',
    'boundary_created',
    'boundary_updated',
    'marker_created',
    'marker_updated',
    'integration_connected',
    'integration_updated',
    'integration_disconnected'
  );
exception
  when duplicate_object then null;
end
$$;

create schema if not exists app_private;

create table if not exists public.organization (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_member (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  clerk_user_id text not null,
  email text not null,
  full_name text,
  role public.membership_role not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, clerk_user_id),
  unique (organization_id, email)
);

create table if not exists public.integration_installation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  provider public.external_provider not null,
  external_account_id text,
  display_name text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, display_name)
);

create table if not exists app_private.integration_secret (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  installation_id uuid not null references public.integration_installation(id) on delete cascade,
  key_name text not null,
  ciphertext text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (installation_id, key_name)
);

create table if not exists public.field_mapping (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  installation_id uuid references public.integration_installation(id) on delete cascade,
  provider public.external_provider not null,
  external_entity_type public.external_entity_type not null,
  external_field_key text not null,
  internal_field_key text not null,
  transform jsonb not null default '{}'::jsonb,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, external_entity_type, external_field_key, internal_field_key)
);

create table if not exists public.account (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  legal_name text,
  display_name text,
  account_status text,
  lead_status text,
  referral_source text,
  vendor_day_status text,
  licensed_location_id text,
  license_number text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  latitude double precision,
  longitude double precision,
  location extensions.geography(point, 4326),
  sales_rep_names text[] not null default '{}'::text[],
  account_manager_names text[] not null default '{}'::text[],
  last_contacted_at date,
  last_sample_order_date date,
  last_sample_delivery_date date,
  last_order_date date,
  customer_since_date date,
  crm_updated_at timestamptz,
  external_updated_at timestamptz,
  custom_fields jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_org_licensed_location_idx
  on public.account (organization_id, licensed_location_id)
  where licensed_location_id is not null;
create index if not exists account_org_status_idx on public.account (organization_id, account_status, lead_status);
create index if not exists account_org_vendor_day_idx on public.account (organization_id, vendor_day_status);
create index if not exists account_location_gix on public.account using gist (location);

create table if not exists public.account_identity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  account_id uuid not null references public.account(id) on delete cascade,
  provider public.external_provider not null,
  external_entity_type public.external_entity_type not null,
  external_id text not null,
  match_method text not null default 'deterministic',
  match_confidence numeric(5,4) not null default 1.0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, external_entity_type, external_id)
);

create table if not exists public.contact (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  account_id uuid references public.account(id) on delete cascade,
  full_name text not null,
  title text,
  email text,
  phone text,
  role text,
  custom_fields jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  account_id uuid references public.account(id) on delete cascade,
  contact_id uuid references public.contact(id) on delete set null,
  actor_member_id uuid references public.organization_member(id) on delete set null,
  activity_type text not null,
  summary text not null,
  occurred_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.territory_boundary (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#ef4444',
  border_width integer not null default 2,
  is_visible_by_default boolean not null default true,
  geometry extensions.geometry(multipolygon, 4326),
  geojson jsonb not null,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by_member_id uuid references public.organization_member(id) on delete set null,
  updated_by_member_id uuid references public.organization_member(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.territory_boundary
  add column if not exists geometry extensions.geometry(multipolygon, 4326);
create index if not exists territory_boundary_geometry_gix on public.territory_boundary using gist (geometry);

create table if not exists public.territory_marker (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  description text,
  marker_type text not null default 'custom',
  address text,
  latitude double precision not null,
  longitude double precision not null,
  location extensions.geography(point, 4326) generated always as (extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography) stored,
  color text not null default '#0f172a',
  icon text not null default 'marker',
  is_visible_by_default boolean not null default true,
  custom_fields jsonb not null default '{}'::jsonb,
  created_by_member_id uuid references public.organization_member(id) on delete set null,
  updated_by_member_id uuid references public.organization_member(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.territory_marker
  add column if not exists location extensions.geography(point, 4326)
  generated always as (extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography) stored;
create index if not exists territory_marker_location_gix on public.territory_marker using gist (location);

create table if not exists public.sync_cursor (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  installation_id uuid references public.integration_installation(id) on delete cascade,
  provider public.external_provider not null,
  scope text not null,
  cursor_payload jsonb not null default '{}'::jsonb,
  status public.sync_status not null default 'idle',
  last_successful_sync_at timestamptz,
  last_attempted_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, scope)
);

create table if not exists public.sync_job (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  installation_id uuid references public.integration_installation(id) on delete set null,
  kind public.sync_job_kind not null,
  status public.sync_status not null default 'queued',
  dedupe_key text,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  last_error text,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sync_job_org_status_available_idx on public.sync_job (organization_id, status, available_at);

create table if not exists public.audit_event (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  actor_member_id uuid references public.organization_member(id) on delete set null,
  event_type public.audit_event_type not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_event_org_entity_idx on public.audit_event (organization_id, entity_type, entity_id, created_at desc);

alter table public.organization enable row level security;
alter table public.organization_member enable row level security;
alter table public.integration_installation enable row level security;
alter table public.field_mapping enable row level security;
alter table public.account enable row level security;
alter table public.account_identity enable row level security;
alter table public.contact enable row level security;
alter table public.activity enable row level security;
alter table public.territory_boundary enable row level security;
alter table public.territory_marker enable row level security;
alter table public.sync_cursor enable row level security;
alter table public.sync_job enable row level security;
alter table public.audit_event enable row level security;

comment on schema app_private is 'Private schema for encrypted tenant integration secrets.';
comment on table public.field_mapping is 'Per-tenant external-to-internal field mappings for connector adapters.';
comment on table public.account is 'Canonical local account model used by all user-facing surfaces.';
comment on table public.account_identity is 'Deterministic mapping between local accounts and provider-specific records.';
comment on table public.sync_job is 'Retryable background work queue for connector sync and read model refresh jobs.';
