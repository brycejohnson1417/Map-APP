create table if not exists public.change_request (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  requested_by_email text not null,
  title text not null,
  current_url text,
  surface text,
  classification text not null check (classification in ('config', 'package', 'primitive', 'core')),
  status text not null default 'new' check (status in ('new', 'clarifying', 'queued', 'planned', 'completed')),
  problem text not null,
  requested_outcome text not null,
  business_context text,
  acceptance_criteria text,
  classifier_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists change_request_organization_created_idx
  on public.change_request (organization_id, created_at desc);

create table if not exists public.change_request_attachment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  change_request_id uuid not null references public.change_request(id) on delete cascade,
  file_name text not null,
  content_type text,
  file_size_bytes integer,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists change_request_attachment_request_idx
  on public.change_request_attachment (change_request_id, created_at desc);

alter table public.change_request enable row level security;
alter table public.change_request_attachment enable row level security;

comment on table public.change_request is
  'Tenant-scoped change requests captured from the in-app queue. Service-role code is the only supported write path.';

comment on table public.change_request_attachment is
  'Metadata for uploaded change-request attachments stored in Supabase Storage.';

insert into storage.buckets (id, name, public)
values ('change-request-attachments', 'change-request-attachments', false)
on conflict (id) do nothing;
