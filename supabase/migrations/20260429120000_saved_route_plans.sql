alter type public.audit_event_type add value if not exists 'route_plan_created';
alter type public.audit_event_type add value if not exists 'route_plan_updated';
alter type public.audit_event_type add value if not exists 'route_stop_completed';

create table if not exists public.route_plan (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('draft', 'active', 'completed', 'archived')),
  visibility text not null default 'private' check (visibility in ('private', 'organization', 'shared')),
  owner_email text not null,
  shared_with_emails text[] not null default '{}'::text[],
  start_label text,
  start_latitude double precision,
  start_longitude double precision,
  end_label text,
  end_latitude double precision,
  end_longitude double precision,
  optimization_mode text not null default 'nearest_neighbor',
  source_filters jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_stop (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  route_plan_id uuid not null references public.route_plan(id) on delete cascade,
  account_id uuid references public.account(id) on delete set null,
  stop_index integer not null check (stop_index > 0),
  status text not null default 'planned' check (status in ('planned', 'needs_review', 'completed', 'skipped')),
  account_name text not null,
  city text,
  state text,
  latitude double precision,
  longitude double precision,
  distance_from_previous_miles numeric(10, 2),
  estimated_duration_from_previous_minutes integer,
  notes text,
  completed_at timestamptz,
  completion_activity_id uuid references public.activity(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (route_plan_id, stop_index)
);

create index if not exists route_plan_org_updated_idx on public.route_plan (organization_id, updated_at desc);
create index if not exists route_plan_org_owner_idx on public.route_plan (organization_id, owner_email, updated_at desc);
create index if not exists route_stop_plan_index_idx on public.route_stop (route_plan_id, stop_index);
create index if not exists route_stop_org_account_idx on public.route_stop (organization_id, account_id);

alter table public.route_plan enable row level security;
alter table public.route_stop enable row level security;

comment on table public.route_plan is 'Tenant-scoped saved field routes and call lists owned by the app.';
comment on table public.route_stop is 'Ordered account stops for a saved route, including missing-coordinate review and execution state.';
