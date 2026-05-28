## 2024-05-28 - Replace N+1 Signed URL Fetching with createSignedUrls
**Learning:** Generating signed URLs for multiple files using a `Promise.all(paths.map(path => createSignedUrl(path)))` pattern leads to an N+1 query bottleneck because each call resolves individually over the network.
**Action:** Use Supabase's `@supabase/storage-js` batch method `.createSignedUrls(paths, expiresIn)` to resolve all signed URLs with a single API call, mapping the response array to an O(1) dictionary for efficient path-to-URL lookups.
