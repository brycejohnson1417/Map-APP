## 2025-02-23 - Batch Retrieval for Supabase Signed URLs
**Learning:** Using `createSignedUrl` inside a `Promise.all` loop for multiple attachments creates an N+1 network request bottleneck, scaling poorly as the number of attachments increases.
**Action:** When working with `@supabase/storage-js`, always use the `createSignedUrls` batch API to resolve multiple signed URLs in a single network request. Use a map of path to signed URLs for O(1) correlation back to the original objects.
