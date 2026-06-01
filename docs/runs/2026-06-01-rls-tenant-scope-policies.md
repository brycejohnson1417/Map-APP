# RLS Tenant Scope Policies

## Summary

Added defense-in-depth tenant-scope RLS policies for current public tenant tables without applying anything to production. The migration creates a private helper for resolving tenant organization ids from verified Supabase Auth JWT state, adds read policies for current public RLS tables, keeps server-owned log/queue tables read-only, and leaves secret tables service-role only.

## Scope

| Field | Value |
|---|---|
| Issue | `#219` |
| Lane | database / security |
| Tenant type | all |
| Tenant | all |
| Risk level | high |

## Changed Files

- `supabase/migrations/20260601022111_rls_tenant_scope_policies.sql`
- `scripts/check-rls-tenant-policies.mjs`
- `package.json`
- `scripts/verify.mjs`
- `docs/adr/0009-rls-pattern-with-clerk-and-supabase.md`
- `docs/DATA_MODEL.md`

## Commands Run

```bash
npm run check:rls-tenant-policies
supabase db start
supabase migration list --local
supabase db lint --local --schema public,app_private --fail-on error
supabase db query --local -o table "select schemaname, tablename, policyname, cmd from pg_policies where schemaname in ('public','app_private') order by schemaname, tablename, policyname;"
supabase db query --local -o table "select schemaname, tablename, policyname from pg_policies where tablename like '%secret%' order by schemaname, tablename, policyname;"
supabase db query --local -o table "select n.nspname as schema, p.proname as function_name, p.prosecdef as security_definer from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app_private' and p.proname = 'current_tenant_organization_ids';"
npm run lint
npm run typecheck
```

## Results

| Check | Result | Notes |
|---|---|---|
| RED policy check | fail before migration | Missing helper and tenant policies |
| Static policy check | pass | 29 public RLS tables covered |
| Local migration apply | pass | Applied through local Supabase Docker database only |
| Local migration list | pass | `20260601022111` present locally |
| Local schema lint | pass | `public,app_private` only; full lint still reports extension-owned PostGIS issues |
| Policy inventory | pass | `audit_event`, `sync_job`, `sync_cursor`, `integration_installation`, `organization`, and `organization_member` are select-only |
| Secret policy inventory | pass | No `integration_secret` tenant JWT policies |
| Helper inventory | pass | `app_private.current_tenant_organization_ids` exists and is `security definer` |
| Lint/typecheck | pass | `npm run lint`; `npm run typecheck` |

## Safety Notes

- No production migration was applied.
- No Supabase remote write was performed.
- No outbound emails were sent.
- No Nabis or Printavo mutations or sync actions were triggered.
- The local Supabase Docker database was started only to apply local migrations and inspect local policy metadata.

## Acceptance Criteria

- [x] Add tenant policies generated from current migrations, not a copied table list.
- [x] Scope `public.organization` by `id`.
- [x] Scope ordinary tenant tables by `organization_id`.
- [x] Keep `audit_event` tenant-readable but not tenant-insertable.
- [x] Keep secrets tables without tenant JWT access policies.
- [x] Document helper behavior and remaining route-conversion risk.

## Remaining Risk

- `force row level security` is still intentionally out of scope.
- Runtime routes still use trusted service-role paths; request/JWT route conversion is a follow-up.
- Policy permissions are tenant-boundary policies, not final role/permission granularity.
