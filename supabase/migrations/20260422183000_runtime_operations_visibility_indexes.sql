create index if not exists sync_job_org_created_idx
  on public.sync_job (organization_id, created_at desc);

create index if not exists audit_event_org_created_idx
  on public.audit_event (organization_id, created_at desc);

comment on index public.sync_job_org_created_idx is
  'Supports recent organization sync-job visibility in runtime operations surfaces.';

comment on index public.audit_event_org_created_idx is
  'Supports recent organization audit-event visibility in runtime operations surfaces.';
