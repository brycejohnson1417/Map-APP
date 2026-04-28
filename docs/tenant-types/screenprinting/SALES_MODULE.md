# Screenprinting Sales Module

## Tenant type scope

Tenant type: `Screenprinting`

This module defines the universal sales operating surface for screenprinting businesses that use Printavo or a similar order system.

Tenant-specific differences belong in tenant workspace config, organization overrides, mapping rules, editable templates, dashboards, saved views, and tenant-specific docs.

## Product stance

- Printavo is read-only in the first implementation.
- Email is draft-only in the first implementation.
- Real saved tenants must never receive fake KPI fallback values. Sales screens must use tenant-scoped synced order data, persisted product data, or an explicit unavailable/empty/dirty-data state.
- Demo fixtures are allowed only for no-organization development paths and must be visibly labeled as demo data.
- Existing FraterniTees capabilities must remain available: Printavo onboarding/preview/sync, lead scoring, score trends, DNC risk behavior, top-customer leaderboard, account directory, account detail, map, and change requests.
- Tenant admins decide status mappings, tag mappings, dirty-data trust, ownership, reorder rules, email templates, dashboards, and feature flags.
- Stable internal primitives should remain generic even when the tenant-facing UI feels custom.

## Current FraterniTees implementation state

- The `/screenprinting?org=fraternitees` Sales workspace reads synced FraterniTees Printavo rows and currently reports live counts such as total orders, total customers, non-cancelled revenue, AOV, mapped status buckets, mapped payment buckets, manager attribution, top customers, and derived reorder signals.
- The Orders surface shows the exact synced order count, cockpit filters, persisted saved views, and latest rows from the tenant database, not sample rows.
- The order detail modal shows trusted order facts plus a needs-review profitability worksheet. It does not present estimated margin as synced actual cost.
- Opportunities can be created and updated in product-owned storage; derived Printavo opportunities remain labeled read-only until persisted.
- Reorder signals support draft email outreach, manual marked-sent audit activity, snoozing, and add-to-opportunity actions.
- Manager goals, order saved views, and custom dashboards persist through tenant-scoped `dashboard_definition` rows.
- Buttons must either call a tenant-scoped API, open a local workflow, copy/open a draft, or be disabled with an explicit reason.

## Required primitives

| Primitive | Purpose |
|---|---|
| `account` | Customer, organization, school, chapter, business, or buying group. |
| `contact` | Person linked to an account. |
| `order_record` | Read-only provider order mirror. |
| `activity` | Check-ins, draft email events, manual notes, social follow-up, reorder actions. |
| `opportunity` | Product-owned sales pipeline item. |
| `reorder_signal` | Product-owned repeat-order signal. |
| `mapping_rule` | Tenant-defined mapping for statuses, tags, fields, categories, payment states, and dirty data. |
| `identity_resolution` | Non-destructive merge/link suggestion queue. |
| `email_template` | Editable draft-only follow-up templates. |
| `dashboard_definition` | Tenant dashboard widgets and saved views. |

## Standard status buckets

Tenant mappings decide which provider values count toward each bucket.

| Bucket | Purpose |
|---|---|
| `quoted` | Quote/proposal has been created or sent. |
| `in_production` | Job is in production or production-ready. |
| `completed` | Job is fulfilled/completed and can contribute to repeat-order history. |
| `cancelled` | Job cancelled before completion. |
| `lost` | Quote/order lost, ghosted, or rejected. |
| `ignored` | Excluded from reporting. |
| `dirty` | Requires cleanup before reporting. |
| `paid` | Payment complete. |
| `unpaid` | Payment incomplete or missing. |
| `custom` | Tenant-defined reporting bucket. |

## Screen 1: Sales Dashboard

### Job

Give managers and sales reps a fast view of revenue, order volume, repeat revenue, reorder risk, quote pipeline, and team performance using tenant-defined mappings.

### Data shape

```ts
interface SalesDashboardPayload {
  dateRange: {
    preset: "today" | "yesterday" | "this_week" | "7_days" | "30_days" | "mtd" | "ytd" | "all_time" | "custom";
    from: string;
    to: string;
    compareToPreviousPeriod: boolean;
  };
  filters: {
    managerId: string | null;
    teamKey: string | null;
    categoryKey: string | null;
  };
  metrics: {
    revenue: number;
    averageOrderValue: number;
    bulkOrders: number;
    personalSales: number;
    repeatRevenue: number;
    reorderDueCount: number;
    quotedCount: number;
    completedCount: number;
    cancelledOrLostCount: number;
  };
  ticker: Array<{
    orderId: string;
    customerName: string;
    managerName: string | null;
    amount: number;
    createdAt: string;
  }>;
  managerPerformance: Array<{
    managerId: string | null;
    managerName: string;
    revenue: number;
    orderCount: number;
    onlineStoreCount: number;
    goalRevenue: number | null;
    goalOrders: number | null;
    goalOnlineStores: number | null;
  }>;
  dirtyDataWarnings: Array<{
    fieldKey: string;
    recordCount: number;
    reason: string;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Show stable metric skeletons and keep filters visible. |
| Empty | Explain that no mapped orders match the selected date range and offer links to status mapping and Printavo sync. |
| Dirty data | Show a warning with counts and a link to mapping/cleanup. Do not hide metrics silently. |
| Error | Show route/provider error and retry. |

### Primary actions

- Change date range.
- Toggle compare-to-previous-period.
- Filter by manager, team, category, or mapped bucket.
- Open related order list from a metric.
- Save dashboard view.
- Open dashboard configuration if user has admin access.

### Side effects

- Saved views write to product-owned dashboard/saved-view storage.
- No Printavo write-back.
- No email send.

### Acceptance criteria

- Given a tenant maps statuses into `completed`, the dashboard revenue and order counts use only those mapped statuses.
- Given a status mapping changes, the dashboard changes after refresh without code edits.
- Given no mapping exists for a provider status, affected records appear in dirty-data warnings or unmapped counts.
- Existing FraterniTees scoring and top-customer surfaces remain reachable after this dashboard is added or navigation is reorganized.

## Screen 2: Orders

### Job

Provide a read-only searchable mirror of Printavo-derived orders with tenant-controlled filters, saved views, status/payment buckets, production dates, customer due dates, sync state, and deep links.

### Data shape

```ts
interface SalesOrdersPayload {
  filters: {
    query: string;
    statusBucket: string | null;
    paymentBucket: string | null;
    teamKey: string | null;
    managerId: string | null;
    productionDateRange: { from: string | null; to: string | null };
    customerDueDateRange: { from: string | null; to: string | null };
    syncState: "all" | "synced" | "unsynced";
    savedViewId: string | null;
  };
  counts: {
    all: number;
    processed: number;
    unprocessed: number;
    paid: number;
    unpaid: number;
    synced: number;
    unsynced: number;
  };
  orders: Array<{
    id: string;
    provider: "printavo" | string;
    externalOrderId: string;
    orderNumber: string | null;
    customerName: string;
    companyName: string | null;
    email: string | null;
    orderTotal: number | null;
    createdBy: string | null;
    managerName: string | null;
    teamName: string | null;
    tagValues: string[];
    status: string | null;
    statusBucket: string | null;
    paymentStatus: string | null;
    paymentBucket: string | null;
    customerDueDate: string | null;
    processedDate: string | null;
    productionDate: string | null;
    sourceUrl: string | null;
    syncedAt: string | null;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Keep filters and table headers stable. |
| Empty | Show whether the result is empty because of filters, no sync, or dirty mapping. |
| Partial sync | Show last sync timestamp and unsynced count. |
| Error | Preserve selected filters and show retry. |

### Primary actions

- Search orders.
- Filter by manager, team, status bucket, payment bucket, production/customer date, sync state, and tags.
- Save current filters as a view.
- Open order detail.
- Open provider source URL when available.
- Create a new product-owned opportunity from an order.

### Side effects

- Saving a view writes dashboard/saved-view config.
- Creating an opportunity writes product-owned opportunity data.
- No Printavo write-back.

### Acceptance criteria

- Given a tenant maps a Printavo status to `completed`, the completed filter includes matching orders.
- Given a tenant marks a field dirty, the table shows dirty-data badges and excludes that field from authoritative metrics where configured.
- Given an order has a provider URL, opening the source URL does not mutate product or Printavo data.

## Screen 3: Order Detail

### Job

Show the full order context needed to understand customer history, quote/order value, status, ownership, and future follow-up.

### Data shape

```ts
interface SalesOrderDetailPayload {
  order: {
    id: string;
    sourceUrl: string | null;
    providerStatus: string | null;
    statusBucket: string | null;
    paymentBucket: string | null;
    totals: {
      total: number | null;
      cost: number | null;
      margin: number | null;
      marginPercent: number | null;
    };
    dates: {
      createdAt: string | null;
      productionDate: string | null;
      customerDueDate: string | null;
      completedAt: string | null;
    };
    customer: {
      accountId: string | null;
      displayName: string;
      email: string | null;
      linkedSocialAccounts: Array<{ id: string; platform: string; handle: string }>;
    };
    owner: {
      managerName: string | null;
      teamName: string | null;
      salesRepName: string | null;
    };
    lineItems: Array<{
      category: string | null;
      itemName: string;
      color: string | null;
      quantity: number | null;
      price: number | null;
      blankCost: number | null;
      decorationCost: number | null;
      extendedCost: number | null;
      lineTotal: number | null;
      margin: number | null;
      sizeBreakdown: Record<string, number>;
    }>;
    sourcePayloadAvailable: boolean;
  };
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Show modal/page skeleton with fixed header/footer actions. |
| Missing account link | Show link/create-account suggestion without blocking order visibility. |
| Profit unknown | Show totals and leave cost/margin as unavailable. Do not fake profitability. |
| Error | Show close and retry. |

### Primary actions

- Open Printavo/source URL.
- Link order to an account.
- Add to opportunity.
- Create reorder signal when appropriate.
- View source payload metadata for admins/operators.

### Side effects

- Product-owned links/opportunities/reorder records only.
- No Printavo mutation.

### Acceptance criteria

- Given line-item costs are unavailable, profitability fields render as unavailable and the order remains usable.
- Given an account link is confirmed, order/account history updates without merging source records destructively.

## Screen 4: Accounts And Customer Cleanup

### Job

Give screenprinters a customer/account directory that supports sales follow-up, data cleanup, identity linking, social linking, repeat-order context, and existing lead-scoring surfaces.

### Data shape

```ts
interface SalesAccountsPayload {
  summary: {
    totalAccounts: number;
    scoredAccounts: number;
    dirtyAccounts: number;
    duplicateCandidates: number;
    unlinkedOrders: number;
    unlinkedSocialAccounts: number;
  };
  accounts: Array<{
    id: string;
    displayName: string;
    categoryKeys: string[];
    ownerMemberId: string | null;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
    lifetimeRevenue: number | null;
    orderCount: number;
    lastOrderDate: string | null;
    leadScore: number | null;
    leadGrade: string | null;
    dncFlagged: boolean;
    linkedSocialAccounts: Array<{ id: string; platform: string; handle: string }>;
    cleanupFlags: string[];
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Preserve filters and tabs. |
| Empty | Show setup path: sync Printavo or clear filters. |
| Cleanup needed | Show grouped queue for duplicates, missing fields, dirty fields, unlinked orders, and identity suggestions. |
| Error | Show retry and preserve filters. |

### Primary actions

- Search and filter accounts.
- Filter by category, owner, score grade, DNC risk, dirty-data flag, duplicate flag, linked/unlinked social account.
- Open account detail.
- Confirm/reject/ignore identity suggestions.
- Link an Instagram/social account to a customer or organization.
- Preserve access to the existing FraterniTees scoring engine and top-customer leaderboard.

### Side effects

- Confirming links writes product-owned identity records.
- Rejected suggestions are remembered so they do not keep reappearing.
- No destructive customer merge in MVP.
- No Printavo write-back.

### Acceptance criteria

- Given two provider customer names are similar, the app can surface a non-destructive suggestion with confidence and reason.
- Given a tenant rejects a suggestion, it no longer appears as an unreviewed suggestion.
- Given an Instagram account is linked to a customer, Sales and Social surfaces both show the link.
- FraterniTees lead score, score trend, DNC flag, and top-customer views remain available.

## Screen 5: Opportunities

### Job

Manage product-owned sales pipeline work from manual leads, reorders, quotes, social alerts, campaigns, and customer cleanup signals.

### Data shape

```ts
interface OpportunitiesPayload {
  pipelines: Array<{
    key: string;
    label: string;
    stages: Array<{
      key: string;
      label: string;
      color: string;
      count: number;
      totalValue: number;
      opportunities: Array<{
        id: string;
        title: string;
        accountId: string | null;
        accountName: string | null;
        value: number | null;
        ownerMemberId: string | null;
        sourceType: "manual" | "reorder" | "social_alert" | "printavo_quote" | "campaign";
        dueAt: string | null;
        createdAt: string;
      }>;
    }>;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable board columns. |
| Empty pipeline | Show add opportunity action inside the stage. |
| No configured stages | Route admin to pipeline settings. |
| Error | Show retry and preserve selected pipeline. |

### Primary actions

- Create opportunity.
- Move opportunity between stages.
- Assign owner.
- Link account, order, reorder signal, social alert, or campaign.
- Convert due reorder into opportunity.
- Mark won/lost/archive.

### Side effects

- Writes product-owned opportunity/activity records.
- Does not create or update Printavo orders.

### Acceptance criteria

- Given tenant stages are configured, the board renders those stage labels and order.
- Given a reorder is added to an opportunity, the reorder record links back to the opportunity and leaves the source order unchanged.

## Screen 6: Reorders

### Job

Surface due, overdue, upcoming, snoozed, converted, and ignored repeat-order opportunities based on tenant-defined cycles and completed-order mappings.

### Data shape

```ts
interface ReordersPayload {
  buckets: {
    overdue: ReorderItem[];
    due: ReorderItem[];
    upcoming: ReorderItem[];
    snoozed: ReorderItem[];
    converted: ReorderItem[];
    ignored: ReorderItem[];
  };
}

interface ReorderItem {
  id: string;
  accountId: string;
  accountName: string;
  sourceOrderId: string | null;
  sourceOrderName: string | null;
  expectedReorderDate: string;
  daysDelta: number;
  ruleKey: string;
  categoryKey: string | null;
  estimatedValue: number | null;
  ownerMemberId: string | null;
  lastActionAt: string | null;
  suggestedTemplateKey: string | null;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Keep bucket tabs stable. |
| Empty | Show whether no reorders exist or no completed statuses are configured. |
| Mapping incomplete | Show setup path to status mapping. |
| Error | Show retry. |

### Primary actions

- Reach out with draft email.
- Snooze.
- Add to opportunity.
- Mark ignored.
- Mark converted.
- Open account.
- Open source order.

### Side effects

- Draft email creation writes no outbound email.
- Snooze/conversion writes product-owned reorder/activity records.
- No Printavo write-back.

### Acceptance criteria

- Given a tenant changes which statuses count as completed, reorder signals recalculate from that mapping.
- Given a user clicks draft email, the draft is editable and can be copied/opened in an email client but is not sent by the app.
- Given a reorder is snoozed, it leaves the due/overdue bucket until the snooze date.

## Screen 7: Email Drafts And Templates

### Job

Let tenants manage follow-up templates and produce editable drafts for reorder, quote, stalled opportunity, lost customer recovery, social lead follow-up, and custom workflows.

### Data shape

```ts
interface EmailTemplatePayload {
  templates: Array<{
    id: string;
    templateKey: string;
    name: string;
    subjectTemplate: string;
    bodyTemplate: string;
    enabled: boolean;
    availableTokens: string[];
    categoryScope: string[];
  }>;
}

interface RenderedEmailDraft {
  to: string | null;
  subject: string;
  body: string;
  warnings: string[];
}
```

### States

| State | Required behavior |
|---|---|
| Missing template | Show default tenant type template and prompt admin to save/edit. |
| Missing recipient | Render draft but warn that recipient is missing. |
| Token error | Show invalid token and block save until fixed. |
| Error | Keep unsaved edits in the form. |

### Primary actions

- Create/edit/disable template.
- Preview template using sample account/order/reorder/opportunity.
- Render draft.
- Copy email.
- Open email client with `mailto:` when recipient exists.
- Mark as sent manually.

### Side effects

- Template changes write product-owned config.
- Mark-sent writes product-owned activity.
- No email send.

### Acceptance criteria

- Given a tenant edits a reorder template, the next reorder draft uses the edited template.
- Given a user marks a draft sent, account activity records the manual send state.

## Screen 8: Goals

### Job

Set tenant-defined monthly or quarterly targets for reps, managers, and teams.

### Data shape

```ts
interface SalesGoalsPayload {
  period: { month: number; year: number; cadence: "monthly" | "quarterly" };
  teams: Array<{
    teamKey: string;
    teamLabel: string;
    managers: Array<{
      memberId: string | null;
      managerName: string;
      revenueGoal: number | null;
      orderGoal: number | null;
      onlineStoreGoal: number | null;
      repeatOrderGoal: number | null;
    }>;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| No team config | Let admin create a team or skip goals. |
| Unsaved changes | Show reset/save controls. |
| Error | Keep unsaved edits. |

### Primary actions

- Select month/year or quarter.
- Edit goals per manager/team.
- Reset unsaved edits.
- Save goals.
- Open performance dashboard.

### Side effects

- Writes product-owned goal config/history.
- No provider write-back.

### Acceptance criteria

- Given saved goals for April 2026, the Sales dashboard manager performance uses those goals for April 2026.
- Given no goals exist, dashboard metrics still render without goals.

## Screen 9: Sales Admin Configuration

### Job

Let tenant admins decide how provider data maps into reporting and workflow behavior without code changes.

### Required settings

| Setting | Required behavior |
|---|---|
| Status mapping | Map provider statuses into standard/custom buckets. |
| Payment mapping | Map provider payment states into paid/unpaid/ignored/dirty. |
| Tag mapping | Map tags into categories, teams, exclusions, or custom labels. |
| Field trust | Mark fields trusted, review, dirty, or ignored. |
| Category rules | Define customer/account categories. |
| Ownership rules | Decide sales owner by rep, team, account, tag, category, or manual assignment. |
| Reorder rules | Define cycles, windows, category scopes, high-value thresholds, and owners. |
| Email templates | Manage draft-only templates. |
| Pipelines | Define pipelines, stages, colors, and default owners. |
| Dashboards | Choose widgets, metrics, saved views, and role defaults. |

### Impact preview

Before saving risky mapping changes, show:

- affected order count
- affected account count
- metric deltas where feasible
- dirty/unmapped record counts
- dashboards or saved views affected
- warnings when source data appears inconsistent

### Acceptance criteria

- A tenant admin can change a status mapping and see Sales dashboard/order/reorder behavior reflect it.
- A tenant admin can mark a field dirty and see warning counts where that field would otherwise drive reporting.
- Tenant-specific mappings do not affect another tenant.

## Future adapter boundary: catalog costs and profitability

Authoritative profitability reporting is not required until the order/customer foundation is stable. The current UI includes an operator worksheet for needs-review margin estimates only. The data model and services should leave room for future catalog adapters.

Future catalog adapter contract:

```ts
interface CatalogCostAdapter {
  providerKey: string;
  searchProducts(input: { query: string; tenantConfig: Record<string, unknown> }): Promise<CatalogProduct[]>;
  matchSku(input: { sku: string; color?: string; size?: string; tenantConfig: Record<string, unknown> }): Promise<CatalogSkuMatch | null>;
  getBlankCost(input: { sku: string; quantity: number; tenantConfig: Record<string, unknown> }): Promise<CatalogCostQuote>;
  getInventory(input: { sku: string; tenantConfig: Record<string, unknown> }): Promise<CatalogInventory>;
}
```

## Current MVP Implementation

The current Sales MVP is implemented through:

- `/screenprinting` for the first combined admin/sales/social workspace UI
- `/api/runtime/organizations/[slug]/screenprinting/sales/dashboard`
- `/api/runtime/organizations/[slug]/screenprinting/sales/orders`
- `/api/runtime/organizations/[slug]/screenprinting/sales/orders/[orderId]`
- `/api/runtime/organizations/[slug]/screenprinting/sales/saved-views`
- `/api/runtime/organizations/[slug]/screenprinting/sales/manager-goals`
- `/api/runtime/organizations/[slug]/screenprinting/sales/opportunities`
- `/api/runtime/organizations/[slug]/screenprinting/sales/reorders`
- `/api/runtime/organizations/[slug]/screenprinting/sales/email-drafts`
- `/api/runtime/organizations/[slug]/screenprinting/dashboards`

Printavo remains read-only, email remains draft-only, and tenant mappings drive status/payment reporting buckets.

No implementation should hardcode one apparel vendor as the only path.
