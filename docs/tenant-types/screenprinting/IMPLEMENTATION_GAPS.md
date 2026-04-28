# Screenprinting Implementation Gaps

## Tenant type status

The Screenprinting tenant type is defined as a product and architecture contract. FraterniTees is the first tenant-specific pilot.

Tenant-specific delivery can proceed before every advanced capability exists, but the implementation should keep these gaps explicit so the first pilot does not become a hidden one-off.

## Open implementation gaps

| Area | Gap | First safe path |
|---|---|---|
| Printavo write-back | Source-system write-back can damage tenant source data | stay read-only until a tenant-approved write workflow exists |
| Customer merge suggestions | MVP suggestion/review API exists; deeper scoring and UI review workflows need tenant feedback | keep non-destructive identity links with confidence and reject states |
| Instagram messages | API access may be limited | support manual logging and linking where API access is incomplete |
| Non-owned tracked accounts | Manual import exists; provider APIs vary by platform and account type | support API-backed and manual imports |
| Publishing | Live publishing is useful but not required for MVP | monitor plus calendar first, publishing behind feature flag later |
| Comments/replies | API route is permission-gated; live provider write-back remains disabled | enable for owned accounts only when permissions are active |
| Dashboard builder | Dashboard definitions exist; full drag/drop builder is larger than MVP | start with configurable widget library and saved views |
| Dirty tags/statuses | Config and preview exist; tenant must still confirm mappings | admin mapping preview and data health review |
| Profitability | Requires reliable order line item and catalog cost mapping | defer reporting, define adapter boundary now |
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
5. Future publishing, catalog costs, profitability, Art, and Warehouse capabilities remain planned/future.
