/*
  Adds defense-in-depth tenant-scope Row Level Security policies for current
  public-schema Map-APP tenant tables.

  This migration deliberately does not:
  - enable FORCE ROW LEVEL SECURITY;
  - convert route handlers from service-role clients to per-request JWT clients;
  - add tenant JWT policies to app_private tables;
  - add tenant JWT access to public.integration_secret, which remains a
    service-role-only legacy secrets table.

  Before FORCE ROW LEVEL SECURITY can be enabled, route handlers must be
  converted to request-scoped JWT Supabase clients where appropriate, Clerk/Supabase
  JWTs must include a trusted organization_id claim, and server-owned write paths
  must be reviewed table by table.
*/

create schema if not exists app_private;

create or replace function app_private.current_organization_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  organization_id_claim text;
begin
  organization_id_claim := nullif(auth.jwt() ->> 'organization_id', '');

  if organization_id_claim is null then
    return null;
  end if;

  return organization_id_claim::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

comment on function app_private.current_organization_id() is
  'Returns the trusted organization_id claim from the current Supabase JWT for tenant-scoped RLS policies.';

grant usage on schema app_private to authenticated;
revoke all on function app_private.current_organization_id() from public;
grant execute on function app_private.current_organization_id() to authenticated;

drop policy if exists tenant_scope on public.organization;
create policy tenant_scope on public.organization
  as permissive
  for all
  to authenticated
  using (id = app_private.current_organization_id())
  with check (id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.organization_member;
create policy tenant_scope on public.organization_member
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.integration_installation;
create policy tenant_scope on public.integration_installation
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.field_mapping;
create policy tenant_scope on public.field_mapping
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.account;
create policy tenant_scope on public.account
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.account_identity;
create policy tenant_scope on public.account_identity
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.contact;
create policy tenant_scope on public.contact
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.activity;
create policy tenant_scope on public.activity
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.territory_boundary;
create policy tenant_scope on public.territory_boundary
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.territory_marker;
create policy tenant_scope on public.territory_marker
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.sync_cursor;
create policy tenant_scope on public.sync_cursor
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.sync_job;
create policy tenant_scope on public.sync_job
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.order_record;
create policy tenant_scope on public.order_record
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.change_request;
create policy tenant_scope on public.change_request
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.change_request_attachment;
create policy tenant_scope on public.change_request_attachment
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.mapping_rule;
create policy tenant_scope on public.mapping_rule
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.opportunity;
create policy tenant_scope on public.opportunity
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.reorder_signal;
create policy tenant_scope on public.reorder_signal
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.email_template;
create policy tenant_scope on public.email_template
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.social_account;
create policy tenant_scope on public.social_account
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.campaign;
create policy tenant_scope on public.campaign
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.social_post;
create policy tenant_scope on public.social_post
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.social_thread;
create policy tenant_scope on public.social_thread
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.alert_rule;
create policy tenant_scope on public.alert_rule
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.alert_instance;
create policy tenant_scope on public.alert_instance
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.identity_resolution;
create policy tenant_scope on public.identity_resolution
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.dashboard_definition;
create policy tenant_scope on public.dashboard_definition
  as permissive
  for all
  to authenticated
  using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.audit_event;
drop policy if exists tenant_scope_read on public.audit_event;
create policy tenant_scope_read on public.audit_event
  as permissive
  for select
  to authenticated
  using (organization_id = app_private.current_organization_id());

drop policy if exists tenant_scope on public.integration_secret;
drop policy if exists tenant_scope_read on public.integration_secret;
