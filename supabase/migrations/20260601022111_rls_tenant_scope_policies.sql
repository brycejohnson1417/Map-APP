create schema if not exists app_private;

create or replace function app_private.current_tenant_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct member.organization_id
  from public.organization_member as member
  where (
    auth.uid() is not null
    and member.clerk_user_id = (auth.uid())::text
  )
  or (
    nullif(lower(auth.jwt() ->> 'email'), '') is not null
    and lower(member.email) = nullif(lower(auth.jwt() ->> 'email'), '')
  );
$$;

comment on function app_private.current_tenant_organization_ids() is
  'Returns organization ids for the verified Supabase Auth JWT subject or email claim. Does not authorize from user-editable metadata.';

revoke all on function app_private.current_tenant_organization_ids() from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.current_tenant_organization_ids() to authenticated;

drop policy if exists "tenant_scope_select" on public.organization;
create policy "tenant_scope_select"
  on public.organization
  for select
  to authenticated
  using (id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.organization_member;
create policy "tenant_scope_select"
  on public.organization_member
  for select
  to authenticated
  using (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.integration_installation;
create policy "tenant_scope_select"
  on public.integration_installation
  for select
  to authenticated
  using (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.sync_cursor;
create policy "tenant_scope_select"
  on public.sync_cursor
  for select
  to authenticated
  using (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.sync_job;
create policy "tenant_scope_select"
  on public.sync_job
  for select
  to authenticated
  using (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.audit_event;
create policy "tenant_scope_select"
  on public.audit_event
  for select
  to authenticated
  using (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.account;
drop policy if exists "tenant_scope_all" on public.account;
create policy "tenant_scope_select" on public.account for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.account for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.account_identity;
drop policy if exists "tenant_scope_all" on public.account_identity;
create policy "tenant_scope_select" on public.account_identity for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.account_identity for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.contact;
drop policy if exists "tenant_scope_all" on public.contact;
create policy "tenant_scope_select" on public.contact for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.contact for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.activity;
drop policy if exists "tenant_scope_all" on public.activity;
create policy "tenant_scope_select" on public.activity for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.activity for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.territory_boundary;
drop policy if exists "tenant_scope_all" on public.territory_boundary;
create policy "tenant_scope_select" on public.territory_boundary for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.territory_boundary for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.territory_marker;
drop policy if exists "tenant_scope_all" on public.territory_marker;
create policy "tenant_scope_select" on public.territory_marker for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.territory_marker for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.field_mapping;
drop policy if exists "tenant_scope_all" on public.field_mapping;
create policy "tenant_scope_select" on public.field_mapping for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.field_mapping for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.order_record;
drop policy if exists "tenant_scope_all" on public.order_record;
create policy "tenant_scope_select" on public.order_record for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.order_record for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.change_request;
drop policy if exists "tenant_scope_all" on public.change_request;
create policy "tenant_scope_select" on public.change_request for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.change_request for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.change_request_attachment;
drop policy if exists "tenant_scope_all" on public.change_request_attachment;
create policy "tenant_scope_select" on public.change_request_attachment for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.change_request_attachment for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.mapping_rule;
drop policy if exists "tenant_scope_all" on public.mapping_rule;
create policy "tenant_scope_select" on public.mapping_rule for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.mapping_rule for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.opportunity;
drop policy if exists "tenant_scope_all" on public.opportunity;
create policy "tenant_scope_select" on public.opportunity for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.opportunity for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.reorder_signal;
drop policy if exists "tenant_scope_all" on public.reorder_signal;
create policy "tenant_scope_select" on public.reorder_signal for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.reorder_signal for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.email_template;
drop policy if exists "tenant_scope_all" on public.email_template;
create policy "tenant_scope_select" on public.email_template for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.email_template for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.social_account;
drop policy if exists "tenant_scope_all" on public.social_account;
create policy "tenant_scope_select" on public.social_account for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.social_account for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.campaign;
drop policy if exists "tenant_scope_all" on public.campaign;
create policy "tenant_scope_select" on public.campaign for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.campaign for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.social_post;
drop policy if exists "tenant_scope_all" on public.social_post;
create policy "tenant_scope_select" on public.social_post for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.social_post for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.social_thread;
drop policy if exists "tenant_scope_all" on public.social_thread;
create policy "tenant_scope_select" on public.social_thread for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.social_thread for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.alert_rule;
drop policy if exists "tenant_scope_all" on public.alert_rule;
create policy "tenant_scope_select" on public.alert_rule for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.alert_rule for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.alert_instance;
drop policy if exists "tenant_scope_all" on public.alert_instance;
create policy "tenant_scope_select" on public.alert_instance for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.alert_instance for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.identity_resolution;
drop policy if exists "tenant_scope_all" on public.identity_resolution;
create policy "tenant_scope_select" on public.identity_resolution for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.identity_resolution for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));

drop policy if exists "tenant_scope_select" on public.dashboard_definition;
drop policy if exists "tenant_scope_all" on public.dashboard_definition;
create policy "tenant_scope_select" on public.dashboard_definition for select to authenticated using (organization_id in (select app_private.current_tenant_organization_ids()));
create policy "tenant_scope_all" on public.dashboard_definition for all to authenticated using (organization_id in (select app_private.current_tenant_organization_ids())) with check (organization_id in (select app_private.current_tenant_organization_ids()));
