create table if not exists public.integration_secret (
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

alter table public.integration_secret enable row level security;

comment on table public.integration_secret is
  'Encrypted tenant connector secrets. No client RLS policies are defined; server service-role code is the only supported access path.';
