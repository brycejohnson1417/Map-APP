## 2026-05-12 - Supabase createSignedUrl N+1 Fix
**Learning:** Found an N+1 query bottleneck in `lib/infrastructure/supabase/change-request-repository.ts` where signed URLs were fetched individually using `createSignedUrl` in a `Promise.all` map.
**Action:** Replaced sequential loop with `@supabase/storage-js`'s batch API `createSignedUrls`, mapped by path for O(1) lookup, and wrapped in try/catch to maintain fallback behavior. Always look for batch variants of network requests.
