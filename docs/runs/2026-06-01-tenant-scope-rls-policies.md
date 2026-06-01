# Tenant Scope RLS Policies

Date: 2026-06-01

Issue: https://github.com/brycejohnson1417/Map-APP/issues/219

Branch: `codex/219-tenant-scope-rls-policies`

## Scope

- Add an idempotent migration for tenant-scope RLS policies on current public tenant tables.
- Keep secrets tables service-role-only.
- Add repeatable static verification for the policy inventory.
- Validate the migration against a local Supabase database only.

## Out Of Scope

- Applying the migration to production.
- Enabling `force row level security`.
- Converting app routes from service-role clients to request/JWT Supabase clients.
- Granting Data API table privileges.
- Adding direct browser Supabase access.
- Provider writes, emails, or secret rotation.

## Policy Model

- `app_private.is_tenant_member(uuid)` maps a signed JWT `app_metadata.clerk_user_id`, falling back to signed `sub`, to `public.organization_member.clerk_user_id`.
- `public.organization` uses `id` as its tenant scope column.
- Public tenant tables with `organization_id` use that column for tenant checks.
- `organization`, `organization_member`, `integration_installation`, `sync_cursor`, `sync_job`, and `audit_event` are tenant-readable only.
- `public.integration_secret` and `app_private.integration_secret` receive no tenant JWT policies.

## Verification Added

- `scripts/check-rls-tenant-scope-policies.mjs`
- `npm run check:rls-tenant-scope-policies`
- `npm run verify` now includes the RLS policy inventory check.

## Validation

- RED: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" node scripts/check-rls-tenant-scope-policies.mjs` failed before the migration existed.
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:rls-tenant-scope-policies`
- `supabase db start`
- `supabase db reset --local --no-seed`
- `supabase db query --local -o csv "select schemaname, tablename, policyname, cmd from pg_policies where schemaname in ('public', 'app_private') order by schemaname, tablename, policyname;"`
- `supabase db query --local -o csv "select schemaname, tablename, policyname from pg_policies where tablename like '%secret%' order by schemaname, tablename, policyname;"`
- `supabase db query --local -o csv "select count(*) as policy_count from pg_policies where schemaname = 'public' and policyname like 'tenant_scope_%';"`
- `supabase db query --local` helper isolation DO block for two organizations and one signed Clerk user claim.
- `supabase db advisors --local`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run verify`
- `supabase stop`

## Notes

- Local `pg_policies` reported 94 public `tenant_scope_*` policies.
- Secret policy query returned no rows.
- Local helper isolation check passed with one visible tenant account for the signed test claim.
- `supabase db lint --local` exited 0 but reported existing PostGIS extension lint output unrelated to this migration.
- This is approval-lane work because it changes RLS/access-control migrations. Do not merge without explicit approval.
