# Screenprinting Tenant Type

## Tenant type scope

Tenant type: `Screenprinting`

This Tenant type applies to screenprinting, custom apparel, and decorated-goods businesses that use Printavo or similar order systems plus Instagram and other social channels to manage demand, customers, repeat orders, and sales follow-up.

FraterniTees is the first pilot tenant for this type. Other screenprinting businesses with similar workflows should be able to start from the same type because the pain points are materially similar: Printavo-backed orders, messy customer/account data, repeat order opportunities, social account monitoring, and team performance reporting.

## Tenant-specific scope

Tenant-specific docs for FraterniTees live under `docs/tenants/fraternitees/`. Those docs may define FraterniTees-only settings, field mappings, pilot scope, credentials, dirty-data exceptions, and rollout decisions. They must not redefine what all Screenprinting tenants get by default.

## Product intent

The Screenprinting tenant type is a configurable operating layer over:

- Printavo order, customer, contact, quote, invoice, status, tag, and payment data
- owned and watched social accounts
- repeat-order cycles
- sales follow-up
- social follow-up
- customer and organization identity resolution
- dashboards and saved views

The first product slice should make the Screenprinting Sales and Screenprinting Social capabilities available without making the app a FraterniTees-only build.

Authoritative starting docs:

1. [PRODUCT_SPEC.md](PRODUCT_SPEC.md)
2. [FULL_IMPLEMENTATION_HANDOFF.md](FULL_IMPLEMENTATION_HANDOFF.md)

The other files in this folder are focused references for configuration, Sales, Social, identity, integrations, data security, feature coverage, and implementation gaps.

## Default module family

Screenprinting tenants should be able to enable these modules over time:

| Module | Default status | Purpose |
|---|---|---|
| Sales | Required | Read-only Printavo cockpit for orders, accounts, opportunities, reorders, draft follow-up, and dashboards |
| Social | Required | Owned/watched account monitor, content calendar, social alerts, comments/replies, and customer/account linking |
| Map | Optional | Territory, account coverage, and route planning when location data is useful |
| Catalog Costs | Future | Tenant-selected catalog adapters for blank costs, vendor availability, and profitability |
| Art | Future | Assets, proofs, licensing, and art workflow |
| Warehouse | Future | Inventory, SKU rules, fulfillment, and production handoff |

## Defaults vs tenant decisions

The tenant type provides defaults. The tenant decides the working rules.

Examples:

- the type defines that order statuses must be mapped
- the tenant decides which Printavo statuses count as quoted, in production, completed, cancelled, paid, unpaid, stale, or dirty
- the type defines owned and watched social accounts
- the tenant decides which accounts are owned, watched, ignored, high priority, competitor, school, team, athlete, influencer, media, or customer
- the type defines reorder cycles
- the tenant decides which cycles matter and which are high value
- the type defines dashboard primitives
- the tenant decides which widgets appear by role and which saved views matter

## Non-goals

- Do not write back to Printavo in the first Screenprinting MVP.
- Do not require live publishing in the first Social MVP.
- Do not make generative AI content a core dependency.
- Do not hardcode FraterniTees categories as universal screenprinting categories.
- Do not assume every tenant has clean tags, clean statuses, or clean customer names.

## Acceptance bar

The Screenprinting type is healthy when a second screenprinting business can onboard by connecting its systems and configuring mappings instead of requiring a forked app.
