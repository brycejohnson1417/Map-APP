# Screenprinting Implementation Gaps

## Tenant type status

The Screenprinting tenant type is defined as a product and architecture contract. FraterniTees is the first tenant-specific pilot.

Tenant-specific delivery can proceed before every advanced capability exists, but the implementation should keep these gaps explicit so the first pilot does not become a hidden one-off.

## Open implementation gaps

| Area | Gap | First safe path |
|---|---|---|
| Printavo write-back | Source-system write-back can damage tenant source data | stay read-only until a tenant-approved write workflow exists |
| Customer merge suggestions | Needs scoring rules and human review workflow | non-destructive identity links with confidence and reject states |
| Instagram messages | API access may be limited | support manual logging and linking where API access is incomplete |
| Non-owned tracked accounts | API access varies by platform and account type | support API-backed and manual imports |
| Publishing | Live publishing is useful but not required for MVP | monitor plus calendar first, publishing behind feature flag later |
| Comments/replies | Requires permissions and account ownership | enable for owned accounts only when permissions are active |
| Dashboard builder | Ultimate customization is required, but full builder is larger than MVP | start with configurable widget library and saved views |
| Dirty tags/statuses | Every tenant may be messy differently | admin mapping preview and data health review |
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

1. Tenant type manifest and documentation.
2. FraterniTees tenant docs and workspace tenant type declaration.
3. Read-only Printavo foundation.
4. Admin mapping UX for statuses, tags, fields, categories, and dirty data.
5. Account/customer identity review.
6. Reorder follow-up with draft-only email templates.
7. Social account registry and manual/API import.
8. Social calendar and alerts.
9. Comments/replies and message linking where permissions allow.
10. Future publishing, catalog costs, profitability, Art, and Warehouse capabilities.
