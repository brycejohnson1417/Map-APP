alter type public.audit_event_type add value if not exists 'screenprinting_config_changed';
alter type public.audit_event_type add value if not exists 'screenprinting_config_undone';
alter type public.audit_event_type add value if not exists 'screenprinting_mapping_changed';
alter type public.audit_event_type add value if not exists 'identity_resolution_updated';
alter type public.audit_event_type add value if not exists 'opportunity_updated';
alter type public.audit_event_type add value if not exists 'reorder_updated';
alter type public.audit_event_type add value if not exists 'email_draft_recorded';
alter type public.audit_event_type add value if not exists 'social_account_updated';
alter type public.audit_event_type add value if not exists 'social_thread_logged';
alter type public.audit_event_type add value if not exists 'alert_updated';

create table if not exists public.mapping_rule (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  installation_id uuid references public.integration_installation(id) on delete cascade,
  provider public.external_provider not null,
  source_object text not null,
  source_field text not null,
  source_value text,
  target_object text not null,
  target_field text not null,
  target_value jsonb not null default '{}'::jsonb,
  trust_level text not null default 'review',
  priority integer not null default 100,
  enabled boolean not null default true,
  created_by_member_id uuid references public.organization_member(id) on delete set null,
  updated_by_member_id uuid references public.organization_member(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mapping_rule_source_idx on public.mapping_rule (organization_id, provider, source_object, source_field);
create index if not exists mapping_rule_target_idx on public.mapping_rule (organization_id, target_object, target_field);
create unique index if not exists mapping_rule_active_exact_idx
  on public.mapping_rule (organization_id, provider, source_object, source_field, source_value, target_object, target_field)
  where enabled is true and source_value is not null;

create table if not exists public.opportunity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  account_id uuid references public.account(id) on delete set null,
  contact_id uuid references public.contact(id) on delete set null,
  source_order_id uuid references public.order_record(id) on delete set null,
  source_activity_id uuid references public.activity(id) on delete set null,
  pipeline_key text not null,
  stage_key text not null,
  title text not null,
  value numeric(12,2),
  currency text not null default 'USD',
  owner_member_id uuid references public.organization_member(id) on delete set null,
  source_type text not null default 'manual',
  status text not null default 'open',
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists opportunity_stage_idx on public.opportunity (organization_id, pipeline_key, stage_key);
create index if not exists opportunity_owner_due_idx on public.opportunity (organization_id, owner_member_id, due_at);
create index if not exists opportunity_account_idx on public.opportunity (organization_id, account_id);

create table if not exists public.reorder_signal (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  account_id uuid not null references public.account(id) on delete cascade,
  source_order_id uuid references public.order_record(id) on delete set null,
  opportunity_id uuid references public.opportunity(id) on delete set null,
  rule_key text not null,
  bucket text not null,
  expected_reorder_date date not null,
  last_action_at timestamptz,
  snoozed_until date,
  owner_member_id uuid references public.organization_member(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reorder_signal_bucket_date_idx on public.reorder_signal (organization_id, bucket, expected_reorder_date);
create index if not exists reorder_signal_owner_date_idx on public.reorder_signal (organization_id, owner_member_id, expected_reorder_date);
create index if not exists reorder_signal_account_idx on public.reorder_signal (organization_id, account_id);

create table if not exists public.email_template (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  template_key text not null,
  name text not null,
  subject_template text not null,
  body_template text not null,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, template_key)
);

create table if not exists public.social_account (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  platform text not null,
  handle text not null,
  display_name text,
  external_account_id text,
  ownership text not null default 'watched',
  source text not null default 'manual',
  category text,
  priority text,
  status text not null default 'active',
  account_id uuid references public.account(id) on delete set null,
  contact_id uuid references public.contact(id) on delete set null,
  school_or_org_key text,
  profile_url text,
  follower_count integer,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_account_org_platform_handle_idx
  on public.social_account (organization_id, platform, lower(handle));
create index if not exists social_account_owner_status_idx on public.social_account (organization_id, ownership, status);
create index if not exists social_account_category_priority_idx on public.social_account (organization_id, category, priority);

create table if not exists public.campaign (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  name text not null,
  campaign_type text not null,
  status text not null default 'planned',
  owner_member_id uuid references public.organization_member(id) on delete set null,
  starts_on date,
  ends_on date,
  goal text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists campaign_status_starts_idx on public.campaign (organization_id, status, starts_on);
create index if not exists campaign_owner_status_idx on public.campaign (organization_id, owner_member_id, status);

create table if not exists public.social_post (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  social_account_id uuid not null references public.social_account(id) on delete cascade,
  external_post_id text,
  post_type text not null,
  caption text,
  permalink text,
  media_url text,
  status text not null default 'imported',
  published_at timestamptz,
  scheduled_for timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  campaign_id uuid references public.campaign(id) on delete set null,
  account_id uuid references public.account(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_post_external_idx
  on public.social_post (organization_id, social_account_id, external_post_id)
  where external_post_id is not null;
create index if not exists social_post_published_idx on public.social_post (organization_id, published_at desc);
create index if not exists social_post_status_scheduled_idx on public.social_post (organization_id, status, scheduled_for);

create table if not exists public.social_thread (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  platform text not null,
  thread_type text not null,
  social_account_id uuid references public.social_account(id) on delete set null,
  social_post_id uuid references public.social_post(id) on delete set null,
  external_thread_id text,
  participant_handle text,
  account_id uuid references public.account(id) on delete set null,
  contact_id uuid references public.contact(id) on delete set null,
  opportunity_id uuid references public.opportunity(id) on delete set null,
  status text not null default 'open',
  owner_member_id uuid references public.organization_member(id) on delete set null,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_thread_status_last_idx on public.social_thread (organization_id, status, last_message_at desc);
create index if not exists social_thread_owner_status_idx on public.social_thread (organization_id, owner_member_id, status);
create unique index if not exists social_thread_external_idx
  on public.social_thread (organization_id, platform, external_thread_id)
  where external_thread_id is not null;

create table if not exists public.alert_rule (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  rule_key text not null,
  name text not null,
  module text not null,
  event_type text not null,
  scope jsonb not null default '{}'::jsonb,
  threshold jsonb not null default '{}'::jsonb,
  severity text not null default 'medium',
  owner_member_id uuid references public.organization_member(id) on delete set null,
  cooldown_minutes integer not null default 1440,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, rule_key)
);
create index if not exists alert_rule_module_enabled_idx on public.alert_rule (organization_id, module, enabled);

create table if not exists public.alert_instance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  alert_rule_id uuid references public.alert_rule(id) on delete set null,
  module text not null,
  event_type text not null,
  title text not null,
  body text,
  severity text not null default 'medium',
  status text not null default 'unread',
  owner_member_id uuid references public.organization_member(id) on delete set null,
  account_id uuid references public.account(id) on delete set null,
  opportunity_id uuid references public.opportunity(id) on delete set null,
  social_account_id uuid references public.social_account(id) on delete set null,
  social_post_id uuid references public.social_post(id) on delete set null,
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists alert_instance_status_created_idx on public.alert_instance (organization_id, status, created_at desc);
create index if not exists alert_instance_owner_status_idx on public.alert_instance (organization_id, owner_member_id, status);
create unique index if not exists alert_instance_dedupe_idx
  on public.alert_instance (organization_id, dedupe_key)
  where dedupe_key is not null;

create table if not exists public.identity_resolution (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  source_type text not null,
  source_ref jsonb not null default '{}'::jsonb,
  target_type text not null,
  target_id uuid,
  status text not null default 'suggested',
  confidence numeric(5,4) not null default 0.5000,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  reviewed_by_member_id uuid references public.organization_member(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists identity_resolution_status_confidence_idx on public.identity_resolution (organization_id, status, confidence desc);
create index if not exists identity_resolution_source_idx on public.identity_resolution (organization_id, source_type);
create index if not exists identity_resolution_target_idx on public.identity_resolution (organization_id, target_type, target_id);

create table if not exists public.dashboard_definition (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  dashboard_key text not null,
  name text not null,
  module text not null,
  role_scope text[] not null default '{}'::text[],
  definition jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, dashboard_key)
);
create index if not exists dashboard_definition_module_default_idx on public.dashboard_definition (organization_id, module, is_default);

alter table public.mapping_rule enable row level security;
alter table public.opportunity enable row level security;
alter table public.reorder_signal enable row level security;
alter table public.email_template enable row level security;
alter table public.social_account enable row level security;
alter table public.social_post enable row level security;
alter table public.social_thread enable row level security;
alter table public.campaign enable row level security;
alter table public.alert_rule enable row level security;
alter table public.alert_instance enable row level security;
alter table public.identity_resolution enable row level security;
alter table public.dashboard_definition enable row level security;

comment on table public.mapping_rule is 'Tenant-scoped mapping rules for provider data, reporting buckets, and dirty-field decisions.';
comment on table public.opportunity is 'Tenant sales opportunity records owned by Map App, not provider write-back.';
comment on table public.reorder_signal is 'Tenant repeat-order follow-up state generated from order history and reorder rules.';
comment on table public.social_account is 'Tenant-owned or tenant-watched social account registry.';
comment on table public.identity_resolution is 'Non-destructive identity/link suggestion queue.';
