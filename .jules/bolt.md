## 2025-04-29 - Supabase N+1 Signed URLs
**Learning:** Generating signed URLs in a loop using `createSignedUrl` inside `Promise.all` creates an N+1 network bottleneck that severely degrades performance as attachment counts grow.
**Action:** Use the `createSignedUrls` batch API from `@supabase/storage-js` to request all signed URLs in a single network call.
