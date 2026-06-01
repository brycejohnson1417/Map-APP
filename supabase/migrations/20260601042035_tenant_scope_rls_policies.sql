create or replace function app_private.is_tenant_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_organization_id is not null
    and exists (
      select 1
      from public.organization_member
      where organization_member.organization_id = target_organization_id
        and organization_member.clerk_user_id = nullif(
          coalesce(
            auth.jwt() -> 'app_metadata' ->> 'clerk_user_id',
            auth.jwt() ->> 'sub'
          ),
          ''
        )
    );
$$;

comment on function app_private.is_tenant_member(uuid) is
  'Tenant RLS helper. Uses signed JWT app_metadata.clerk_user_id or sub and public.organization_member; does not use end-user editable metadata.';

grant usage on schema app_private to authenticated, service_role;
revoke all on function app_private.is_tenant_member(uuid) from public;
grant execute on function app_private.is_tenant_member(uuid) to authenticated, service_role;

create or replace function app_private.recreate_tenant_scope_policies(
  table_name text,
  scope_column text,
  allow_writes boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  execute format('drop policy if exists tenant_scope_select on public.%I', table_name);
  execute format(
    'create policy tenant_scope_select on public.%I for select to authenticated using ((select app_private.is_tenant_member(%I)))',
    table_name,
    scope_column
  );

  execute format('drop policy if exists tenant_scope_insert on public.%I', table_name);
  execute format('drop policy if exists tenant_scope_update on public.%I', table_name);
  execute format('drop policy if exists tenant_scope_delete on public.%I', table_name);

  if allow_writes then
    execute format(
      'create policy tenant_scope_insert on public.%I for insert to authenticated with check ((select app_private.is_tenant_member(%I)))',
      table_name,
      scope_column
    );

    execute format(
      'create policy tenant_scope_update on public.%I for update to authenticated using ((select app_private.is_tenant_member(%I))) with check ((select app_private.is_tenant_member(%I)))',
      table_name,
      scope_column,
      scope_column
    );

    execute format(
      'create policy tenant_scope_delete on public.%I for delete to authenticated using ((select app_private.is_tenant_member(%I)))',
      table_name,
      scope_column
    );
  end if;
end;
$$;

select app_private.recreate_tenant_scope_policies('organization', 'id', false);
select app_private.recreate_tenant_scope_policies('organization_member', 'organization_id', false);
select app_private.recreate_tenant_scope_policies('integration_installation', 'organization_id', false);
select app_private.recreate_tenant_scope_policies('sync_cursor', 'organization_id', false);
select app_private.recreate_tenant_scope_policies('sync_job', 'organization_id', false);
select app_private.recreate_tenant_scope_policies('audit_event', 'organization_id', false);

select app_private.recreate_tenant_scope_policies('field_mapping', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('account', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('account_identity', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('contact', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('activity', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('territory_boundary', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('territory_marker', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('order_record', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('change_request', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('change_request_attachment', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('mapping_rule', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('opportunity', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('reorder_signal', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('email_template', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('social_account', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('campaign', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('social_post', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('social_thread', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('alert_rule', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('alert_instance', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('identity_resolution', 'organization_id', true);
select app_private.recreate_tenant_scope_policies('dashboard_definition', 'organization_id', true);

drop function app_private.recreate_tenant_scope_policies(text, text, boolean);
