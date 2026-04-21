# ADR 0009: RLS pattern with Clerk and Supabase

## Status
Accepted

## Decision
Use `organization_id` as the primary tenant boundary, enforce access through Row Level Security on exposed schemas, and keep privileged write paths behind trusted server-side services.

## Rationale
Middleware alone is not sufficient for tenant isolation. The database must defend the boundary even when application code is wrong.

## Consequences
- exposed tenant tables require RLS policies
- policy design must document the expected JWT claim shape and membership lookup path
- service-role operations are limited to trusted backend services and migration tooling
- cross-organization admin views require explicit support, not broad bypasses
