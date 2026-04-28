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
| Screenprinting Sales/Social workspace | live | `/screenprinting?org=fraternitees` renders real FraterniTees Printavo-backed Sales metrics, order cockpit saved views, account cleanup queues, editable opportunities, reorder snoozing, draft-only email follow-up, manager goals, social monitoring, Meta/Instagram connection readiness, draft social composition, publishing/reply capability gates, campaign planning, manual social import/thread logging, and identity review. Fixtures are not used for real saved tenants. |
| Screenprinting API contracts | live | Additive routes exist under `/api/runtime/organizations/[slug]/screenprinting/*`; mutations require tenant-session access. |
| Screenprinting additive data foundation | committed | Migration adds mapping, opportunity, reorder, email template, social, campaign, alert, dashboard, and identity tables with `organization_id` and RLS enabled. |
| PICC wholesale workflows | live | Territory/accounts plus PPP savings and mock-order proposal workflows exist. |

## Planned Surfaces

| Surface | Status | Notes |
|---|---|---|
| Architecture runway | live | Config schema foundation, adapter ports, feature flags, audit/activity hooks, boundary checks, and run reports are implemented for Screenprinting. |
| Autonomous work registry | live | `docs/WORK_REGISTRY.json` defines executable work items, dependencies, safe defaults, stop conditions, docs to update, and verification commands. |
| Canonical Screenprinting admin config | live MVP | Status/tag/field mapping, dirty-data trust, social account rules, alert rules, dashboards. |
| Screenprinting Sales module | live MVP | Read-only orders, opportunities, reorders, draft email templates, goals, dashboards. |
| Screenprinting Social module | live MVP | Owned/watched accounts, Meta-owned account scan when credentials permit, watched account import, posts, calendar, campaigns, alerts, comments/messages/manual threads, publish/comment/message routes gated by Meta scopes and tenant flags. |
| Identity resolution | live MVP | Non-destructive merge/link suggestions across Printavo, accounts, contacts, and social identities. |
| Dashboard builder | live MVP | Tenant-scoped saved views and widget-library custom dashboards persist through `dashboard_definition`; drag/drop layout remains future. |
| Catalog/profitability adapters | future | Wait until order/customer foundation is stable. |
| Art and warehouse modules | future | Preserve expansion path; not MVP. |

## Known Gaps

- RLS is enabled on tenant tables, but committed migrations do not yet define browser/client policies. Current runtime access uses trusted server/service-role paths.
- Tenant role enforcement for admin-only Screenprinting config mutations is still tenant-session gated until role policy is finalized.
- Screenprinting UI now renders the requested operational Sales/Social surfaces, but deeper tenant-session E2E tests are still needed for authenticated mutations such as saved views, goals, draft social posts, manual social import, manual thread logging, campaign creation, alert updates, and identity approvals.
- Screenprinting additive migrations have been applied to live Supabase, including the Screenprinting foundation tables and Meta provider enum.
- Screenprinting acceptance coverage is fixture-backed, static/runtime-build verified, and browser-checked against FraterniTees live Printavo data; deeper service-level edge-case tests remain useful.
- FraterniTees tenant-specific mapping decisions are not fully recorded; current pending decisions are tracked in [docs/tenants/fraternitees/DATA_DECISIONS.md](tenants/fraternitees/DATA_DECISIONS.md).
- Some tenant behavior still lives in tenant-specific code paths and should move toward primitives, packages, workspace config, or tenant type defaults.

## Current Decision Benchmark

Choose the implementation that makes a future tenant more likely to:

- onboard without a code fork
- connect providers without founder involvement
- configure workflows safely
- understand dirty data before trusting reports
- request safe changes through the product
