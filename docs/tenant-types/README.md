# Tenant Types

## Purpose

A Tenant type is the industry-level operating contract for a group of tenants that usually share tools, workflows, data problems, and reporting needs.

Tenant type docs sit between platform docs and Tenant-specific docs:

- platform docs define primitives, packages, adapters, runtime safety, and shared architecture
- tenant type docs define reusable industry behavior for all tenants of that type
- Tenant-specific docs define one tenant's setup, decisions, credentials, exceptions, rollout notes, and acceptance checks

FraterniTees is a `Screenprinting` tenant type. Another screenprinting business using similar Printavo and social workflows would also start from this tenant type. PICC is a `Cannabis Wholesale` tenant type and must not inherit Printavo, Instagram, screenprinting reorder, or screenprinting social defaults.

## Current tenant types

| Tenant type | Manifest | Universal docs | Current tenants |
|---|---|---|---|
| Screenprinting | `tenant-types/screenprinting/type.json` | `docs/tenant-types/screenprinting/` | FraterniTees |
| Cannabis Wholesale | `tenant-types/cannabis-wholesale/type.json` | `docs/tenant-types/cannabis-wholesale/` | PICC New York |

JSON schema and inheritance rules are defined in [SCHEMA.md](SCHEMA.md).

## Documentation boundary

Tenant type docs should answer:

- which workflows every tenant of this type can expect
- which adapters are standard for the type
- which configuration surfaces must be tenant-editable
- which stable primitives the type uses
- which data quality problems the type expects
- which security and isolation rules apply to the type

Tenant-specific docs should answer:

- what this individual tenant decided
- which credentials, field mappings, and dirty-data exceptions apply only to this tenant
- what has been tested for this tenant
- what is still pending before that tenant can rely on a feature

Do not put FraterniTees-only rules in the universal Screenprinting docs. Do not put PICC-only rules in the universal Cannabis Wholesale docs. If a second tenant in the same industry should inherit the behavior by default, it belongs in the tenant type docs.

## Configuration philosophy

The product should give tenants maximum flexibility through configuration while preserving stable internal primitives. Every customer should feel like they have a workspace shaped around their business, but the app should not become a separate custom app per customer.

That means tenant type defaults should be configurable through admin UX:

- fields
- status mappings
- tag mappings
- dashboard widgets
- owned and watched accounts
- alert thresholds
- role ownership
- feature flags
- plugin capabilities
- integration adapters

The stable primitive layer should remain consistent:

- organization
- account
- account identity
- contact
- order
- activity
- campaign
- alert
- dashboard
- mapping rule
- custom field

## Security rule

Every tenant type must preserve tenant isolation. Runtime data must be scoped by `organization_id`, provider credentials must be tenant-scoped, and tenant type defaults must never create a shared data path between tenants.
