# Screenprinting Operational UI Correction

## Scope

Correct the Screenprinting workspace so FraterniTees sees operational Sales/Social surfaces instead of generic or fake demo UI.

## Changed files

- `components/screenprinting/screenprinting-workspace.tsx`
- `lib/application/screenprinting/config.ts`
- `lib/application/screenprinting/repository.ts`
- `lib/application/screenprinting/screenprinting-service.ts`
- `docs/STATUS.md`
- `docs/TODO.md`
- `docs/ROADMAP.md`
- `docs/WORK_REGISTRY.json`
- `docs/tenant-types/screenprinting/SALES_MODULE.md`
- `docs/tenant-types/screenprinting/SOCIAL_MODULE.md`

## What changed

- Sales dashboard now uses real FraterniTees Printavo-backed metrics for revenue, AOV, customer count, due reorders, mapped status buckets, mapped payment buckets, manager performance, and weekly buckets.
- Orders now show the exact synced order count and latest real rows. Order detail modal shows trusted order facts and explicitly withholds profitability/margin as actuals until catalog/decorator cost data is reliable.
- Real saved tenants no longer receive fixture fallback rows for social accounts, posts, threads, alerts, or identity suggestions. Empty/permission states are shown instead.
- Social module now exposes manual account import, connected-account scan fallback, manual Instagram thread logging, campaign creation/listing, alert state updates, post insight/comment permission state, and identity-resolution review.
- Buttons now either call a tenant-scoped API, open a local workflow, copy/open draft text, or are disabled with an explicit reason.

## Live FraterniTees data checked

Runtime endpoint: `/api/runtime/organizations/fraternitees/screenprinting/sales/dashboard`

- `totalOrders`: `23673`
- `totalCustomers`: `4634`
- `revenue`: `$15,606,615.73`
- `averageOrderValue`: `$1,380.26`
- `dueReorders`: `2046`
- `quotedOrders`: `125`
- `inProductionOrders`: `4133`
- `completedOrders`: `11724`
- `cancelledOrders`: `7571`
- `paidOrders`: `11223`
- `unpaidOrders`: `12425`
- Printavo sync status: `23,673` orders and `5,357` accounts, last successful sync `2026-04-27T05:22:17.366+00:00`

## Browser verification

Browser/IAB verification was used at `http://localhost:3000/screenprinting?org=fraternitees`.

Verified visible surfaces:

- Sales dashboard showed live FraterniTees Printavo numbers, not placeholders.
- Orders surface showed `23,673` total Printavo orders and latest real rows.
- Order detail modal opened from a real row and showed a profitability warning instead of fake margin.
- Social dashboard showed honest empty states for FraterniTees because no social accounts/posts are currently persisted.
- Messages surface showed a manual thread logging form and empty state.
- Campaigns surface showed a campaign creation form and persisted-campaign list/empty state.
- Admin config showed mappings, feature flags, UI audit rules, and identity-resolution empty state.

The Browser/IAB direct `goto` call timed out once, so the Playwright tab control loaded the route and Browser/IAB was then used for screenshots and inspection from the selected tab.

## Commands run

```bash
npm run typecheck
npm run lint
npm run verify
curl -sS http://127.0.0.1:3000/api/runtime/organizations/fraternitees/screenprinting/sales/dashboard
```

## Passed

- TypeScript typecheck passed.
- Oxlint passed with zero warnings/errors.
- Work registry JSON validated.
- `npm run verify` passed, including typecheck, lint, tenant isolation, work registry, Screenprinting foundation, self-contained requirements, tenant type docs, and production build.
- Browser inspection passed for the core Sales/Social/Admin surfaces listed above.

## Still risky

- Authenticated tenant-session mutation flows should get dedicated E2E coverage for manual social account import, manual thread logging, campaign creation, alert updates, and identity-resolution approvals.
- FraterniTees still needs final tenant decisions for status mappings, field trust, owned/watched social accounts, social alert thresholds, and follow-up ownership.
- Profitability remains intentionally deferred until catalog/decorator cost adapters and trusted line-item cost data exist.
