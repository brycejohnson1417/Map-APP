# ADR 0009: RLS pattern with Clerk and Supabase

## Status
Accepted

## Context
Tenant isolation cannot depend only on route code. Database tables that may ever be exposed to a client need a defense-in-depth boundary.

## Decision
Use `organization_id` as the primary tenant boundary, enforce access through Row Level Security on exposed schemas, and keep privileged write paths behind trusted server-side services.

## Rationale
Middleware alone is not sufficient for tenant isolation. The database must defend the boundary even when application code is wrong.

## Consequences
- exposed tenant tables require RLS policies
- policy design must document the expected JWT claim shape and membership lookup path
- service-role operations are limited to trusted backend services and migration tooling
- cross-organization admin views require explicit support, not broad bypasses

## Current policy contract

Migration `20260601022111_rls_tenant_scope_policies.sql` adds the current defense-in-depth RLS policy layer.

Policies call `app_private.current_tenant_organization_ids()`, a `security definer` helper in the private schema. The helper resolves organization access from verified Supabase Auth JWT state:

- `auth.uid()` matched to `public.organization_member.clerk_user_id`
- `auth.jwt() ->> 'email'` matched to `public.organization_member.email`

The helper does not authorize from user-editable metadata. `public.organization` is scoped by `id`; ordinary tenant business tables are scoped by `organization_id`.

`public.audit_event`, `public.sync_job`, `public.sync_cursor`, `public.integration_installation`, `public.organization`, and `public.organization_member` are tenant-readable only. `public.integration_secret` remains service-role only and has no tenant JWT policies.

This policy layer does not enable `force row level security` and does not convert server routes away from service-role clients.

## Alternatives considered
- Middleware-only tenant filtering: rejected because a missed filter can leak data.
- Service-role access from browser/client code: rejected because it bypasses tenant isolation.
- Disable RLS until later: rejected for exposed tenant tables, though current direct browser policies are still pending.

## Follow-up checks
- RLS must be enabled on tenant-facing tables.
- Direct browser Supabase access requires policies before release.
- Server routes using service-role access must resolve and apply one tenant organization id.
- `npm run check:rls-tenant-policies` must pass when public RLS tables are added or policy coverage changes.
