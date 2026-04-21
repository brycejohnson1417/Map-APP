# PICC Acceptance

## Purpose
This file defines the thresholds that must be met before PICC can cut over.

## Runtime thresholds
- Notion-to-runtime propagation under 60 seconds P95 after webhook delivery
- fallback sync freshness under 3 minutes P95
- territory pin payload under 200 KB compressed for the target pin set
- hot map API latency under 500 ms P95 before browser/network overhead
- account detail reads do not require live Notion fetches

## Functional thresholds
- rep shown on the map, list, and detail surfaces agrees for the same account
- shared territory boundaries become visible to other users after save
- sample and order filters use trusted local fields, not live rollup parsing
- referral source and blank-value filters are consistent with the local runtime

## Migration thresholds
- `account` row count for PICC must match the accepted migration snapshot exactly unless a human-approved exclusion list exists
- deterministic identities (`licensed_location_id`, `nabis_retailer_id`, `notion_page_id`) must not lose coverage during migration
- territory boundary and shared marker counts must match legacy accepted counts exactly
- any parity mismatch on revenue/order aggregates must be explicitly explained before cutover
- final production cutover requires human approval after validation evidence is reviewed
