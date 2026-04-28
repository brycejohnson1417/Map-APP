# Screenprinting Social Module

## Tenant type scope

Tenant type: `Screenprinting`

This module defines the universal social monitoring, planning, alerting, and customer-linking surface for screenprinting businesses.

Tenant-specific differences belong in tenant workspace config, organization overrides, social account records, alert rules, dashboard definitions, identity links, and tenant-specific docs.

## Product stance

- Monitoring plus calendar planning is required for MVP.
- Publishing, comment replies, and message replies are supported when tenant feature flags, owned-account records, and Meta permissions allow them.
- Real saved tenants must not silently fall back to demo social accounts, posts, alerts, campaigns, or identity suggestions. Show real rows, manual-import rows, provider permission states, or explicit empty states.
- Demo fixtures are allowed only for no-organization development paths and must be visibly labeled as demo data.
- Comments/replies should be available for owned accounts when API permissions allow.
- Instagram messages should be linkable to customers and organizations when API access allows; manual logging/linking must exist when API access is unavailable.
- Tenants may track multiple owned accounts and multiple watched accounts.
- Tenants may use API-backed import, manual import, or CSV/import workflows depending on platform access.
- Social activity must link back to customers, organizations, opportunities, campaigns, and sales follow-up without destructive merges.

## Current FraterniTees implementation state

- The `/screenprinting?org=fraternitees` Social workspace shows honest zero/empty states until FraterniTees connects or manually imports social accounts, posts, messages, campaigns, or identity suggestions.
- Manual account import, Meta connected-account scan, account taxonomy updates, manual Instagram thread logging, draft post creation, campaign creation, alert read updates, live comment/message replies, live publish attempts, and identity-resolution decisions all route through tenant-scoped APIs or show explicit permission/session errors.
- The composer saves product-owned draft posts first. Publishing is a separate Meta action gated by owned account, public media URL, access token, scopes, and tenant feature flag.
- Messages/comments can be manually logged and then reviewed in identity resolution for non-destructive customer/organization linking.
- Buttons must either call a tenant-scoped API, open a local workflow, or be disabled with an explicit reason.

## Required primitives

| Primitive | Purpose |
|---|---|
| `social_account` | Owned, watched, ignored, or manually tracked social account. |
| `social_post` | API-imported or manually logged post/reel/story/video/planned item. |
| `social_thread` | Comment, reply, direct message, or manual conversation log. |
| `campaign` | Social/sales campaign with linked accounts, posts, assets, opportunities, and outcomes. |
| `alert_rule` | Tenant-configured rule for actionable social alerts. |
| `alert_instance` | Alert inbox item with read/owner/status state. |
| `identity_resolution` | Non-destructive social account/thread to customer/org/contact linking. |
| `dashboard_definition` | Tenant social dashboard widgets and saved views. |
| `activity` | Manual social notes, replies, links, and follow-up events. |

## Social account taxonomy

Tenant admins decide which categories exist. Default categories:

- owned
- watched
- ignored
- high priority
- school
- team
- athlete
- influencer
- customer
- competitor
- media
- partner
- custom

Default platforms:

- Instagram
- TikTok
- X/Twitter
- Facebook
- manual/other

Instagram should be first. Other platforms can be API-backed or manually imported depending on available permissions and tenant priorities.

## Screen 1: Social Dashboard

### Job

Show social coverage, alerts, new posts, engagement, account health, and workload across owned and watched accounts.

### Data shape

```ts
interface SocialDashboardPayload {
  dateRange: {
    from: string;
    to: string;
    label: string;
  };
  metrics: {
    trackedAccounts: number;
    activeAccounts: number;
    ownedAccounts: number;
    watchedAccounts: number;
    totalPosts: number;
    newPosts: number;
    unreadAlerts: number;
    totalEngagement: number;
  };
  activityAcrossAccounts: {
    posts: Array<{ date: string; count: number }>;
    likes: Array<{ date: string; count: number }>;
    comments: Array<{ date: string; count: number }>;
    views: Array<{ date: string; count: number }>;
  };
  recentAlerts: SocialAlertSummary[];
  coverageBreakdown: Array<{
    category: string;
    trackedAccounts: number;
    ownedAccounts: number;
    watchedAccounts: number;
    posts: number;
    alerts: number;
  }>;
  syncWarnings: Array<{
    socialAccountId: string;
    handle: string;
    reason: string;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Keep metric cards and chart area stable. |
| Empty | Show setup path to add/import owned or watched accounts. |
| API limited | Show which metrics are unavailable and why. |
| Error | Show retry and preserve filters. |

### Primary actions

- Filter by date range, platform, ownership, priority, category, school/org, or account owner.
- Open alert inbox.
- Open account registry.
- Open recent post detail.
- Open dashboard configuration.

### Side effects

- Saved dashboard preferences write product-owned config.
- Social publishing is available only behind tenant feature flag and Meta publish permission.

### Acceptance criteria

- Given a tenant manually imports a watched account, tracked account counts update.
- Given an alert is marked read, unread alert count updates.
- Given API metrics are unavailable, the dashboard labels unavailable metrics instead of inventing values.

## Screen 2: Social Accounts Registry

### Job

Track all owned and watched social accounts with platform, handle, follower count, category, priority, source, status, sync state, and customer/org links.

### Data shape

```ts
interface SocialAccountsPayload {
  filters: {
    query: string;
    platform: string | null;
    priority: string | null;
    category: string | null;
    status: string | null;
    ownership: "owned" | "watched" | "ignored" | "all";
    source: "api" | "manual" | "csv_import" | "all";
    schoolOrOrg: string | null;
  };
  accounts: Array<{
    id: string;
    platform: string;
    handle: string;
    displayName: string | null;
    followerCount: number | null;
    ownership: "owned" | "watched" | "ignored";
    source: "api" | "manual" | "csv_import";
    category: string | null;
    priority: string | null;
    status: "active" | "paused" | "needs_auth" | "archived";
    postCount: number;
    lastSyncedAt: string | null;
    linkedAccount: { id: string; displayName: string } | null;
    linkedContact: { id: string; fullName: string } | null;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable filters and table/list rows. |
| Empty | Show API scan, manual add, and import actions. |
| Needs auth | Show re-authorize action for owned API-backed accounts. |
| Error | Preserve filters and show retry. |

### Primary actions

- Search accounts.
- Filter by platform, priority, category, status, ownership, source, kind, and school/org.
- Scan connected provider accounts.
- Add account manually.
- Import accounts from file/list.
- Open account detail.
- Sync one account.
- Link account to customer/organization/contact.
- Mark owned/watched/ignored.
- Reassign category/priority/status.

### Side effects

- Manual add/import writes product-owned `social_account` rows.
- API scan writes or updates tenant-owned account registry rows.
- Links write non-destructive identity records.
- No shared global watchlist state across tenants.

### Acceptance criteria

- A tenant can track multiple owned accounts and multiple watched accounts.
- A manually imported account appears in registry, dashboard counts, and alert-rule scopes.
- Updating category or priority changes filters and alert-rule eligibility without code changes.
- One tenant's watched account category does not affect another tenant that tracks the same public handle.

## Screen 3: Social Account Detail

### Job

Show profile connection state, ownership, organization link, key metrics, weekly trends, posts, sync history, and provider actions for one social account.

### Data shape

```ts
interface SocialAccountDetailPayload {
  socialAccount: {
    id: string;
    platform: string;
    handle: string;
    displayName: string | null;
    profileUrl: string | null;
    ownership: "owned" | "watched" | "ignored";
    source: "api" | "manual" | "csv_import";
    category: string | null;
    priority: string | null;
    status: string;
    followerCount: number | null;
    totalPosts: number;
    averageEngagement: number | null;
    lastSyncedAt: string | null;
    providerConnection: {
      connected: boolean;
      providerName: string | null;
      externalAccountId: string | null;
      permissions: string[];
      needsReauthorization: boolean;
    };
    organizationLinks: {
      accountId: string | null;
      contactId: string | null;
      schoolOrOrgKey: string | null;
    };
  };
  weeklyTrends: {
    posts: Array<{ weekStart: string; count: number }>;
    likes: Array<{ weekStart: string; count: number }>;
    comments: Array<{ weekStart: string; count: number }>;
    views: Array<{ weekStart: string; count: number }>;
  };
  posts: SocialPostSummary[];
  syncHistory: Array<{
    id: string;
    startedAt: string;
    finishedAt: string | null;
    status: string;
    newPosts: number;
    error: string | null;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable account header and trend placeholders. |
| Manual account | Hide unavailable API actions and show manual update/import actions. |
| Needs permission | Show missing permission and re-authorize action for owned accounts. |
| Error | Show retry and back to registry. |

### Primary actions

- Open source profile.
- Sync.
- Import posts.
- Re-authorize.
- Disconnect owned API connection.
- Edit category/priority/ownership/status.
- Link to account/contact/school/org.
- Open post detail.
- Open sync history.
- Open content calendar filtered to this account.
- Open compose/planned-post flow only if feature flag permits it.

### Side effects

- Re-authorize/disconnect changes tenant connector state only.
- Sync/import writes tenant-scoped posts and metrics.
- Link changes write non-destructive identity records.
- Publishing remains feature-gated by default; FraterniTees enables it once Meta permissions are connected.

### Acceptance criteria

- An owned API-backed account shows connection state and re-authorize/disconnect actions.
- A watched/manual account does not show reply/publish actions that require owned-account permissions.
- Weekly trends show unavailable/empty states when metrics are not available.

## Screen 4: Posts And Media

### Job

Review posts, reels, stories, planned posts, imported media, performance metrics, seen state, campaign links, and customer/org links.

### Data shape

```ts
interface SocialPostsPayload {
  tabs: {
    all: number;
    posts: number;
    reels: number;
    stories: number;
    planned: number;
  };
  posts: Array<{
    id: string;
    socialAccountId: string;
    platform: string;
    handle: string;
    postType: "post" | "reel" | "story" | "video" | "planned" | "manual";
    status: "published" | "scheduled" | "planned" | "draft" | "imported" | "deleted";
    caption: string | null;
    mediaPreviewUrl: string | null;
    permalink: string | null;
    publishedAt: string | null;
    scheduledFor: string | null;
    seenByCurrentUser: boolean;
    metrics: {
      likes: number | null;
      comments: number | null;
      shares: number | null;
      views: number | null;
      engagementRate: number | null;
    };
    campaign: { id: string; name: string } | null;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable tabs and list rows. |
| Empty | Show import/add planned post actions. |
| Scheduled/planned | Show schedule date and no live metrics yet. |
| API metrics unavailable | Show missing metrics as unavailable. |
| Error | Show retry. |

### Primary actions

- Filter by account, platform, post type, status, date range, campaign, seen state.
- Mark seen.
- Open source post.
- Open post detail.
- Link to campaign/account/opportunity.
- Create alert or opportunity from a post.

### Side effects

- Mark seen writes tenant/user seen state.
- Links write product-owned records.
- No publishing unless the tenant feature flag, owned-account mapping, and Meta content-publish scope are present.

### Acceptance criteria

- Posts can be filtered by All, Posts, Reels, Stories, and Planned/Scheduled where data exists.
- A scheduled/planned record can appear on the calendar before it has metrics.
- Mark seen changes the row state without changing provider data.

## Screen 5: Post Detail And Insights Drawer

### Job

Show post media, caption, account context, source link, detailed metrics, comments/replies where allowed, account stats, and sales/social links.

### Data shape

```ts
interface SocialPostDetailPayload {
  post: {
    id: string;
    socialAccount: {
      id: string;
      handle: string;
      displayName: string | null;
      ownership: "owned" | "watched" | "ignored";
    };
    postType: string;
    status: string;
    caption: string | null;
    mediaPreviewUrl: string | null;
    permalink: string | null;
    metrics: {
      views: number | null;
      reach: number | null;
      replies: number | null;
      navigation: number | null;
      profileVisits: number | null;
      newFollows: number | null;
      likes: number | null;
      comments: number | null;
      shares: number | null;
      engagementRate: number | null;
    };
  };
  comments: Array<{
    id: string;
    externalCommentId: string | null;
    authorHandle: string | null;
    body: string;
    createdAt: string;
    linkedContactId: string | null;
  }>;
  permissions: {
    canReply: boolean;
    reason: string | null;
    missingProviderPermissions: string[];
  };
  accountStats: Record<string, unknown>;
  links: {
    campaignId: string | null;
    accountId: string | null;
    opportunityId: string | null;
  };
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Drawer opens with stable media/metric placeholders. |
| No comments | Show empty state and permission guidance if comments require re-authorization. |
| Cannot reply | Disable reply action and state why. |
| Error | Let user close drawer and retry. |

### Primary actions

- Add comment/reply as owned account when permissions allow.
- Link comment author to contact/customer/org.
- Link post to campaign/account/opportunity.
- Open source post.
- Mark seen.

### Side effects

- Reply/comment writes to provider only when owned-account permissions and tenant feature flags allow it.
- Manual comment/log fallback writes product-owned `social_thread` and `activity` only.
- Links write non-destructive identity records.

### Acceptance criteria

- Metrics include available values for views, reach, replies, navigation, profile visits, new follows, likes, comments, shares, and engagement rate.
- Reply box appears only when the tenant owns the account and permissions allow it.
- If comments permission is missing, the drawer explains the missing permission and offers re-authorization or manual logging.

## Screen 6: Alerts Inbox

### Job

Give social owners an actionable inbox for new posts, engagement spikes, comments, messages, mentions, competitor activity, missed campaign performance, and custom tenant rules.

### Data shape

```ts
interface SocialAlertsPayload {
  filters: {
    readState: "all" | "unread" | "read";
    eventType: string | null;
    severity: string | null;
    ownerMemberId: string | null;
    socialAccountId: string | null;
  };
  counts: {
    total: number;
    unread: number;
  };
  alerts: Array<{
    id: string;
    eventType: "new_post" | "engagement_spike" | "comment" | "message" | "mention" | "competitor_spike" | "campaign_underperforming" | string;
    title: string;
    body: string | null;
    severity: string;
    status: "unread" | "read" | "assigned" | "resolved" | "dismissed";
    ownerMemberId: string | null;
    socialAccount: { id: string; platform: string; handle: string } | null;
    createdAt: string;
    metadata: {
      threshold?: string;
      postsAboveThreshold?: number;
      engagementRate?: number;
      sourcePostId?: string;
    };
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable filter controls and alert rows. |
| Empty | Explain that no alerts match filters and link to alert rules. |
| Unread only | Show count and mark-all-read action. |
| Error | Show retry. |

### Primary actions

- Filter unread/all and alert type.
- Mark one alert read.
- Mark all read.
- Assign owner.
- Resolve/dismiss.
- Open linked post/account/thread/opportunity.
- Create opportunity from alert.

### Side effects

- Alert read/owner/status writes product-owned alert state.
- Opportunity creation writes product-owned opportunity.
- Provider data remains unchanged.

### Acceptance criteria

- A new post alert can be generated for a selected high-priority account.
- An engagement spike alert can be generated when a tenant-defined threshold is crossed.
- Mark all read updates unread count and row states.
- Tenant alert thresholds and recipients can change without code edits.

## Screen 7: Alert Rules

### Job

Let tenant admins decide what counts as actionable social activity.

### Required default rule types

| Rule type | Required configurable fields |
|---|---|
| New post | platforms, ownership/category/priority scope, owner, severity, cooldown |
| Engagement spike | metric, threshold, baseline window, category scope, owner, severity, cooldown |
| Comment on owned account | account scope, keyword filters, owner, severity, cooldown |
| Message/manual thread | account scope, owner, severity |
| Mention | keyword/handle scope, owner, severity |
| Competitor spike | competitor category scope, threshold, owner, severity |
| Campaign underperforming | campaign status, expected engagement window, threshold, owner |

### States

| State | Required behavior |
|---|---|
| No rules | Seed tenant type defaults and allow admin edits. |
| Invalid threshold | Block save and explain the invalid field. |
| Preview available | Show estimated matching accounts/posts. |
| Error | Keep unsaved edits. |

### Primary actions

- Create/edit/disable rule.
- Preview impact.
- Set owner/recipient.
- Set severity.
- Set cooldown.
- Limit scope by platform, category, priority, ownership, school/org, or account.

### Side effects

- Writes product-owned alert rule config.
- Does not retroactively create alerts unless the user explicitly runs a preview/backfill action.

### Acceptance criteria

- Changing an engagement threshold changes future alert generation.
- Disabling a rule prevents new alerts of that rule from being generated.

## Screen 8: Calendar

### Job

Plan content and campaigns without requiring live publishing.

### Data shape

```ts
interface SocialCalendarPayload {
  dateRange: { from: string; to: string };
  items: Array<{
    id: string;
    type: "planned_post" | "campaign_milestone" | "follow_up" | "manual_note";
    title: string;
    status: "planned" | "draft" | "scheduled" | "published" | "done" | "cancelled";
    scheduledFor: string;
    ownerMemberId: string | null;
    platform: string | null;
    socialAccountId: string | null;
    campaignId: string | null;
    accountId: string | null;
    assetLinks: string[];
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable calendar grid/list. |
| Empty | Show create planned post/campaign actions. |
| Missing assets | Show asset warning without blocking planning. |
| Publishing unavailable | Allow planning and scheduling labels, but show the missing connector/scope/owned-account reason before live publish is available. |

### Primary actions

- Create planned post.
- Create campaign milestone.
- Assign owner.
- Link account/campaign/social account.
- Add asset links.
- Move item date.
- Change status.

### Side effects

- Writes product-owned calendar/campaign/post records.
- Provider publishing is allowed only through the permission-gated Meta route.

### Acceptance criteria

- A user can create a planned Instagram post linked to a campaign without connecting publishing permissions.
- Calendar items are tenant-scoped and do not appear in another tenant workspace.

## Screen 9: Campaigns

### Job

Plan and track sales/social campaigns connected to accounts, watched/owned social accounts, opportunities, posts, alerts, and outcomes.

### Data shape

```ts
interface CampaignsPayload {
  campaigns: Array<{
    id: string;
    name: string;
    campaignType: string;
    status: "planned" | "active" | "paused" | "completed" | "archived";
    ownerMemberId: string | null;
    startsOn: string | null;
    endsOn: string | null;
    goal: string | null;
    linkedAccounts: number;
    linkedSocialAccounts: number;
    linkedPosts: number;
    linkedOpportunities: number;
    metrics: Record<string, number | null>;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable list/cards. |
| Empty | Show create campaign action. |
| No linked outcomes | Show setup prompt to link accounts/posts/opportunities. |
| Error | Show retry. |

### Primary actions

- Create/edit campaign.
- Link accounts/social accounts/posts/opportunities.
- Add calendar items.
- Open campaign performance.
- Archive campaign.

### Side effects

- Writes product-owned campaign/link records.
- Does not mutate provider posts/orders.

### Acceptance criteria

- A campaign can link to a social post and an opportunity.
- Campaign performance can show social metrics and sales outcomes when both links exist.

## Screen 10: Conversations And Manual Social Threads

### Job

Track comments, replies, direct messages, and manually logged social conversations, then link them to contacts, customers, organizations, opportunities, and campaigns.

### Data shape

```ts
interface SocialThreadsPayload {
  threads: Array<{
    id: string;
    platform: string;
    threadType: "comment" | "dm" | "manual";
    socialAccountId: string | null;
    socialPostId: string | null;
    participantHandle: string | null;
    status: "open" | "replied" | "needs_review" | "closed" | "ignored";
    ownerMemberId: string | null;
    accountId: string | null;
    contactId: string | null;
    opportunityId: string | null;
    lastMessageAt: string | null;
    summary: string;
  }>;
}
```

### States

| State | Required behavior |
|---|---|
| Loading | Stable inbox layout. |
| Empty | Show manual log action and API connection guidance. |
| Needs review | Highlight missing account/contact link. |
| API unavailable | Manual logging remains available. |

### Primary actions

- Log manual thread.
- Link to customer/org/contact.
- Link to opportunity/campaign.
- Assign owner.
- Mark replied/closed/ignored.
- Create opportunity.

### Side effects

- Manual logs write product-owned `social_thread` and `activity`.
- Links write non-destructive identity records.
- Provider replies only happen when supported and explicitly enabled.

### Acceptance criteria

- A user can map an Instagram message or manual thread to a customer account.
- A thread linked to an opportunity appears in both Social and Sales context.
- API absence does not block manual tracking.

## Screen 11: Compose And Publishing Capability Gate

### Job

Support live publishing without making it required for every tenant or every draft.

### MVP behavior

- The UI may allow creating a planned post with media/caption/date/account/campaign links.
- Live publish buttons remain hidden or disabled unless a feature flag, owned-account mapping, public media URL, token, and Meta permission allow them.
- Caption length, media type, location, tags, collaborators, and co-author invites should be modeled so publishing can be extended without changing the core draft model.

### Publishing data shape

```ts
interface ComposePostDraft {
  socialAccountId: string;
  mediaAssets: Array<{ url: string; contentType: string; sizeBytes: number }>;
  caption: string;
  location: string | null;
  taggedHandles: string[];
  collaboratorHandles: Array<{
    handle: string;
    displayName: string | null;
    verified: boolean | null;
    followerCount: number | null;
  }>;
  scheduledFor: string | null;
  campaignId: string | null;
}
```

### Acceptance criteria

- In MVP, planned posts can be created without live publishing and published later when authorization is complete.
- Publish is unavailable unless the tenant enables the capability, owns the account, and provider permissions are valid.
- Collaborator/tag search can be added later without changing the core post model.

## Screen 12: Social Admin Configuration

### Job

Let tenant admins configure account categories, ownership rules, alert thresholds, platform availability, calendar labels, reply/publishing gates, dashboards, and identity-resolution behavior.

### Required settings

| Setting | Required behavior |
|---|---|
| Owned account registry | Add/manage multiple owned accounts. |
| Watched account registry | Add/manage multiple watched accounts. |
| Platform availability | Enable API-backed or manual-only platform tracking. |
| Category list | Tenant-defined categories and colors. |
| Priority list | Tenant-defined priority levels. |
| Social ownership | Default owner by account/category/platform/campaign. |
| Alert rules | Threshold, owner, severity, cooldown, scope. |
| Message/comment rules | API-backed when available; manual fallback always available. |
| Calendar labels | Content statuses, campaign types, asset link policy. |
| Dashboard widgets | Widget library, saved views, role defaults. |
| Feature flags | Publishing, replies, messages, multi-platform API sync. |

### Acceptance criteria

- Tenant admin can add a new account category and use it in registry filters and alert-rule scopes.
- Tenant admin can change what counts as an actionable alert without code edits.
- Tenant admin can disable publishing while preserving calendar planning.

## Current MVP Implementation

The current Social MVP is implemented through:

- `/screenprinting` for the first combined admin/sales/social workspace UI
- `/api/runtime/organizations/[slug]/screenprinting/social/dashboard`
- `/api/runtime/organizations/[slug]/screenprinting/social/accounts`
- `/api/runtime/organizations/[slug]/screenprinting/social/posts`
- `/api/runtime/organizations/[slug]/screenprinting/social/calendar`
- `/api/runtime/organizations/[slug]/screenprinting/social/campaigns`
- `/api/runtime/organizations/[slug]/screenprinting/social/alerts`
- `/api/runtime/organizations/[slug]/screenprinting/social/threads`

Manual import is the first-class fallback. Comments/replies, messages, and publishing are permission-gated by Meta connector state, scopes, owned-account IDs, and tenant feature flags.
