# Screenprinting Feature Coverage

## Tenant type scope

Tenant type: `Screenprinting`

This document is self-contained. It does not rely on outside screenshots, transcripts, videos, or competitor product names.

Tenant-specific docs can decide which defaults FraterniTees uses first, but every capability below should be available to any Screenprinting tenant through configuration, feature flags, or future staged enablement.

## Coverage rule

The Screenprinting tenant type must cover two operating areas:

1. Sales operations for Printavo-backed orders, customers, opportunities, repeat orders, drafts, and reporting.
2. Social operations for owned/watched accounts, social monitoring, calendar planning, alerts, comments/messages, campaigns, and links back to customers and opportunities.

No meaningful capability in this list should be silently dropped. If a capability is deferred, document the deferral in `IMPLEMENTATION_GAPS.md` and `docs/TODO.md`.

## Sales coverage checklist

| Capability | Required for MVP | Tenant-configurable | Notes |
|---|---:|---:|---|
| Read-only Printavo connection | yes | yes | Tenant provides credentials and sync settings. |
| Order sync | yes | yes | Pull order IDs, source links, statuses, tags, totals, dates, contacts, and line items where available. |
| Customer/contact sync | yes | yes | Preserve source IDs and raw/source metadata. |
| Status mapping | yes | yes | Tenant maps statuses to quoted, production, completed, cancelled, lost, ignored, dirty, paid, unpaid, or custom buckets. |
| Tag mapping | yes | yes | Tenant maps tags to categories, teams, reps, exclusions, dirty fields, or custom labels. |
| Dirty-data review | yes | yes | Tenant decides which fields are trusted before reporting is authoritative. |
| Sales dashboard | yes | yes | Revenue, order count, average order value, repeat revenue, due reorders, and configurable date filters. |
| Manager/rep/team filters | yes | yes | Tenant decides ownership mapping. |
| Orders page | yes | yes | Search, filters, saved views, production/customer dates, payment state, status, sync state. |
| Order detail | yes | yes | Show source link, source timestamps, totals, line items, customer/contact, status, and owner. |
| Account/customer directory | yes | yes | Categories, linked orders, linked social accounts, cleanup state, owner, and notes. |
| Customer cleanup queue | yes | yes | Duplicates, missing fields, dirty fields, unlinked orders, and identity suggestions. |
| Non-destructive merge/link suggestions | yes | yes | Suggested, confirmed, rejected, ignored, needs_review states. |
| Opportunities | yes | yes | Configurable pipelines, stages, owner, value, source, account, order, campaign links. |
| Reorder detection | yes | yes | Tenant-defined anniversary, seasonal, event, and high-value windows. |
| Reorder buckets | yes | yes | Due, overdue, upcoming, snoozed, converted, ignored. |
| Add reorder to opportunity | yes | yes | Links repeat-order signal to pipeline. |
| Snooze reorder | yes | yes | Tenant-defined snooze reasons and dates. |
| Draft follow-up email | yes | yes | Draft-only, editable templates, copy/open email client, mark sent manually. |
| Email templates by type | yes | yes | Reorder, quote follow-up, lost customer, stalled opportunity, social lead, custom. |
| Goals | staged | yes | Sales, order, online store, repeat-order, or tenant-defined goals. |
| Dashboard builder | staged | yes | Start with configurable widgets and saved views; expand to full custom builder. |
| Profitability | future | yes | Requires stable line item and catalog adapter foundation first. |
| Vendor catalog costs | future | yes | Adapter boundary for S&S, AlphaBroder, SanMar, or tenant feeds. |

## Social coverage checklist

| Capability | Required for MVP | Tenant-configurable | Notes |
|---|---:|---:|---|
| Social account registry | yes | yes | Tracks owned, watched, ignored, high-priority, customer, school, team, athlete, influencer, media, competitor, partner, or custom accounts. |
| Multiple owned accounts | yes | yes | Tenant decides ownership and permissions. |
| Multiple watched accounts | yes | yes | Tenant decides watched lists and categories. |
| API-backed account import | yes where available | yes | Use provider APIs when authorized and available. |
| Manual account import | yes | yes | Required for accounts/platforms without API access. |
| Social account-to-customer linking | yes | yes | Non-destructive identity links. |
| Social account-to-organization linking | yes | yes | Schools, teams, clubs, businesses, customers, and custom orgs. |
| Social dashboard | yes | yes | Account counts, alerts, recent posts, engagement, content workload, sync status. |
| Post/media monitoring | yes where available | yes | Posts, reels, stories, or platform equivalents when API/import supports them. |
| Post detail | staged | yes | Metrics, comments, source link, linked campaign/account/customer. |
| Content calendar | yes | yes | Planned posts, campaigns, owner, due date, status, assets, target accounts. |
| Campaign planning | yes | yes | Campaign goal, channels, accounts, customers/orgs, opportunities, and performance. |
| Social alerts | yes | yes | Tenant decides what is actionable, thresholds, recipients, severity, and cooldown. |
| New post alerts | yes | yes | For selected owned/watched/high-priority accounts. |
| Engagement spike alerts | yes | yes | Tenant-defined threshold or baseline-based threshold. |
| Comment alerts | yes where available | yes | Owned accounts and valid permissions. |
| Reply/comment workflow | staged | yes | Owned accounts only and permission-gated. |
| Message/thread mapping | yes where available | yes | API-backed when possible, manual logging fallback otherwise. |
| Manual social activity log | yes | yes | Allows linking messages/comments when API coverage is incomplete. |
| Social-to-sales linkage | yes | yes | Social account, post, thread, campaign, or alert can link to account/opportunity/reorder. |
| Publishing | future | yes | Behind feature flag, permission-gated, audited. Not required for MVP. |
| Multi-platform watchlist | staged | yes | Instagram first; add X/TikTok/etc through API or manual import as feasible. |

## Admin configuration coverage checklist

| Configuration area | Required for MVP | Notes |
|---|---:|---|
| Business profile | yes | Name, timezone, locations, terminology. |
| Branding | yes | Logo, colors, labels, email signature. |
| Users and roles | yes | Owner/admin, sales owner, social owner, viewer roles. |
| Printavo connection | yes | Credentials and read-only sync. |
| Status mapping | yes | Preview impact before save when feasible. |
| Tag mapping | yes | Preview impact before save when feasible. |
| Field trust/dirty-data settings | yes | Required before authoritative reporting. |
| Customer categories | yes | Tenant-defined categories and labels. |
| Sales ownership | yes | Who owns follow-up and opportunity work. |
| Social ownership | yes | Who owns social follow-up and alerts. |
| Reorder rules | yes | Tenant-defined cycles, windows, and high-value signals. |
| Email templates | yes | Draft-only templates by type. |
| Social account categories | yes | Owned/watched/category/priority/source. |
| Alert rules | yes | Threshold, scope, owner, severity, cooldown. |
| Dashboard preferences | staged | Widget library first; deeper builder later. |
| Feature flags | yes | Publishing, comments, messages, catalog costs, profitability, map, advanced reporting. |
| Plugin capabilities | staged | Tenant controls capabilities without custom app forks. |

## Security coverage checklist

| Security requirement | Required |
|---|---:|
| Every business row scoped by `organization_id` | yes |
| Tenant-scoped credentials only | yes |
| No generic provider fallback for tenant runtime | yes |
| Tenant-scoped sync cursors and jobs | yes |
| Tenant-scoped dashboards and saved views | yes |
| Tenant-scoped alerts and alert read state | yes |
| Tenant-scoped social account categories and links | yes |
| Tenant-scoped identity links | yes |
| Tenant-scoped manual imports | yes |
| Audit events for risky actions | yes |
| No destructive source-data merges in MVP | yes |

## Implementation completeness rule

A Screenprinting implementation is not complete unless:

- existing FraterniTees lead scoring, score trends, top-customer spend leaderboard, Printavo sync, account directory, account detail, map, and change-request capabilities remain available
- the tenant can configure how its Printavo data maps into the app
- the tenant can configure owned/watched social accounts
- the tenant can configure actionable alerts
- the tenant can configure draft email templates
- the tenant can use sales/order/customer/reorder surfaces without Printavo write-back
- the tenant can use social monitoring/calendar/campaign surfaces without live publishing
- customer/org/social identities can be linked non-destructively
- dashboards and saved views are tenant-scoped and configurable
- all tenant type and tenant-specific docs are updated
- `npm run verify` passes
