# Current Status

## Summary

Map App Harness is a working multi-tenant product, not just scaffolding. The immediate product work is to keep current tenants moving while converting repeated tenant behavior into reusable tenant type contracts, stable primitives, and admin-configurable settings.

For vocabulary, read [GLOSSARY.md](GLOSSARY.md).

## Live Surfaces

| Surface | Status | Notes |
|---|---|---|
| Tenant login and tenant routing | live | Uses tenant-session flow and workspace resolution. |
| Tenant-type-aware onboarding | live | Creates organizations from committed tenant workspace seeds. |
| Accounts directory | live | Shared account surface; FraterniTees has lead-scoring variant. |
| Account detail | live | Shared detail with tenant-configured sections. |
| Territory map | live | Runtime-backed map/list/detail experience. |
| Integrations and plugins | live | Tenant connector setup and plugin toggles exist. |
| Change requests | live | Tenant-scoped queue with screen-comment capture and attachments. |
| Runtime health and sync jobs | live | Supabase/runtime visibility routes exist. |
| FraterniTees Printavo onboarding/sync | live | Read-only Printavo preview/sync and daily sync controls exist. |
| FraterniTees lead scoring | live | Score, grade, DNC risk, score trend, and top-customer surfaces exist. |
| PICC wholesale workflows | live | Territory/accounts plus PPP savings and mock-order proposal workflows exist. |

## Planned Surfaces

| Surface | Status | Notes |
|---|---|---|
| Architecture runway | planned | Config schema foundation, adapter ports, feature flags, audit/activity hooks, boundary checks, and run reports before Screenprinting UI. |
| Autonomous work registry | live | `docs/WORK_REGISTRY.json` defines executable work items, dependencies, safe defaults, stop conditions, docs to update, and verification commands. |
| Canonical Screenprinting admin config | planned | Status/tag/field mapping, dirty-data trust, social account rules, alert rules, dashboards. |
| Screenprinting Sales module | planned | Read-only orders, opportunities, reorders, draft email templates, goals, dashboards. |
| Screenprinting Social module | planned | Owned/watched accounts, posts, calendar, campaigns, alerts, comments/messages/manual threads. |
| Identity resolution | planned | Non-destructive merge/link suggestions across Printavo, accounts, contacts, and social identities. |
| Dashboard builder | staged | Start with configurable widgets and saved views. |
| Catalog/profitability adapters | future | Wait until order/customer foundation is stable. |
| Art and warehouse modules | future | Preserve expansion path; not MVP. |

## Known Gaps

- RLS is enabled on tenant tables, but committed migrations do not yet define browser/client policies. Current runtime access uses trusted server/service-role paths.
- Screenprinting tenant admin UX is not complete.
- Architecture runway items are documented but not implemented yet.
- Work registry exists, but implementation items after the operating control plane still need to be executed and status-updated as work completes.
- Screenprinting additive tables for opportunities, social accounts, alerts, campaigns, identity resolution, and dashboards are not yet committed.
- FraterniTees tenant-specific mapping decisions are not fully recorded; current pending decisions are tracked in [docs/tenants/fraternitees/DATA_DECISIONS.md](tenants/fraternitees/DATA_DECISIONS.md).
- Some tenant behavior still lives in tenant-specific code paths and should move toward primitives, packages, workspace config, or tenant type defaults.

## Current Decision Benchmark

Choose the implementation that makes a future tenant more likely to:

- onboard without a code fork
- connect providers without founder involvement
- configure workflows safely
- understand dirty data before trusting reports
- request safe changes through the product
