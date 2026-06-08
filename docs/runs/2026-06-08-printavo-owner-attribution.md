# Printavo Owner Attribution

## Issue

- GitHub: https://github.com/brycejohnson1417/Map-APP/issues/269

## Scope

- Fetch Printavo order `owner { id name email }` for invoices and quotes.
- Preserve owner id/name/email in the order source payload.
- Normalize Printavo owner name into `order_record.sales_rep_name` for existing screenprinting runtime surfaces.
- Rename visible screenprinting labels from generic manager wording to rep/Printavo owner wording.
- Add a checkpointed owner-attribution backfill runner for existing FraterniTees Printavo orders.
- Regenerate the alumni referral candidate export with rep attribution after candidate-order enrichment.

## Non-Goals

- No Printavo write-back.
- No schema, auth, or RLS changes.
- No destructive account, contact, or order replacement.
- No broad all-object Printavo data warehouse import.

## Production Data Action

- Enriched owner attribution for the 706 Printavo orders behind the top 100 alumni referral candidates.
- Owner-populated FraterniTees Printavo order rows increased to 2,739.
- Full historical owner enrichment remains provider-rate-limited and checkpointed at `/tmp/map-app-printavo-owner-backfill.json`.

## Validation

- `npm run check:printavo-owner-attribution`
- `npm run typecheck`
- `npm run lint`
- `npm run verify`

## Notes

- Printavo API v2 is GraphQL and should be queried with explicit fields rather than broad object pulls.
- Printavo rate limits made full all-order historical owner enrichment unsuitable for a single interactive pass.
