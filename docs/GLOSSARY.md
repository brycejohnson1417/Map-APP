# Glossary

## Purpose

This file pins down platform language used across product requirements, architecture docs, tenant type docs, tenant-specific docs, APIs, and database work.

Use these terms exactly. If a new concept is needed, add it here before spreading a second name through the repo.

## Terms

| Term | Definition | Do not use as a synonym for |
|---|---|---|
| Product | The Map App Harness platform: one multi-tenant operating system for industry-specific workflows. | PICC, FraterniTees, any single tenant |
| Tenant | A customer/business using the product. A tenant owns its data, settings, credentials, users, dashboards, and workflow decisions. | organization table row only, workspace definition |
| Organization | The runtime database record in `public.organization` that scopes tenant data by `organization_id`. | tenant type, workspace manifest |
| Tenant workspace | A compiled runtime experience for one tenant. It is produced from a tenant workspace manifest plus organization-level overrides. | tenant type |
| Workspace manifest | A committed JSON file under `tenants/<slug>/workspace.json` that defines a tenant workspace seed: tenant type reference, branding, navigation, packages, connectors, modules, scoring, geocoding, onboarding, and change-request settings. | tenant type manifest |
| Tenant type | An industry-level product contract under `tenant-types/<type>/type.json` and `docs/tenant-types/<type>/`. FraterniTees uses `Screenprinting`; PICC uses `Cannabis Wholesale`. | tenant workspace, package, module |
| Tenant type manifest | The JSON file that declares a tenant type's stable primitives, default adapters, configuration surfaces, security boundaries, and docs. | tenant workspace manifest |
| Tenant-specific docs | Docs under `docs/tenants/<slug>/` that record decisions, exceptions, rollout notes, credentials policy, mappings, acceptance checks, and known dirty data for one tenant only. | tenant type docs |
| Primitive | A stable internal domain object or capability such as `account`, `order_record`, `social_account`, `opportunity`, `alert`, or `mapping_rule`. Primitives should be generic enough to support more than one tenant. | package, module, screen |
| Package | A reusable capability bundle declared by a package manifest, usually combining primitives, services, and UI surfaces. | module, route |
| Module | A user-facing functional area inside a tenant workspace, such as accounts, account detail, territory, integrations, sales, or social. | package, primitive |
| Adapter | Provider-specific code that translates an external system into product primitives, such as Printavo orders into `order_record` rows. | tenant-specific business logic |
| Connector | The product-facing integration contract exposed to tenants for credential setup, preview, sync, and health. | adapter implementation |
| Mapping rule | A tenant-scoped rule that turns provider-specific fields, tags, statuses, payment states, identities, or categories into internal primitives and reporting buckets. | hardcoded branch |
| Dirty data | Provider data that the tenant marks as untrusted, incomplete, inconsistent, duplicated, or excluded from reporting until reviewed. | deleted data |
| Read model | A query-optimized view or table derived from normalized primitives for runtime screens. | source of truth |
| Source payload | Raw or near-raw provider data kept for audit, debugging, and future remapping. | canonical product model |
| Saved view | A tenant-scoped set of filters, sorts, columns, date ranges, or dashboard widget choices. | database view |
| Feature flag | A tenant-scoped or global gate that controls whether a module, action, plugin, or risky capability is available. | permission |
| Plugin capability | A configurable product capability that can be enabled/disabled per tenant without forking the app. | third-party browser plugin |
| Tenant isolation | The requirement that tenant data, credentials, settings, dashboards, jobs, social links, alerts, and mappings cannot leak across tenants. The primary database boundary is `organization_id`. | UI-only filtering |
| Service-role path | A trusted server-side path using Supabase service-role credentials. Use only in backend routes, jobs, CLI, and migrations. | browser/client access |
| RLS | Row Level Security in Supabase/Postgres. RLS is enabled on exposed tenant tables; browser-accessible policies must be added before direct client reads/writes are allowed. | application authorization |

## Naming Rules

- Use `tenant type`, not legacy wording.
- Use `tenant workspace` when describing one tenant's compiled runtime experience.
- Use `organization` only when referring to the runtime database row or `organization_id` boundary.
- Use `primitive` for stable internal data/capability contracts.
- Use `module` for user-facing work areas.
- Use `package` for reusable bundles wired by package manifests.
