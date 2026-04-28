# Screenprinting Product Spec

## Tenant type scope

Tenant type: `Screenprinting`

This is the canonical product spec for all tenants that use the Screenprinting tenant type. Tenant-specific docs may set values for one tenant, but they must not redefine the universal product contract.

## Product goal

Screenprinting tenants need one operating workspace for sales follow-up, repeat orders, order/customer cleanup, social monitoring, content planning, alerts, and customer/social identity linking.

The product should feel tenant-customized through configuration while keeping stable shared primitives underneath.

## What must stay true

- Printavo is read-only in MVP.
- Email is draft-only in MVP.
- Publishing is not required in MVP.
- Monitoring plus calendar planning is required in MVP.
- Comments/replies are available only for owned accounts when permissions allow.
- Manual import/logging exists whenever API access is incomplete.
- Customer/social/account links are non-destructive.
- Every business row is tenant-scoped by `organization_id`.
- Existing FraterniTees capabilities remain available while the UI/UX improves.

## Canonical detailed specs

| Area | Canonical file |
|---|---|
| Sales screens, states, actions, side effects, and acceptance criteria | [SALES_MODULE.md](SALES_MODULE.md) |
| Social screens, states, actions, side effects, and acceptance criteria | [SOCIAL_MODULE.md](SOCIAL_MODULE.md) |
| Feature coverage checklist | [FEATURE_COVERAGE.md](FEATURE_COVERAGE.md) |
| Identity and merge/link rules | [IDENTITY_RESOLUTION.md](IDENTITY_RESOLUTION.md) |
| Integration behavior | [INTEGRATIONS.md](INTEGRATIONS.md) |
| Data security rules | [DATA_SECURITY.md](DATA_SECURITY.md) |

## Required Sales capabilities

| Capability | Required in MVP | Configurable by tenant |
|---|---:|---:|
| Read-only Printavo sync | yes | yes |
| Sales dashboard | yes | yes |
| Orders list and detail | yes | yes |
| Status/payment/tag/field mapping | yes | yes |
| Dirty-data warnings and cleanup | yes | yes |
| Accounts/customer cleanup | yes | yes |
| Non-destructive merge/link suggestions | yes | yes |
| Opportunities | yes | yes |
| Reorder detection and buckets | yes | yes |
| Draft-only email follow-up | yes | yes |
| Editable email templates | yes | yes |
| Goals | staged | yes |
| Profitability | future | yes |
| Catalog cost adapters | future | yes |

## Required Social capabilities

| Capability | Required in MVP | Configurable by tenant |
|---|---:|---:|
| Owned social accounts | yes | yes |
| Watched social accounts | yes | yes |
| API-backed import where available | yes | yes |
| Manual account import | yes | yes |
| Social dashboard | yes | yes |
| Posts/media monitoring | yes where available | yes |
| Content calendar | yes | yes |
| Campaign planning | yes | yes |
| Alerts inbox | yes | yes |
| Alert rules and thresholds | yes | yes |
| Comments/replies for owned accounts | staged by permission | yes |
| Message/comment/manual-thread linking | yes | yes |
| Social-to-sales links | yes | yes |
| Publishing | future | yes |

## Screen inventory

| Module | Screen | Required user actions |
|---|---|---|
| Sales | Dashboard | Change date range, filter owner/team/category, open related orders, save dashboard view. |
| Sales | Orders | Search, filter, save view, open order detail, open provider source, create opportunity. |
| Sales | Order detail | Link account, add opportunity, create reorder signal, view line items/source metadata. |
| Sales | Accounts cleanup | Confirm/reject identity suggestions, link social account, preserve lead-score and top-customer views. |
| Sales | Opportunities | Create, move stage, assign owner, link account/order/reorder/social/campaign, mark won/lost/archive. |
| Sales | Reorders | Reach out with draft email, snooze, add opportunity, mark ignored/converted. |
| Sales | Email templates | Edit template, preview, render draft, copy/open email client, mark sent manually. |
| Sales | Goals | Set period, edit team/rep goals, save/reset. |
| Sales | Admin config | Map statuses/tags/fields, configure ownership, reorder cycles, dashboards, feature flags. |
| Social | Dashboard | Filter accounts/date, open alerts/posts/accounts, save dashboard preferences. |
| Social | Accounts registry | Scan, add manually, import, sync, categorize, prioritize, link to customer/org/contact. |
| Social | Account detail | Re-authorize, disconnect, sync/import, edit links/categories, open posts/calendar. |
| Social | Posts/media | Filter all/posts/reels/stories/planned, mark seen, open detail/source, link campaign/account/opportunity. |
| Social | Post detail | View metrics, comments, reply if allowed, link author/customer/campaign/opportunity. |
| Social | Alerts inbox | Filter, mark read, mark all read, assign, resolve, create opportunity. |
| Social | Alert rules | Create/edit thresholds, owner, severity, cooldown, scope, preview. |
| Social | Calendar | Plan posts, campaign milestones, owners, assets, status, dates. |
| Social | Campaigns | Create/edit/archive campaigns, link accounts/posts/opportunities, view outcomes. |
| Social | Conversations | Log manual thread, link customer/contact/opportunity/campaign, assign owner, close. |
| Social | Compose gate | Create planned posts; live publishing remains gated. |
| Social | Admin config | Configure social categories, ownership, alerts, replies/publishing flags, dashboards. |

## Configuration contract

Tenant admins must be able to configure:

- business profile and timezone
- branding labels
- users, roles, and follow-up owners
- Printavo credentials and sync settings
- status, payment, tag, and field mappings
- dirty-data exclusions
- customer/account categories
- reorder cycles and high-value windows
- email templates
- owned/watched social accounts
- social categories and priorities
- alert rules and thresholds
- dashboards, saved views, and role defaults
- feature flags and plugin capabilities

Risky mapping changes should show impact previews when feasible.

## Acceptance criteria

- A new Screenprinting tenant can connect Printavo read-only, configure mappings, and see orders/accounts/reorders without code edits.
- A tenant can add owned and watched social accounts through API scan or manual import.
- A tenant can configure social alerts and mark alerts read/resolved.
- A tenant can create planned calendar items and campaigns without live publishing.
- A tenant can link social accounts/posts/threads to customers, contacts, opportunities, and campaigns.
- A tenant can render draft-only email follow-up from editable templates.
- Existing FraterniTees lead scoring, score trends, account directory, account detail, map, top-customer leaderboard, Printavo sync, and change-request flow remain available.
- `npm run verify`, `npm run check:tenant-types`, and `npm run check:self-contained-requirements` pass.
