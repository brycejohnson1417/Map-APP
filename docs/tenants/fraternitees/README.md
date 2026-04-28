# FraterniTees Tenant Docs

## Tenant identity

Tenant: FraterniTees

Tenant type: `Screenprinting`

Tenant type docs: `docs/tenant-types/screenprinting/`

Tenant-specific docs in this folder describe FraterniTees-only rollout choices, data exceptions, pilot scope, and acceptance checks. They should not redefine the universal Screenprinting tenant type contract.

## Current pilot stance

FraterniTees should be the first Screenprinting tenant, not a one-off app.

Current safe stance:

- Printavo is read-only.
- Email follow-up is draft-only.
- Profitability and catalog costs wait until the order/customer foundation is stable.
- Social publishing is not required for MVP.
- Social monitoring plus calendar is enough first.
- Comments/replies should be available for owned accounts when permissions allow.
- Instagram messages should be mapped to customers and organizations when API access allows, with manual logging as fallback.

## Tenant-specific decisions to keep here

Use this folder for:

- confirmed Printavo status mappings
- confirmed Printavo tag mappings
- dirty Printavo fields and reporting exclusions
- FraterniTees customer categories
- FraterniTees reorder cycles
- FraterniTees owned and watched social accounts
- FraterniTees social alert thresholds
- FraterniTees email templates
- FraterniTees dashboard choices
- FraterniTees rollout notes and acceptance checks

Universal Screenprinting rules belong in `docs/tenant-types/screenprinting/`.

## Current tenant docs

- `PILOT_SCOPE.md` - FraterniTees-first implementation scope.
- `DATA_DECISIONS.md` - decisions that must be made from FraterniTees data and admin review.
