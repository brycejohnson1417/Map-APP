# ADR 0009: RLS pattern with Clerk and Supabase

## Status
Accepted

## Context
Tenant isolation cannot depend only on route code. Database tables that may ever be exposed to a client need a defense-in-depth boundary.

## Decision
Use `organization_id` as the primary tenant boundary, enforce access through Row Level Security on exposed schemas, and keep privileged write paths behind trusted server-side services.

Current browser exposure inventory:
- `lib/supabase/client.ts` is the only browser Supabase client helper.
- No committed `app/`, `components/`, or runtime `lib/` source may import `@/lib/supabase/client`, call `getSupabaseBrowserClient()`, or import `@supabase/supabase-js` from a browser-reachable module.
- `npm run check:browser-supabase-boundary` enforces that inventory and runs inside `npm run verify`.

Direct browser tenant-table access remains blocked until a migration commits explicit policies and verification for the table set being exposed.

Expected auth and membership model for any future browser-accessible tenant table:
- the browser Supabase session must carry a stable external user id claim that maps to `public.organization_member.clerk_user_id`
- tenant table policies must allow reads or writes only when `organization_id` matches an active `public.organization_member.organization_id` row for the JWT user
- role-specific writes must check `public.organization_member.role` instead of relying on route-level UI hiding
- cross-tenant administrative views must use a separate documented policy path and tests, not a broad service-role bypass in client code

Migration `20260601042035_tenant_scope_rls_policies.sql` adds the first defense-in-depth tenant policies:
- `app_private.is_tenant_member(uuid)` maps signed JWT `app_metadata.clerk_user_id`, falling back to signed `sub`, to `public.organization_member.clerk_user_id`
- `public.organization` is tenant-scoped through `id`; other tenant tables use `organization_id`
- `organization`, `organization_member`, `integration_installation`, `sync_cursor`, `sync_job`, and `audit_event` are tenant-readable only
- `public.integration_secret` and `app_private.integration_secret` remain service-role-only with no tenant JWT policies
- the migration does not grant Data API table privileges, enable `force row level security`, or convert server routes away from service-role clients

## Rationale
Middleware alone is not sufficient for tenant isolation. The database must defend the boundary even when application code is wrong.

## Consequences
- exposed tenant tables require RLS policies
- policy design must document the expected JWT claim shape and membership lookup path
- service-role operations are limited to trusted backend services and migration tooling
- cross-organization admin views require explicit support, not broad bypasses

## Alternatives considered
- Middleware-only tenant filtering: rejected because a missed filter can leak data.
- Service-role access from browser/client code: rejected because it bypasses tenant isolation.
- Disable RLS until later: rejected for exposed tenant tables, though current direct browser policies are still pending.

## Follow-up checks
- RLS must be enabled on tenant-facing tables.
- Direct browser Supabase access requires policies before release.
- Server routes using service-role access must resolve and apply one tenant organization id.
- Browser Supabase imports must keep passing `npm run check:browser-supabase-boundary` until explicit policies and browser cross-tenant tests are committed.
