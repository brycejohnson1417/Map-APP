do $$
begin
  if to_regclass('public.runtime_sync_cursor_view') is not null then
    alter view public.runtime_sync_cursor_view set (security_invoker = true);
    revoke all on table public.runtime_sync_cursor_view from anon, authenticated;

    comment on view public.runtime_sync_cursor_view is
      'Legacy runtime view retained as production drift; security_invoker preserves caller RLS and public grants are revoked.';
  end if;

  if to_regprocedure('public.set_updated_at()') is not null then
    alter function public.set_updated_at() set search_path = public, pg_temp;
  end if;
end
$$;
