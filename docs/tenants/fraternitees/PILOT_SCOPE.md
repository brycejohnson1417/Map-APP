# FraterniTees Pilot Scope

## Tenant-specific scope

This document applies only to FraterniTees. Universal behavior for all Screenprinting tenants belongs under `docs/tenant-types/screenprinting/`.

FraterniTees is the first pilot tenant for the Screenprinting tenant type. The pilot should validate the tenant type without hardcoding FraterniTees-only workflow into shared platform code.

## MVP scope

| Area | FraterniTees pilot decision |
|---|---|
| Printavo | read-only sync and reporting |
| Orders | search, filters, status mapping, tag mapping, customer links, source deep links |
| Customers/orgs | directory, category assignment, cleanup queue, merge/link suggestions |
| Reorders | configurable repeat windows, due/overdue/upcoming buckets, snooze, add to opportunity |
| Email | draft-only, copy/open client, editable templates by follow-up type |
| Opportunities | lightweight pipeline with tenant-defined owner |
| Social accounts | owned and watched account registry, API scan where available, manual import where not |
| Social calendar | content planning and campaign tracking |
| Comments/replies | enabled for owned accounts when permissions allow |
| Instagram messages | link to customer/org where available; manual log fallback |
| Alerts | tenant-defined actionable alerts |
| Dashboards | configurable widget library and saved views |
| Profitability | deferred, with future catalog adapter boundary documented |

## Explicit non-goals for MVP

- no Printavo write-back
- no automatic email sending
- no required live social publishing
- no destructive customer merges
- no catalog-cost profitability claims until source matching is reliable
- no FraterniTees-only app fork
- no removal of the existing lead scoring engine, score trends, top-customer spend leaderboard, Printavo sync, account directory, account detail, map, or change-request flow

## Pilot success

The pilot succeeds when FraterniTees can:

1. connect Printavo and see read-only orders/customers reliably
2. configure statuses, tags, categories, and dirty-data exclusions
3. see repeat-order opportunities
4. draft follow-up emails from editable templates
5. maintain owned and watched Instagram accounts
6. plan social content in a calendar
7. link social accounts/messages/comments to customers or organizations
8. configure dashboards and alerts without code changes
9. leave behind reusable Screenprinting tenant type defaults for a second screenprinter
10. still access existing FraterniTees scoring, account, map, sync, and change-request capabilities after the UI/UX is improved
