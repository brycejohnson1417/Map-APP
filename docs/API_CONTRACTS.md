# API Contracts

## Purpose

This file documents current runtime API contracts and the target additive Screenprinting API contracts.

For database contracts, read [DATA_MODEL.md](DATA_MODEL.md). For vocabulary, read [GLOSSARY.md](GLOSSARY.md).

## Shared Response Rules

- Success responses include `ok: true`.
- Error responses include `ok: false` and `error`.
- Tenant runtime routes use `[slug]` as the organization slug.
- Tenant-mutating routes must require tenant-session access.
- Tenant data returned by API routes must be scoped by `organization_id` resolved from the slug.
- Provider secrets must never be returned in API responses.

## Current Runtime Routes

### `GET /api/runtime/health`

Purpose: runtime health and environment readiness.

Response:

```json
{
  "ok": true,
  "runtime": "supabase-first",
  "supabaseConfigured": true,
  "connectorSecretEnvelopeConfigured": true,
  "checkedAt": "2026-04-27T00:00:00.000Z"
}
```

Cache: `private, max-age=15, stale-while-revalidate=60`.

### `GET /api/runtime/organizations/[slug]`

Purpose: organization runtime snapshot.

Success response:

```json
{
  "ok": true,
  "snapshot": {
    "organization": "Organization",
    "integrations": ["IntegrationInstallation"],
    "recentSyncJobs": ["SyncJob"],
    "syncCursors": ["SyncCursor"],
    "syncJobStatusCounts": [{ "status": "queued", "count": 1 }],
    "recentAuditEvents": ["AuditEvent"]
  }
}
```

Errors:

- `404 { "ok": false, "error": "organization_not_found" }`

Cache: `private, max-age=10, stale-while-revalidate=60`.

### `GET /api/runtime/organizations/[slug]/accounts/[accountId]`

Purpose: account detail runtime payload.

Success response:

```json
{
  "ok": true,
  "detail": {
    "organization": "Organization",
    "account": {
      "id": "uuid",
      "name": "Account name",
      "status": "active",
      "leadStatus": null,
      "latitude": 40.0,
      "longitude": -73.0,
      "customFields": {}
    },
    "identities": ["AccountIdentity"],
    "contacts": ["AccountContact"],
    "activities": ["AccountActivity"],
    "recentOrders": ["AccountOrder"],
    "allOrders": ["AccountOrder"],
    "orderSummary": {
      "totalOrders": 12,
      "totalRevenue": 12345.67,
      "nonTransferOrders": 12,
      "lastOrderDate": "2026-04-23",
      "customerSinceDate": "2024-01-15"
    }
  }
}
```

Errors:

- `404 { "ok": false, "error": "account_not_found" }`

Cache: `private, max-age=10, stale-while-revalidate=45`.

### `POST /api/runtime/organizations/[slug]/accounts/[accountId]/check-ins`

Purpose: create tenant account activity note.

Auth: tenant-session required.

Request:

```json
{
  "note": "Met with customer and confirmed reorder timing."
}
```

Success response:

```json
{
  "ok": true,
  "activity": {
    "id": "uuid",
    "activityType": "check_in",
    "summary": "Met with customer and confirmed reorder timing.",
    "occurredAt": "2026-04-27T00:00:00.000Z"
  }
}
```

Errors:

- `401` when tenant login is missing
- `400 { "ok": false, "error": "note_required" }`
- `404 { "ok": false, "error": "account_not_found" }`

Cache: `no-store`.

### `POST /api/runtime/organizations/[slug]/accounts/[accountId]/ppp-savings`

Purpose: calculate PICC savings report.

Request:

```json
{
  "year": 2026
}
```

Success response:

```json
{
  "ok": true,
  "report": "PppSavingsReport"
}
```

Errors:

- `404 { "ok": false, "error": "account_not_found" }`

Cache: `no-store`.

### `GET /api/runtime/organizations/[slug]/territory/pins`

Purpose: filtered territory dashboard and pins.

Query parameters:

| Param | Meaning |
|---|---|
| `q` | Search text. |
| `flag` | One of `missing_referral_source`, `missing_sample_delivery`, `no_address_available`, `dnc_flagged`. |
| `rep` | Sales rep facet value. |
| `status` | Account status facet value. |
| `referralSource` | Referral/source facet value. |
| `vendorDayStatus` | Vendor day facet value. |
| `leadGrade` | FraterniTees lead grade facet value. |

Success response:

```json
{
  "ok": true,
  "counts": {
    "accounts": 100,
    "geocodedPins": 90,
    "orders": 250,
    "contacts": 80,
    "territoryBoundaries": 3,
    "territoryMarkers": 4,
    "noReferralSource": 10,
    "noLastSampleDeliveryDate": 12,
    "noAddressAvailable": 5,
    "dncFlagged": 2
  },
  "appliedFilters": {
    "search": null,
    "flag": null,
    "rep": null,
    "status": null,
    "referralSource": null,
    "vendorDayStatus": null,
    "leadGrade": null
  },
  "repFacets": [{ "name": "Rep", "count": 10 }],
  "statusFacets": [{ "name": "active", "count": 10 }],
  "referralSourceFacets": [],
  "vendorDayFacets": [],
  "leadGradeFacets": [],
  "pins": ["TerritoryAccountPin"]
}
```

Errors:

- `404 { "ok": false, "error": "organization_not_found" }`

Cache: `private, max-age=10, stale-while-revalidate=45`.

### `GET /api/runtime/organizations/[slug]/territory/overlays`

Purpose: tenant territory boundaries and markers.

Success response:

```json
{
  "ok": true,
  "boundaries": ["TerritoryBoundaryRuntime"],
  "markers": ["TerritoryMarkerRuntime"]
}
```

Errors:

- `404 { "ok": false, "error": "organization_not_found" }`

Cache: `private, max-age=10, stale-while-revalidate=45`.

### `GET /api/runtime/organizations/[slug]/territory/map-config`

Purpose: browser map provider config for a tenant.

Success response:

```json
{
  "ok": true,
  "mapProvider": "google_maps",
  "browserApiKey": "browser-safe-key-or-null",
  "tileUrlTemplate": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "tileAttribution": "&copy; OpenStreetMap contributors",
  "configured": true,
  "upgraded": true
}
```

Errors:

- `404 { "ok": false, "error": "organization_not_found" }`

Cache: `private, max-age=300, stale-while-revalidate=900`.

### `GET /api/runtime/organizations/[slug]/sync-jobs`

Purpose: sync operations visibility.

Success response:

```json
{
  "ok": true,
  "organization": "Organization",
  "statusCounts": [{ "status": "success", "count": 10 }],
  "currentSyncErrors": 0,
  "cursors": ["SyncCursor"],
  "jobs": ["SyncJob"]
}
```

Errors:

- `404 { "ok": false, "error": "organization_not_found" }`

Cache: `private, max-age=5, stale-while-revalidate=20`.

### `POST /api/runtime/organizations/[slug]/connectors`

Purpose: self-serve connector install/update.

Auth: tenant-session required.

Request:

```json
{
  "provider": "printavo",
  "fields": {
    "email": "ops@example.com",
    "apiKey": "secret"
  }
}
```

Success response:

```json
{
  "ok": true,
  "integration": {
    "id": "uuid",
    "provider": "printavo",
    "displayName": "Printavo",
    "externalAccountId": "ops@example.com",
    "status": "active",
    "updatedAt": "2026-04-27T00:00:00.000Z"
  }
}
```

Errors:

- `401` when tenant login is missing
- `400` for invalid provider, disabled connector, or missing required fields
- `403` for guided-only connectors
- `404` for missing organization

### `GET /api/runtime/organizations/[slug]/connectors/meta/oauth/start`

Purpose: start tenant-facing Meta/Instagram OAuth for owned Instagram account connection.

Auth: tenant-session required.

Query:

```text
mode=instagram_business_login | facebook_login_business
```

Behavior:

- Resolves tenant connection mode preferences and platform-owned Meta app credentials from backend env.
- Redirects to Instagram Login for `instagram_business_login`.
- Redirects to Facebook Login for Business for `facebook_login_business`.
- Returns to the global callback route with signed tenant state.

Errors redirect back to `/integrations?org=<slug>&meta_oauth_error=<message>` when platform app credentials or tenant state are missing.

### `GET /api/runtime/connectors/meta/oauth/callback`

Purpose: complete Meta/Instagram OAuth, store encrypted token, and attempt owned-account discovery.

Auth: signed OAuth state; tenant session is normally present from the start route.

Behavior:

- Exchanges OAuth code for an access token using the selected Meta mode.
- Stores the tenant authorization token in `integration_secret`.
- Updates the `meta` integration config with auth mode, Graph API version, scopes, and OAuth status.
- Runs owned-account scan when required scopes permit it.
- Redirects to `/screenprinting?org=<slug>&module=social&social=accounts`.

Errors redirect back to `/integrations?org=<slug>&meta_oauth_error=<message>`.

### `GET /api/runtime/organizations/[slug]/connectors/meta/oauth/callback`

Purpose: legacy slug-scoped callback compatibility route.

Behavior: verifies that signed OAuth state matches the slug, then uses the same callback completion path as the global route. New Meta app configuration should register the global callback URL only.

### `GET /api/runtime/organizations/[slug]/plugins`

Purpose: read tenant plugin capability settings.

Success response:

```json
{
  "ok": true,
  "plugins": {
    "routePlanning": { "enabled": true },
    "printavoSync": { "enabled": true },
    "runtimeDiagnostics": { "enabled": true }
  }
}
```

### `PATCH /api/runtime/organizations/[slug]/plugins`

Purpose: update tenant plugin capability setting.

Auth: tenant-session required.

Request:

```json
{
  "plugin": "printavoSync",
  "enabled": true
}
```

Valid plugin keys today: `routePlanning`, `printavoSync`, `runtimeDiagnostics`.

Success response:

```json
{
  "ok": true,
  "plugins": {}
}
```

Errors:

- `401` when tenant login is missing
- `400` for invalid plugin or missing boolean
- `404` for missing organization

### `POST /api/runtime/organizations/[slug]/geocode-accounts`

Purpose: geocode missing account coordinates under tenant geocoding policy.

Auth: tenant-session required.

Request:

```json
{
  "limit": 25
}
```

Success response:

```json
{
  "ok": true,
  "summary": {
    "attempted": 25,
    "updated": 20,
    "skipped": 5,
    "errors": []
  }
}
```

Errors:

- `401` when tenant login is missing
- `404` when organization is missing
- `502` for provider/geocode failures

### `POST /api/runtime/organizations/[slug]/integrations/notion/queue`

Purpose: queue dirty Notion page sync work.

Auth: tenant-session required.

Request:

```json
{
  "pageIds": ["notion-page-id"],
  "reason": "manual_refresh"
}
```

Rules: `pageIds` must include 1 to 100 non-empty strings. `reason` must be 3 to 120 characters and defaults to `manual_refresh`.

Success response:

```json
{
  "ok": true,
  "queued": true,
  "job": "SyncJob"
}
```

Status: `202`.

Errors:

- `401` when tenant login is missing
- `400 { "ok": false, "error": "invalid_request", "issues": [] }`
- `500` for unexpected failures

Cache: `no-store`.

### `GET /api/runtime/organizations/[slug]/printavo/sync`

Purpose: read Printavo sync status for a tenant with Printavo enabled.

Auth: tenant-session required.

Success response:

```json
{
  "ok": true,
  "status": {
    "cursor": "SyncCursor or null",
    "lastSuccessfulSyncAt": "2026-04-27T00:00:00.000Z",
    "lastError": null
  }
}
```

Errors:

- `401` when tenant login is missing
- `400` when Printavo is not enabled for the tenant workspace
- `404` for missing organization
- `502` for sync status failure

### `POST /api/runtime/organizations/[slug]/printavo/sync`

Purpose: run read-only Printavo sync.

Auth: tenant-session required.

Request:

```json
{
  "email": "ops@example.com",
  "apiKey": "secret",
  "mode": "latest",
  "pageLimit": 3,
  "pageSize": 25,
  "reset": false
}
```

Rules:

- `mode` is `latest` or `backfill`; default `latest`.
- `latest` page limit is clamped from 1 to 5.
- `backfill` page limit is clamped from 1 to 20.
- `pageSize` is clamped from 1 to 25.
- email/api key are optional when a saved tenant connector secret is available.

Success response:

```json
{
  "ok": true,
  "mode": "latest",
  "ordersFetched": 75,
  "accountsUpserted": 10,
  "contactsUpserted": 5,
  "ordersUpserted": 75,
  "warnings": []
}
```

Errors:

- `401` when tenant login is missing
- `400` when Printavo is not enabled for the tenant workspace
- `404` for missing organization
- `502` for sync failure

### `POST /api/runtime/organizations/[slug]/printavo/preview`

Purpose: preview Printavo statuses and sample lead scores without saving credentials.

Auth: tenant-session required.

Request:

```json
{
  "email": "ops@example.com",
  "apiKey": "secret"
}
```

Success response:

```json
{
  "ok": true,
  "statuses": [],
  "statusFilters": {},
  "sampleOrderCount": 25,
  "scores": []
}
```

Errors:

- `401` when tenant login is missing
- `400` when email/api key are missing
- `502` for provider failure

### `GET /api/runtime/organizations/[slug]/printavo/automation`

Purpose: read tenant Printavo daily sync automation settings.

Auth: tenant-session required.

Success response:

```json
{
  "ok": true,
  "automation": {
    "enabled": true,
    "hourUtc": 8
  }
}
```

Errors:

- `401` when tenant login is missing
- `404` for missing organization

### `PATCH /api/runtime/organizations/[slug]/printavo/automation`

Purpose: update tenant Printavo daily sync automation settings.

Auth: tenant-session required.

Request:

```json
{
  "enabled": true,
  "hourUtc": 8
}
```

Success response:

```json
{
  "ok": true,
  "automation": {
    "enabled": true,
    "hourUtc": 8
  }
}
```

Errors:

- `401` when tenant login is missing
- `400` when `enabled` is not a boolean
- `404` for missing organization

### `GET /api/runtime/organizations/[slug]/change-requests`

Purpose: list tenant change requests.

Auth: tenant-session required.

Success response:

```json
{
  "ok": true,
  "requests": ["ChangeRequest"]
}
```

Errors:

- `401` when tenant login is missing
- `404` for missing organization

### `POST /api/runtime/organizations/[slug]/change-requests`

Purpose: create tenant change request with optional attachments and capture context.

Auth: tenant-session required.

Content type: `multipart/form-data`.

Fields:

| Field | Required | Notes |
|---|---:|---|
| `title` | yes | Non-empty. |
| `problem` | yes | Non-empty. |
| `requestedOutcome` | yes | Non-empty. |
| `currentUrl` | no | Page URL. |
| `surface` | no | Surface/module label. |
| `classification` | no | `config`, `package`, `primitive`, or `core`. |
| `businessContext` | no | Context. |
| `acceptanceCriteria` | no | User-visible done condition. |
| `captureContext` | no | JSON capture context. |
| `attachments` | no | One or more files. |

Success response:

```json
{
  "ok": true,
  "request": "ChangeRequest",
  "warnings": []
}
```

Errors:

- `401` when tenant login is missing
- `400` when title/problem/requested outcome are missing or service validation fails
- `404` for missing organization

### `PATCH /api/runtime/organizations/[slug]/change-requests/[requestId]`

Purpose: update tenant change request.

Auth: tenant-session required.

Content type: `multipart/form-data`.

Fields:

| Field | Required | Notes |
|---|---:|---|
| `title` | yes | Non-empty. |
| `problem` | yes | Non-empty. |
| `requestedOutcome` | yes | Non-empty. |
| `businessContext` | no | Context. |
| `acceptanceCriteria` | no | Done condition. |
| `status` | no | `queued`, `resolved`, `declined`, `stale`, `requires_additional_feedback`. |
| `attachments` | no | Additional files. |

Success response:

```json
{
  "ok": true,
  "request": "ChangeRequest",
  "warnings": []
}
```

Errors:

- `401` when tenant login is missing
- `400` for missing required fields or service validation failure
- `404` for missing organization

### `DELETE /api/runtime/organizations/[slug]/change-requests/[requestId]`

Purpose: delete tenant change request.

Auth: tenant-session required.

Success response:

```json
{ "ok": true }
```

Errors:

- `401` when tenant login is missing
- `404` for missing organization or request

### `POST /api/tenant-session`

Purpose: resolve tenant access from an email and write tenant-session cookies.

Request:

```json
{
  "email": "person@example.com"
}
```

Success response:

```json
{
  "ok": true,
  "access": {
    "slug": "fraternitees",
    "templateId": "fraternity-sales"
  }
}
```

Errors:

- `400 { "ok": false, "error": "Enter a valid work email address." }`

### `DELETE /api/tenant-session`

Purpose: clear tenant-session cookies.

Success response:

```json
{ "ok": true }
```

### `POST /api/onboarding/bootstrap`

Purpose: create a new organization from a tenant workspace seed and write tenant-session cookies.

Request:

```json
{
  "templateId": "fraternity-sales",
  "email": "owner@example.com",
  "companyName": "Example Screenprinter",
  "slug": "example-screenprinter"
}
```

Validation:

- `templateId`: non-empty string matching a workspace seed id.
- `email`: valid email.
- `companyName`: 2 to 120 characters.
- `slug`: 2 to 48 lowercase letters, numbers, and hyphens.
- guided-only tenant types require an allowed email domain.

Success response:

```json
{
  "ok": true,
  "organization": {
    "id": "uuid",
    "slug": "example-screenprinter",
    "name": "Example Screenprinter"
  },
  "redirectTo": "/o/example-screenprinter/integrations"
}
```

Errors:

- `400` for invalid payload or unknown tenant type/workspace seed
- `403` for guided setup domain restriction
- `409` when slug already exists

## Target Additive Screenprinting API Contracts

These routes should be added when implementing the full Screenprinting tenant type. They must remain read-only to Printavo in the first implementation. Mutations write only product-owned configuration, opportunities, drafts, social links, alerts, dashboards, or review state.

### `GET /api/runtime/organizations/[slug]/screenprinting/config`

Purpose: return compiled Screenprinting config.

Response:

```json
{
  "ok": true,
  "config": {
    "statusMappings": [],
    "tagMappings": [],
    "fieldTrust": [],
    "categories": [],
    "reorderRules": [],
    "emailTemplates": [],
    "socialAccountCategories": [],
    "alertRules": [],
    "dashboards": [],
    "featureFlags": {}
  },
  "source": {
    "tenantTypeVersion": 1,
    "workspaceVersion": 1,
    "organizationOverridesVersion": 1
  }
}
```

Acceptance check: changing a saved config value changes downstream Sales/Social list filters without code edits.

### `PATCH /api/runtime/organizations/[slug]/screenprinting/config`

Purpose: update tenant-owned Screenprinting configuration.

Auth: tenant-session admin/owner required when role enforcement exists; tenant-session required until roles are enforced.

Request:

```json
{
  "section": "statusMappings",
  "changes": [
    {
      "sourceValue": "Quote Sent",
      "targetBucket": "quoted",
      "trustLevel": "trusted",
      "enabled": true
    }
  ],
  "previewToken": "optional-impact-preview-token"
}
```

Response:

```json
{
  "ok": true,
  "config": {},
  "impact": {
    "affectedOrders": 42,
    "affectedAccounts": 17,
    "affectedDashboards": ["sales_overview"]
  }
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/config/preview`

Purpose: preview impact before saving mapping changes.

Request:

```json
{
  "section": "statusMappings",
  "draftChanges": []
}
```

Response:

```json
{
  "ok": true,
  "previewToken": "token",
  "impact": {
    "affectedOrders": 42,
    "quotedCountDelta": 12,
    "completedCountDelta": -2,
    "dirtyRecords": 4,
    "warnings": []
  }
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/sales/dashboard`

Purpose: Sales dashboard metrics.

Query parameters: `from`, `to`, `dateRange`, `rep`, `team`, `category`, `compare`.

Response:

```json
{
  "ok": true,
  "metrics": {
    "revenue": 378900,
    "averageOrderValue": 3643,
    "bulkOrders": 104,
    "personalSales": 104,
    "repeatRevenue": 1800000,
    "dueReorders": 82
  },
  "ticker": [],
  "managerPerformance": [],
  "periodPerformance": [],
  "dirtyDataWarnings": []
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/sales/orders`

Purpose: read-only Printavo-derived order list.

Query parameters: `q`, `statusBucket`, `paymentBucket`, `productionFrom`, `productionTo`, `customerDueFrom`, `customerDueTo`, `rep`, `team`, `synced`, `savedView`, `page`, `pageSize`.

Response:

```json
{
  "ok": true,
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "6538",
      "customerName": "Education Bar Crawl",
      "status": "JOB COMPLETE",
      "statusBucket": "completed",
      "paymentBucket": "paid",
      "orderTotal": 183.12,
      "productionDate": "2026-04-23",
      "customerDueDate": "2026-04-23",
      "managerName": "Jenna",
      "teamName": "Greek",
      "sourceUrl": "https://..."
    }
  ],
  "facets": {},
  "savedViews": [],
  "pagination": {}
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/sales/saved-views`

Purpose: list tenant-scoped order saved views stored in `dashboard_definition`.

Query parameters: `module` (defaults to `sales_orders`).

Response:

```json
{
  "ok": true,
  "savedViews": []
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/sales/saved-views`

Purpose: create a product-owned saved view. No Printavo write-back.

Request:

```json
{
  "module": "sales_orders",
  "name": "Unpaid Greek orders",
  "filters": {
    "paymentBucket": "unpaid",
    "teamName": "Greek"
  },
  "columns": ["customer", "job", "total", "status"],
  "sort": { "key": "orderCreatedAt", "direction": "desc" }
}
```

Response:

```json
{
  "ok": true,
  "savedView": {}
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/sales/orders/[orderId]`

Purpose: order detail and line items.

Response:

```json
{
  "ok": true,
  "order": {
    "id": "uuid",
    "source": "printavo",
    "sourceUrl": "https://...",
    "totals": {
      "total": 183.12,
      "cost": null,
      "margin": null
    },
    "lineItems": [],
    "customer": {},
    "sourcePayloadAvailable": true
  }
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/sales/manager-goals`

Purpose: read persisted monthly manager goals with current Printavo-derived actuals.

Query parameters: `period` as `YYYY-MM`.

Response:

```json
{
  "ok": true,
  "period": "2026-04",
  "goals": [],
  "source": "persisted"
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/sales/manager-goals`

Purpose: save monthly manager goals in product-owned tenant storage.

Request:

```json
{
  "period": "2026-04",
  "goals": [
    {
      "managerName": "Jenna Koss",
      "revenueGoal": 50000,
      "ordersGoal": 20,
      "storesGoal": 3
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "period": "2026-04",
  "goals": []
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/sales/opportunities`

Purpose: opportunity board/list.

Query parameters: `pipeline`, `stage`, `owner`, `source`, `accountId`, `view`.

Response:

```json
{
  "ok": true,
  "pipelines": [
    {
      "key": "sales_pipeline",
      "stages": [
        {
          "key": "new_lead",
          "label": "New Lead",
          "count": 2,
          "value": 1000,
          "opportunities": []
        }
      ]
    }
  ]
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/sales/opportunities`

Purpose: create product-owned opportunity.

Request:

```json
{
  "accountId": "uuid",
  "title": "Spring reorder",
  "pipelineKey": "sales_pipeline",
  "stageKey": "new_lead",
  "value": 1000,
  "sourceType": "reorder",
  "dueAt": "2026-05-01T15:00:00.000Z"
}
```

Response:

```json
{
  "ok": true,
  "opportunity": {}
}
```

### `PATCH /api/runtime/organizations/[slug]/screenprinting/sales/opportunities/[opportunityId]`

Purpose: update product-owned opportunity stage, owner, value, status, due date, or links.

Response:

```json
{
  "ok": true,
  "opportunity": {}
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/sales/reorders`

Purpose: reorder signals and follow-up state.

Query parameters: `bucket`, `owner`, `category`, `from`, `to`, `accountId`.

Response:

```json
{
  "ok": true,
  "buckets": {
    "overdue": [],
    "due": [],
    "upcoming": [],
    "snoozed": []
  },
  "counts": {
    "overdue": 3,
    "due": 82,
    "upcoming": 114
  }
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/sales/reorders/[signalId]/snooze`

Purpose: snooze a reorder signal.

Request:

```json
{
  "snoozedUntil": "2026-05-15",
  "reason": "Customer asked to revisit after finals"
}
```

Response:

```json
{
  "ok": true,
  "reorderSignal": {}
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/sales/email-drafts`

Purpose: render a draft-only email from an editable tenant-owned email template.

Request:

```json
{
  "templateKey": "reorder_follow_up",
  "accountId": "uuid",
  "contactId": "uuid",
  "opportunityId": "uuid",
  "reorderSignalId": "uuid"
}
```

Response:

```json
{
  "ok": true,
  "draft": {
    "to": "customer@example.com",
    "subject": "Re-order time?",
    "body": "Draft body",
    "copyText": "Full email text"
  }
}
```

No email is sent.

### `POST /api/runtime/organizations/[slug]/screenprinting/sales/email-drafts/[draftId]/mark-sent`

Purpose: manually record that a draft was sent outside the app.

Response:

```json
{
  "ok": true,
  "activity": {}
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/dashboard`

Purpose: Social overview.

Query parameters: `from`, `to`, `accountCategory`, `platform`, `ownership`.

Response:

```json
{
  "ok": true,
  "metrics": {
    "trackedAccounts": 154,
    "activeAccounts": 153,
    "totalPosts": 166,
    "newPosts": 157,
    "unreadAlerts": 16,
    "totalEngagement": 98600
  },
  "activity": {
    "posts": [],
    "likes": [],
    "comments": [],
    "views": []
  },
  "recentAlerts": [],
  "coverageBreakdown": []
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/connection`

Purpose: Meta/Instagram connector readiness and capability state.

Response:

```json
{
  "ok": true,
  "connection": {
    "provider": "meta",
    "platform": "instagram",
    "graphApiVersion": "v24.0",
    "configured": true,
    "preferredMode": "instagram_business_login",
    "permissionState": {
      "requiredScopes": ["instagram_business_basic", "instagram_business_manage_insights"],
      "optionalScopes": ["instagram_business_manage_comments", "instagram_business_manage_messages", "instagram_business_content_publish"],
      "missingPermissions": []
    },
    "capabilities": {
      "ownedAccountDiscovery": true,
      "watchedAccountManualImport": true,
      "watchedAccountApiEnrichment": true,
      "readPosts": true,
      "readInsights": true,
      "replyToComments": true,
      "replyToMessages": true,
      "publishPosts": true
    }
  }
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/accounts`

Purpose: owned/watched social account registry.

Query parameters: `q`, `platform`, `priority`, `category`, `status`, `ownership`, `kind`, `schoolOrOrg`, `linkedAccountId`.

Response:

```json
{
  "ok": true,
  "accounts": [
    {
      "id": "uuid",
      "platform": "instagram",
      "handle": "example.store",
      "displayName": "Example Store",
      "ownership": "owned",
      "category": "partner",
      "priority": "medium",
      "status": "active",
      "followerCount": 7900,
      "postCount": 34,
      "lastSyncedAt": "2026-04-27T00:00:00.000Z",
      "linkedAccount": null
    }
  ],
  "facets": {},
  "pagination": {}
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/accounts`

Purpose: manual social account import/create.

Request:

```json
{
  "platform": "instagram",
  "handle": "example.store",
  "ownership": "watched",
  "category": "customer",
  "priority": "high",
  "accountId": "uuid",
  "externalAccountId": "178414...",
  "metaPageId": "123456789",
  "metaBusinessId": "987654321",
  "profileUrl": "https://www.instagram.com/example.store/",
  "followerCount": 7900
}
```

Response:

```json
{
  "ok": true,
  "socialAccount": {}
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/accounts/scan`

Purpose: scan connected Meta-owned Instagram accounts when API credentials permit it.

Request:

```json
{
  "provider": "instagram",
  "installationId": "uuid"
}
```

Response:

```json
{
  "ok": true,
  "provider": "meta",
  "connection": {},
  "discovered": [{ "handle": "example.store", "ownership": "owned" }],
  "created": 0,
  "updated": 0,
  "warnings": []
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/accounts/[socialAccountId]`

Purpose: social account detail with connection state, metrics, posts, sync history, and organization links.

Response:

```json
{
  "ok": true,
  "socialAccount": {},
  "weeklyTrends": [],
  "posts": [],
  "syncHistory": [],
  "linkedEntities": []
}
```

### `PATCH /api/runtime/organizations/[slug]/screenprinting/social/accounts/[socialAccountId]`

Purpose: update tenant-owned social account category, priority, ownership, status, links, or owner.

Response:

```json
{
  "ok": true,
  "socialAccount": {}
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/posts`

Purpose: post/media monitoring list.

Query parameters: `platform`, `socialAccountId`, `postType`, `status`, `seen`, `from`, `to`, `campaignId`.

Response:

```json
{
  "ok": true,
  "posts": [
    {
      "id": "uuid",
      "postType": "story",
      "status": "published",
      "caption": "Post caption",
      "metrics": {
        "views": 470,
        "reach": 399,
        "replies": 0,
        "navigation": 429,
        "profileVisits": 0,
        "newFollows": 0,
        "likes": 52,
        "comments": 1,
        "shares": 0,
        "engagementRate": 0.007
      }
    }
  ],
  "pagination": {}
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/posts`

Purpose: create a product-owned draft social post for an owned/watched tenant account. Live publishing is a separate feature-gated Meta action.

Request:

```json
{
  "socialAccountId": "uuid",
  "postType": "post",
  "caption": "Draft caption",
  "mediaUrl": "https://cdn.example.com/post.png",
  "scheduledFor": "2026-05-01T15:00",
  "location": "Champaign, IL",
  "collaborators": ["athlete_handle"],
  "tags": ["drop", "illinois"]
}
```

Response:

```json
{
  "ok": true,
  "post": {
    "status": "draft"
  }
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/posts/[postId]/publish`

Purpose: publish a draft/planned post to an owned Instagram professional account through Meta Graph API.

Required:

- tenant session
- Meta connector with encrypted access token
- owned `social_account`
- `social_account.external_account_id` or metadata Instagram user ID
- public `mediaUrl`
- required read scopes
- `instagram_business_content_publish` or `instagram_content_publish`
- `social_publishing` feature flag

Response:

```json
{
  "ok": true,
  "post": {
    "status": "published",
    "externalPostId": "180..."
  }
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/posts/[postId]`

Purpose: post detail, metrics, comments, account stats, and links.

Response:

```json
{
  "ok": true,
  "post": {},
  "comments": [],
  "linkedCampaign": null,
  "linkedAccount": null,
  "permissions": {
    "canReply": true,
    "reason": null
  }
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/posts/[postId]/comments`

Purpose: reply/comment from an owned account where API permissions allow it.

Request:

```json
{
  "commentId": "18006022967821076",
  "message": "Thanks for the comment."
}
```

Response:

```json
{
  "ok": true,
  "comment": {},
  "activity": {}
}
```

If permissions are unavailable, return `403` with a clear `reason` and do not pretend the action succeeded.

### `GET /api/runtime/organizations/[slug]/screenprinting/social/calendar`

Purpose: content calendar and campaign planning.

Query parameters: `from`, `to`, `owner`, `status`, `campaignId`, `platform`.

Response:

```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "type": "planned_post",
      "title": "Launch post",
      "status": "planned",
      "scheduledFor": "2026-05-01T14:00:00.000Z",
      "owner": null,
      "campaign": null,
      "socialAccount": null,
      "assets": []
    }
  ]
}
```

Calendar records are product-owned. Publishing happens through the explicit `publish` route when Meta permissions and feature flags allow it.

### `GET /api/runtime/organizations/[slug]/screenprinting/social/campaigns`

Purpose: campaign list with linked social/sales outcomes.

Response:

```json
{
  "ok": true,
  "campaigns": []
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/campaigns`

Purpose: create product-owned campaign.

Request:

```json
{
  "name": "Finals Week Drop",
  "campaignType": "seasonal",
  "status": "planned",
  "startsOn": "2026-05-01",
  "endsOn": "2026-05-10",
  "goal": "Drive reorder conversations"
}
```

Response:

```json
{
  "ok": true,
  "campaign": {}
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/alerts`

Purpose: social alert inbox.

Query parameters: `status`, `severity`, `owner`, `eventType`, `socialAccountId`, `from`, `to`.

Response:

```json
{
  "ok": true,
  "alerts": [
    {
      "id": "uuid",
      "eventType": "engagement_spike",
      "title": "Engagement spike detected",
      "severity": "medium",
      "status": "unread",
      "metadata": {
        "threshold": "3%",
        "postsAboveThreshold": 29
      }
    }
  ],
  "counts": {
    "unread": 16
  }
}
```

### `PATCH /api/runtime/organizations/[slug]/screenprinting/social/alerts/[alertId]`

Purpose: mark read, assign, resolve, or dismiss social alert.

Request:

```json
{
  "status": "read",
  "ownerMemberId": "uuid"
}
```

Response:

```json
{
  "ok": true,
  "alert": {}
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/alerts/mark-all-read`

Purpose: mark filtered or all social alerts read.

Request:

```json
{
  "filters": {
    "eventType": "new_post"
  }
}
```

Response:

```json
{
  "ok": true,
  "updated": 16
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/social/threads`

Purpose: comments, messages, and manual social threads linked to customers/orgs.

Query parameters: `status`, `owner`, `platform`, `socialAccountId`, `accountId`, `contactId`, `opportunityId`.

Response:

```json
{
  "ok": true,
  "threads": []
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/threads`

Purpose: manual social thread/log creation when API access is unavailable or incomplete.

Request:

```json
{
  "platform": "instagram",
  "threadType": "manual",
  "participantHandle": "customer.handle",
  "accountId": "uuid",
  "summary": "Customer asked about rush shirts."
}
```

Response:

```json
{
  "ok": true,
  "thread": {},
  "activity": {}
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/social/threads/[threadId]/reply`

Purpose: send a reply through a connected owned Instagram account.

Required:

- tenant session
- Meta connector with encrypted access token
- owned `social_account`
- Instagram user ID for the owned account
- Instagram-scoped recipient ID from the thread or request body
- required read scopes
- `instagram_business_manage_messages` or `instagram_manage_messages`
- `messages` feature flag

Request:

```json
{
  "message": "Can you send sizes and a due date?",
  "recipientId": "IGSID"
}
```

Response:

```json
{
  "ok": true,
  "thread": {
    "status": "replied"
  }
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/dashboards`

Purpose: list custom tenant dashboards backed by `dashboard_definition`.

Response:

```json
{
  "ok": true,
  "dashboards": []
}
```

### `POST /api/runtime/organizations/[slug]/screenprinting/dashboards`

Purpose: create a custom dashboard from approved Screenprinting widget primitives.

Request:

```json
{
  "name": "Sales operator board",
  "widgets": ["sales_pulse", "reorder_queue", "social_alerts"]
}
```

Response:

```json
{
  "ok": true,
  "dashboard": {}
}
```

### `GET /api/runtime/organizations/[slug]/screenprinting/identity-resolution`

Purpose: non-destructive merge/link suggestion queue.

Query parameters: `status`, `sourceType`, `targetType`, `confidenceMin`.

Response:

```json
{
  "ok": true,
  "suggestions": [
    {
      "id": "uuid",
      "sourceType": "instagram_account",
      "sourceRef": {},
      "targetType": "account",
      "targetId": "uuid",
      "status": "suggested",
      "confidence": 0.92,
      "reason": "Handle and organization name match"
    }
  ]
}
```

### `PATCH /api/runtime/organizations/[slug]/screenprinting/identity-resolution/[suggestionId]`

Purpose: confirm, reject, ignore, or mark a suggestion needs review.

Request:

```json
{
  "status": "confirmed",
  "note": "Verified by sales owner"
}
```

Response:

```json
{
  "ok": true,
  "suggestion": {},
  "createdLinks": []
}
```

No source record is destroyed.

## API Acceptance Criteria

- Every route that reads tenant data resolves the slug to one `organization_id`.
- Every mutation requires tenant-session access.
- Admin/config mutations are role-gated when role enforcement exists; until then they must still be tenant-session gated and auditable.
- Printavo routes remain read-only to Printavo during the first Screenprinting implementation.
- Email routes create drafts and activity records only; they do not send email.
- Social publishing and reply routes must remain feature-flagged and permission-gated by Meta connector state.
- Error responses are JSON and actionable.
- `npm run verify` passes after route changes.

## Current Screenprinting API Implementation

The Screenprinting API contract is implemented under `/api/runtime/organizations/[slug]/screenprinting/*`.

Current behavior:

- read routes resolve the workspace slug and require `tenantType.id=screenprinting`
- mutating routes require tenant-session access
- config mutation writes tenant-owned organization settings and records audit events
- Printavo-derived order routes are read-only
- email draft routes render or record draft state only and do not send email
- social publish/comment/message routes call Meta only when connector token, scopes, owned-account IDs, and feature flags are present; otherwise they return permission/setup errors
- fixture fallback is available for Screenprinting tenant seeds without live product rows, including `second-screenprinter`
