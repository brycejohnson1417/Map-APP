## 2024-05-18 - Supabase Storage N+1 Fetch Optimization
**Learning:** Calling `createSignedUrl` in a `Promise.all` loop for a list of attachments creates N+1 network requests, which can lead to high latency or rate-limiting for organizations with many attachments.
**Action:** Use `@supabase/storage-js`'s batched `createSignedUrls` API when multiple signed URLs are needed. Ensure to provide an array of paths, map the returned data for O(1) lookups by path, and properly handle network errors on the bulk request.
