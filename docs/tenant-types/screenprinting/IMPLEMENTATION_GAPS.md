# Screenprinting Implementation Gaps

## Tenant type status

The Screenprinting tenant type is defined as a product and architecture contract. FraterniTees is the first tenant-specific pilot.

Tenant-specific delivery can proceed before every advanced capability exists, but the implementation should keep these gaps explicit so the first pilot does not become a hidden one-off.

## Open implementation gaps

| Area | Gap | First safe path |
|---|---|---|
| Printavo write-back | Source-system write-back can damage tenant source data | stay read-only until a tenant-approved write workflow exists |
| Customer merge suggestions | Non-destructive cleanup queues exist; deeper scoring and approval workflows need tenant feedback | keep non-destructive identity links with confidence and reject states |
| Instagram messages | API access requires owned-account Meta authorization and active conversations | support Meta send/reply routes where scopes exist, with manual logging and linking where API access is incomplete |
| Non-owned tracked accounts | Manual import exists; provider APIs vary by platform and account type | support watched/manual imports immediately and enrich only where provider APIs permit it |
| Publishing | Live publishing requires owned account IDs, public media URLs, Meta token/scopes, and tenant feature flag | publish through permission-gated Meta routes and keep calendar/drafts useful without provider write-back |
| Comments/replies | API write-back requires owned-account Meta authorization and comment IDs | enable for owned accounts only when permissions are active; keep manual comment/thread logging as fallback |
| Dashboard builder | Saved views and widget-library dashboards exist; full drag/drop builder is larger than MVP | keep dashboard definitions tenant-scoped and avoid layout rewrites until usage is clear |
| Dirty tags/statuses | Config and preview exist; tenant must still confirm mappings | admin mapping preview and data health review |
| Profitability | Needs reliable order line item and catalog cost mapping for authoritative reporting | use the current needs-review worksheet only; defer reporting until catalog adapters are ready |
| Catalog APIs | Providers vary by tenant | standard catalog adapter contract |
| Tenant type docs | Must stay universal | require tenant-specific docs for tenant-only decisions |

## Implementation guardrails

- Use stable primitives.
- Use tenant type defaults.
- Use tenant-specific overrides.
- Do not fork the app for FraterniTees.
- Do not hardcode Screenprinting assumptions into Cannabis Wholesale.
- Do not mix tenant credentials.
- Do not turn dirty data into authoritative reporting without a review state.

## Next Screenprinting build order

1. Apply the additive Screenprinting migration in the target Supabase environment before using product-owned writes.
2. Review FraterniTees mapping defaults in admin and mark tenant-confirmed decisions in tenant docs.
3. Expand the MVP `/screenprinting` route into deeper per-screen workflows after tenant feedback.
4. Add service-level edge-case tests for mapping, reorders, alerts, templates, and identity review.
5. Catalog costs, profitability, Art, and Warehouse capabilities remain planned/future.
