# ADR 0001: Supabase as runtime source of truth

## Status
Accepted

## Context
User-facing routes need fast, tenant-scoped reads that are not dependent on live external-provider availability. Provider systems can be slow, rate-limited, incomplete, or dirty.

## Decision
Use Supabase Postgres as the operational source of truth for all user-facing reads and writes.

## Rationale
The platform needs multi-tenant data isolation, local-first performance, realtime collaboration options, background jobs, and a clear path to scale. External systems such as Notion and Nabis remain integrations, not runtime databases.

## Consequences
- User-facing screens read local Postgres models only.
- External provider sync becomes an explicit background concern.
- Tenant isolation and RLS can be enforced at the database layer.

## Alternatives considered
- Read directly from provider APIs at request time: rejected because it creates latency, outage, rate-limit, and dirty-data coupling.
- Keep Notion/CRM as runtime source of truth: rejected because it cannot enforce the product's tenant isolation, query, and read-model requirements.
- Use a separate database per tenant immediately: deferred because shared multi-tenant proves the product faster while keeping a dedicated escape hatch.

## Follow-up checks
- Every tenant business table must include `organization_id`.
- User-facing routes should read normalized runtime tables or read models.
- Direct browser/client access requires documented RLS policies before exposure.
