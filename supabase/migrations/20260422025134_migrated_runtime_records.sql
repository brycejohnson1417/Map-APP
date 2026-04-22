create table if not exists public.order_record (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  account_id uuid references public.account(id) on delete set null,
  provider public.external_provider not null default 'nabis',
  external_order_id text not null,
  order_number text,
  licensed_location_id text,
  nabis_retailer_id text,
  licensed_location_name text,
  status text,
  payment_status text,
  order_total numeric(12, 2),
  order_created_at timestamptz,
  delivery_date date,
  sales_rep_name text,
  is_internal_transfer boolean not null default false,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, external_order_id)
);

create index if not exists order_record_org_account_idx on public.order_record (organization_id, account_id);
create index if not exists order_record_org_created_idx on public.order_record (organization_id, order_created_at desc);
create index if not exists order_record_org_delivery_idx on public.order_record (organization_id, delivery_date desc);
create index if not exists order_record_org_licensed_location_idx on public.order_record (organization_id, licensed_location_id);
create index if not exists order_record_org_retailer_idx on public.order_record (organization_id, nabis_retailer_id);

alter table public.order_record enable row level security;

create unique index if not exists account_org_licensed_location_full_idx
  on public.account (organization_id, licensed_location_id);

create unique index if not exists account_org_nabis_retailer_full_idx
  on public.account (organization_id, ((custom_fields ->> 'nabisRetailerId')))
  where custom_fields ? 'nabisRetailerId';

create unique index if not exists contact_org_account_email_idx
  on public.contact (organization_id, account_id, lower(email))
  where email is not null;

create unique index if not exists contact_org_account_name_idx
  on public.contact (organization_id, account_id, lower(full_name))
  where email is null;

alter table public.territory_boundary
  add column if not exists organization_id uuid references public.organization(id) on delete cascade,
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists created_by_member_id uuid references public.organization_member(id) on delete set null,
  add column if not exists updated_by_member_id uuid references public.organization_member(id) on delete set null;

alter table public.territory_marker
  add column if not exists organization_id uuid references public.organization(id) on delete cascade,
  add column if not exists marker_type text not null default 'custom',
  add column if not exists custom_fields jsonb not null default '{}'::jsonb,
  add column if not exists created_by_member_id uuid references public.organization_member(id) on delete set null,
  add column if not exists updated_by_member_id uuid references public.organization_member(id) on delete set null;

create unique index if not exists territory_boundary_org_name_idx
  on public.territory_boundary (organization_id, name);

create unique index if not exists territory_marker_org_type_name_idx
  on public.territory_marker (organization_id, marker_type, name);

comment on table public.order_record is
  'Canonical normalized order records from tenant order providers. Initial implementation supports Nabis migration.';
