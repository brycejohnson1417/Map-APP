# FraterniTees Data Decisions

## Tenant-specific scope

Tenant-specific docs record FraterniTees-only decisions. Universal Screenprinting behavior belongs in `docs/tenant-types/screenprinting/`.

This file is not a complete source of implementation input yet. It records current committed FraterniTees state plus decisions that must be collected through admin configuration before the new Sales/Social reports are treated as authoritative.

## Current committed FraterniTees state

| Area | Current value |
|---|---|
| Tenant type | `Screenprinting` |
| Tenant workspace manifest | `tenants/fraternitees/workspace.json` |
| Runtime organization slug | `fraternitees` |
| Allowed email domain | `fraternitees.com` |
| Required connector | Printavo |
| Printavo stance | Read-only preview/sync; no Printavo write-back |
| Default route | `/accounts` |
| Existing account module | Lead qualification/scoring engine |
| Existing account detail sections | score summary, identity/location, score trend, contacts, orders, activities |
| Existing map module | Lead map with no-address and DNC flags |
| Existing change requests | Enabled |
| Existing social module | Screenprinting Social MVP route/API implemented; tenant account lists still need admin confirmation |
| Existing Sales/Social admin mappings | Safe defaults committed; tenant confirmation still pending before reports are authoritative |

## Current committed scoring config

The current workspace config contains `scoring.fraterniteesLeadV1`:

| Config area | Current value |
|---|---|
| Weights | close rate `36`, order count `18`, consistency `12`, revenue `18`, recent revenue `8`, recency `8` |
| Revenue caps | lifetime/revenue target `12000`, recent revenue target `12000`, order count target `12`, consistency months target `8` |
| Penalties | lost order `6`, max lost order penalty `24`, hard loss `4`, max hard loss penalty `12`, volatility `8` |
| Grade thresholds | A+ `90`, A `82`, B `72`, C `58`, D `45` |
| A+ guard | close rate at least `0.8`, closed orders at least `5`, lost orders at most `1` |
| A guard | close rate at least `0.65`, closed orders at least `3` |
| DNC rule | lost orders threshold `3`, cooldown years `2` |
| High-ticket rule | threshold `6000`, min close rate `0.35`, losses after high ticket `3` |
| Recency | hot `60` days, warm `120` days, cool `240` days; points hot `8`, warm `5`, cool `2` |
| Trend | current months `12`, comparison months `12` |

These settings are real committed FraterniTees decisions unless the tenant changes them through future admin configuration.

## Current committed geocoding exceptions

The workspace config treats these as unusable or suppressed address patterns for FraterniTees:

- pickup-style placeholder addresses
- `fraternitees`, `ftees`, `individual`, `individual shipping`, `delivery`, `split`, and similar shipping placeholders
- `1379 Ashley River Rd, Suite 100, Charleston, South Carolina 29407` suppressed as `fraternitees_hq_individual_shipments`
- missing address reason: `fraternitees_no_usable_shipping_address`

## Pending decisions before new Sales/Social reporting is authoritative

These values must be chosen by FraterniTees in the admin UI or recorded here after confirmation. Until then, implementation should use safe defaults, show dirty/unmapped warnings, and avoid presenting affected reports as fully authoritative.

The current workspace seed enables Screenprinting Sales, Social, social publishing, comments/replies, and messages for FraterniTees while leaving catalog costs and profitability disabled. Live Meta actions remain permission-gated until FraterniTees stores a Meta connector token, grants the required scopes, and maps owned Instagram account IDs.

| Decision | Owner in app | Required for | Current status |
|---|---|---|---|
| Which Printavo statuses count as quoted | tenant admin | quote reporting and opportunities | pending |
| Which Printavo statuses count as in production | tenant admin | production reporting | pending |
| Which Printavo statuses count as completed | tenant admin | revenue, reorders, customer history | pending |
| Which Printavo statuses count as cancelled/lost | tenant admin | lost reporting, score/DNC behavior | pending |
| Which Printavo statuses are ignored or dirty | tenant admin | report trust | pending |
| Which payment states count as paid/unpaid | tenant admin | payment dashboards | pending |
| Which Printavo tags map to customer categories | tenant admin | category filters and dashboards | pending |
| Which Printavo tags map to teams/reps | tenant admin | ownership and team filters | pending |
| Which fields are dirty enough to exclude from reporting | tenant admin | data quality warnings | pending |
| Which reorder cycles matter | tenant admin or sales lead | reorder signals | pending |
| Which cycles are high value | tenant admin or sales lead | reorder prioritization | pending |
| Who owns sales follow-up | tenant admin | tasks, opportunities, reorder follow-up | pending |
| Who owns social follow-up | tenant admin | alerts and threads | pending |
| Which Instagram/social accounts are owned | social admin | owned account registry | pending |
| Which Instagram/social accounts are watched | social admin | watched account registry | pending |
| Which social alerts are actionable | social admin | alert rules | pending |
| Which dashboards each role sees | tenant admin | dashboard defaults | pending |

## Merge/link review requirements

FraterniTees needs non-destructive review flows for:

- duplicate customer/account candidates
- Printavo customer to account links
- Printavo contact to contact/account links
- Instagram/social account to customer/organization links
- message/comment/manual thread to contact/customer/org links
- social campaign to sales opportunity links

All merge/link suggestions require suggested, confirmed, rejected, ignored, and needs-review states. Source records must not be destroyed in MVP.

## Documentation rule

When FraterniTees chooses a mapping, template, status, alert threshold, dashboard, owned account, watched account, or exception, record it here or in a narrower FraterniTees doc. If the same rule should apply to every Screenprinting tenant, move it to the tenant type docs instead.
