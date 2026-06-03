do $$
declare
  legacy_table text;
begin
  foreach legacy_table in array array[
    'runtime_account',
    'runtime_account_identity',
    'runtime_audit_event',
    'runtime_sync_cursor',
    'runtime_user',
    'runtime_workspace'
  ]
  loop
    if to_regclass(format('public.%I', legacy_table)) is not null then
      execute format('alter table public.%I enable row level security', legacy_table);
      execute format('revoke all on table public.%I from anon, authenticated', legacy_table);
      execute format(
        'comment on table public.%I is %L',
        legacy_table,
        'Legacy runtime table retained as production drift; RLS is enabled with no public tenant policies so access remains service-role only.'
      );
    end if;
  end loop;
end
$$;
