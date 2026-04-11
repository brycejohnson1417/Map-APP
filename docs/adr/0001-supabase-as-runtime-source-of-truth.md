# ADR 0001: Supabase as runtime source of truth

## Status
Accepted

## Decision
Use Supabase Postgres as the operational source of truth for all user-facing reads and writes.

## Rationale
The platform needs multi-tenant data isolation, local-first performance, realtime collaboration options, background jobs, and a clear path to scale. External systems such as Notion and Nabis remain integrations, not runtime databases.

## Consequences
- User-facing screens read local Postgres models only.
- External provider sync becomes an explicit background concern.
- Tenant isolation and RLS can be enforced at the database layer.
