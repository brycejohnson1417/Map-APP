# Legacy Runtime RLS Fix

## Issue

- GitHub: https://github.com/brycejohnson1417/Map-APP/issues/252
- Supabase project: `qreegfarlwbzyeliirtw`

## Problem

Supabase Security Advisor reported `rls_disabled_in_public` for legacy `public.runtime_*` tables that exist in production but are no longer part of the current canonical migration path.

Read-only production catalog checks showed RLS disabled on:

- `public.runtime_account`
- `public.runtime_account_identity`
- `public.runtime_audit_event`
- `public.runtime_sync_cursor`
- `public.runtime_user`
- `public.runtime_workspace`

Repo search found no current code references to those legacy tables. Five of the six tables were empty; `runtime_workspace` contained one legacy row.

## Fix

Added `20260603033021_enable_rls_on_legacy_runtime_tables.sql`.

The migration:

- enables RLS only when each legacy table exists
- revokes direct `anon` and `authenticated` table privileges
- creates no public policies, making the legacy tables service-role only
- avoids dropping or migrating data

Added `20260603033126_harden_legacy_runtime_view.sql`.

The migration:

- sets the legacy `public.runtime_sync_cursor_view` to `security_invoker`
- revokes direct `anon` and `authenticated` privileges on that view
- pins `public.set_updated_at()` to `search_path = public, pg_temp`

## Out Of Scope

- Dropping legacy tables
- Migrating or backfilling data
- Merging PR #246's broader tenant-scope policy work
- Enabling `force row level security`
- Converting route handlers away from service-role clients

## Validation

- Production pre-check: read-only `pg_class` query showed all six legacy runtime tables had `relrowsecurity = false`.
- Production pre-check: repo search found no current code references to the legacy tables or `runtime_sync_cursor_view`.
- Production pre-check: row-count query showed `runtime_account`, `runtime_account_identity`, `runtime_audit_event`, `runtime_sync_cursor`, and `runtime_user` were empty; `runtime_workspace` contained one legacy row.
- Production migration: Supabase migration `20260603033021_enable_rls_on_legacy_runtime_tables` applied successfully.
- Production migration: Supabase migration `20260603033126_harden_legacy_runtime_view` applied successfully.
- Production post-check: read-only `pg_class` query showed all six legacy runtime tables have `relrowsecurity = true`.
- Production post-check: `information_schema.role_table_grants` showed no remaining `anon` or `authenticated` privileges on the six legacy tables.
- Production post-check: `pg_policies` showed no public policies on the six legacy tables.
- Production post-check: `runtime_sync_cursor_view` has `security_invoker=true`.
- Production post-check: `public.set_updated_at()` has `search_path=public, pg_temp`.
- Production post-check: Supabase Security Advisor no longer reports `rls_disabled_in_public`, `security_definer_view`, or `function_search_path_mutable`.
- Local validation: `supabase db start` applied all migrations successfully.
- Local validation: `supabase db reset --local --no-seed` passed.
- Local validation: `supabase db advisors --local` reported no issues.
- Local validation: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run verify` passed.

Remaining advisor context:

- Production still reports `rls_enabled_no_policy` INFO notices for current canonical tables and the now-locked legacy tables. Those are informational deny-by-default notices, not the original public-table exposure. The broader canonical tenant-policy work remains tracked separately in PR #246.
