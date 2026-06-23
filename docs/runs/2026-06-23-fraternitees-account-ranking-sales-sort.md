# FraterniTees Account Ranking Sales Sort

## Summary

Added FraterniTees account-ranking sort controls for latest sale date and salesperson, wired Printavo invoice owner attribution into runtime account/order rows, and expanded the Sales & Social order cockpit with date-window filtering and sort controls. A production change-request queue check found five open FraterniTees requests; the calendar-year and manual-grade requests were already implemented, noindex/mobile zoom prevention was already present, and the invoice-owner/date request is covered by the new order cockpit controls plus the existing manager filter.

## Scope

| Field | Value |
|---|---|
| Lane | tenant-specific |
| Tenant type | Screenprinting |
| Tenant | FraterniTees |
| Risk level | medium |

## Changed Files

- `components/accounts/fraternitees-lead-qualification-module.tsx`
- `components/screenprinting/screenprinting-workspace.tsx`
- `docs/runs/2026-06-23-fraternitees-account-ranking-sales-sort.md`
- `lib/application/fraternitees/account-directory-service.ts`
- `lib/application/fraternitees/account-insights.ts`
- `lib/application/fraternitees/lead-scoring.ts`
- `lib/application/fraternitees/runtime-import-service.ts`
- `lib/domain/runtime.ts`
- `lib/infrastructure/adapters/printavo/client.ts`
- `package.json`
- `scripts/backfill-fraternitees-salesperson-attribution.mjs`
- `scripts/test-fraternitees-account-ranking-sort.mjs`
- `scripts/test-screenprinting-order-filters-ui.mjs`
- `scripts/verify.mjs`
- `supabase/migrations/20260423201000_fraternitees_account_directory_views.sql`
- `supabase/migrations/20260623123000_fraternitees_account_ranking_sales_sort.sql`
- `tenants/fraternitees/workspace.json`

## Commands Run

```bash
node scripts/test-fraternitees-account-ranking-sort.mjs
npm install
npm run check:fraternitees-account-ranking-sort
node scripts/test-screenprinting-order-filters-ui.mjs
npm run check:screenprinting-order-filters-ui
npm run typecheck
npm run lint
npm run verify
node --input-type=module <browser QA script against http://localhost:3013>
supabase apply_migration fraternitees_account_ranking_sales_sort
MAP_APP_ENV_FILE=/Users/brycejohnson/Code/map-app/.env.local PRINTAVO_OWNER_PAGE_LIMIT=8 PRINTAVO_OWNER_PAGE_DELAY_MS=1500 node scripts/backfill-fraternitees-salesperson-attribution.mjs all
```

## Results

| Check | Result | Notes |
|---|---|---|
| RED account-ranking contract | pass | Failed first because `normalizeAccountRankingSort` did not exist. |
| RED Sales & Social filter contract | pass | Failed first because `dateFrom` was missing. |
| Typecheck | pass | Run after implementation. |
| Lint | pass | Run after implementation. |
| Tenant isolation | pass | `npm run verify`. |
| Self-contained docs | pass | `npm run verify`. |
| Tenant type docs | pass | `npm run verify`. |
| Build | pass | `npm run verify`. |
| Smoke/browser | pass | Playwright checked `/accounts?org=fraternitees&sort=last_order_date`, `/accounts?org=fraternitees&sort=salesperson`, and `/screenprinting?org=fraternitees` order filters on `http://localhost:3013`. |
| Production migration | pass | Applied `fraternitees_account_ranking_sales_sort`; production view now returns `sales_rep_names` and `primary_sales_rep`. |
| Production attribution backfill | partial/pass | Existing `order_record.sales_rep_name` values aggregated to 2,277 accounts. First bounded Printavo owner scan checked 200 newest 2026 orders and found no additional missing owner rows. |
| Change requests | pass | Five target FraterniTees requests were marked `resolved`, the terminal status allowed by production. |

## Tenant Behavior Preserved

- FraterniTees: Existing score, close-rate, order-count, grade, DNC, calendar-year, manager filter, saved view, and manual grade workflows remain available.
- PICC: No PICC runtime, docs, or tenant behavior changed.

## Acceptance Criteria

- [x] Account ranking can be sorted by latest sale date.
- [x] Account ranking can be sorted by salesperson.
- [x] Account ranking rows show salesperson and last-sale context.
- [x] Printavo owner attribution is captured into runtime order/account rows for future syncs.
- [x] Sales & Social orders can filter by date window and existing invoice owner/manager.
- [x] Sales & Social orders can sort by date, salesperson, and order total.
- [x] Production account rows aggregate existing salesperson attribution.
- [x] Relevant production change requests are marked resolved.
- [x] Full repo verification passes.
- [x] Browser check confirms the visible controls render.

## Remaining Risk

- Existing historical order rows without `sales_rep_name` still need additional staged Printavo owner scans or normal syncs after deployment; the first bounded production scan covered 200 newest 2026 Printavo orders and did not find extra missing owner values.
- The queued request says "date paid"; current runtime data has order/invoice date and payment status, but not a distinct paid-at timestamp. The UI filters by sales/order date until Printavo payment transaction dates are ingested.

## Follow-Up

- Continue staged Printavo owner backfill scans if every historical order must have salesperson attribution; the checkpoint is `/tmp/map-app-fraternitees-salesperson-backfill.json`.
