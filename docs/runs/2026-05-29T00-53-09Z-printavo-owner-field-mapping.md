# Printavo Owner Field Mapping

## Summary

The FraterniTees Printavo sync was dropping available order ownership data. Live GraphQL introspection confirmed `Invoice.owner` and `Quote.owner` exist and return a `User` with `id`, `name`, and `email`. The sync now requests those fields, stores the owner name in `order_record.sales_rep_name`, keeps owner id/email in `source_payload`, maps customer due dates into `delivery_date`, and keeps the real Printavo URLs for order deep links.

Linked issue: https://github.com/brycejohnson1417/Map-APP/issues/162

## Scope

| Field | Value |
|---|---|
| Lane | adapter |
| Tenant type | Screenprinting |
| Tenant | FraterniTees |
| Risk level | medium |

## Changed Files

- `lib/infrastructure/adapters/printavo/client.ts`
- `lib/application/fraternitees/lead-scoring.ts`
- `lib/application/fraternitees/runtime-import-service.ts`
- `lib/application/screenprinting/screenprinting-service.ts`

## Printavo Data Findings

| Surface | Useful fields confirmed | Current use |
|---|---|---|
| `orders` / `invoices` / `quotes` | `owner { id name email }`, `customerDueAt`, `paymentDueAt`, `dueAt`, `startAt`, `invoiceAt`, `publicUrl`, `url`, `workorderUrl`, `visualPoNumber`, `subtotal`, `totalUntaxed`, `salesTaxAmount`, `customerNote`, `productionNote`, `merch` | Owner and due/link/amount fields are now captured on future syncs. |
| `statuses` | `id`, `name`, `type`, `color`, `position` | Already synced for status mapping. |
| `contacts` / `customers` | Standalone endpoints exist and can enrich account/contact identity beyond order snapshots. | Follow-up; current sync reads contact/customer through orders only. |
| `tasks` | Assignee, completion, due windows, and order-status filters are available from query args. | Follow-up for artwork/revision blocker reporting. |
| `lineItemGroups` / `lineItem` | Product-level detail is available. | Follow-up for item mix, quantity, category, and margin modeling. |
| `paymentRequests` / `transactions` | Payment state/detail endpoints are available. | Follow-up for collections/payment workflow if needed. |
| `merchStores` / `merchOrder` | Merch store/order endpoints exist. | Follow-up for Merch Link Orders identity resolution. |

## Commands Run

```bash
npm run typecheck
npm run lint
npm run verify
npm run dev
curl -sS 'http://localhost:3001/api/cron/printavo-daily?dryRun=1' | python3 -m json.tool
curl -sS 'http://localhost:3001/api/cron/printavo-daily' | python3 -m json.tool
curl -sS 'http://localhost:3001/api/runtime/organizations/fraternitees/screenprinting/sales/orders?limit=5' | python3 -m json.tool
curl -sS 'http://localhost:3001/api/runtime/organizations/fraternitees/screenprinting/sales/dashboard' | python3 -m json.tool
```

## Results

| Check | Result | Notes |
|---|---|---|
| Typecheck | pass | `tsc --noEmit -p tsconfig.typecheck.json` completed with exit code 0. |
| Lint | pass | `oxlint app components lib scripts --deny-warnings` found 0 warnings and 0 errors. |
| Tenant isolation | pass | Included in `npm run verify`. |
| Self-contained docs | pass | Included in `npm run verify`. |
| Tenant type docs | pass | Included in `npm run verify`. |
| Build | pass | Included in `npm run verify`; Next.js production build completed. |
| Smoke/browser | not run | `SMOKE_BASE_URL` was not set and `PLAYWRIGHT_VERIFY` was not `1`. |
| Cron dry run | pass | Only `fraternitees` was eligible; no other tenant was selected. |
| Controlled latest sync | pass | FraterniTees import completed with `importedOrders: 71` and `importedAccounts: 70`. |
| Owner attribution | pass | `order_record.sales_rep_name` went from 0 populated rows before the patch to 71 populated rows after the latest sync. |
| Runtime orders API | pass | Recent FraterniTees orders now expose `managerName`, `customerDueDate`, `productionDate`, and real `https://www.printavo.com/invoices/...` deep links. |
| Runtime dashboard API | pass | Dashboard now surfaces manager attribution in ticker/open-pipeline records, including Drake Bowen, Xander Palaia, Logan Ruddick, Alec Greenberg, and Zach Kramer. |

## Follow-up Verification

- 2026-06-01: `npm run verify` passed on branch `codex/162-printavo-owner-field-mapping`.
- Smoke/browser verification remained skipped because no `SMOKE_BASE_URL` was set.

## Controlled Sync Evidence

The latest-sync run was intentionally narrow. It used the patched local app against the existing runtime sync route and only imported the current FraterniTees delta.

```json
{
  "ok": true,
  "dryRun": false,
  "attempted": 1,
  "results": [
    {
      "slug": "fraternitees",
      "ok": true,
      "importedOrders": 71,
      "importedAccounts": 70
    }
  ]
}
```

Representative runtime rows after sync:

| Order | Customer | Manager | Customer due | Printavo URL |
|---|---|---|---|---|
| `24287` | University of Colorado Colorado Springs - Sigma Alpha Epsilon | Frank Hobson | `2026-05-28` | `https://www.printavo.com/invoices/23184346` |
| `24285` | Drake University - Sigma Alpha Epsilon | Drake Bowen | `2026-05-28` | `https://www.printavo.com/invoices/23183493` |
| `24282` | Penn State - Kappa Sigma | Xander Palaia | `2026-05-28` | `https://www.printavo.com/invoices/23175080` |
| `24269` | Charleston Parks Conservacy | Logan Ruddick | `2026-05-27` | `https://www.printavo.com/invoices/23158385` |
| `24270` | University of South Florida - Sigma Nu | Zach Kramer | `2026-05-27` | `https://www.printavo.com/invoices/23157856` |

## Tenant Behavior Preserved

- FraterniTees: Future Printavo syncs remain read-only but now populate rep/owner attribution from Printavo owner.
- PICC: No PICC code path changed.

## Acceptance Criteria

- [x] Printavo order query requests order owner.
- [x] Owner id/name/email are preserved in the FraterniTees lead-order model.
- [x] Runtime import writes owner name to `order_record.sales_rep_name`.
- [x] Runtime import preserves real Printavo URLs and customer due dates.
- [x] Existing dashboard code can read owner via `managerName` after resync/backfill.

## Remaining Risk

- Historical Supabase rows still have `sales_rep_name = null` until a Printavo backfill runs; the controlled latest sync populated 71 current rows only.
- This slice does not yet sync tasks, line items, standalone customers/contacts, payment requests, transactions, or merch-store identity.
- `productionNote` and `customerNote` are captured in raw payload for future AI/data work, but no UI rendering or sanitization was added.

## Follow-Up

- Decide whether to run a controlled historical backfill for the remaining historical orders. Recommended shape: backfill by year or cursor window, verify owner coverage and row counts after each window, and stop on rate-limit/schema anomalies.
- Add a dedicated Printavo field-audit script or fixture test so future sync changes catch dropped fields.
- Consider a second adapter slice for tasks, line items, and merch-store endpoints.
