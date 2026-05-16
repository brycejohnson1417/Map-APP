## 2024-05-16 - Batch Supabase Signed URLs Request
**Learning:** Supabase storage `createSignedUrl` in loops causes an N+1 performance bottleneck when fetching multiple attachments for change requests. The JS client provides a `createSignedUrls` batch method that significantly reduces overhead.
**Action:** Always prefer `createSignedUrls` with an array of unique paths over mapping `createSignedUrl` in a `Promise.all` for fetching signed URLs, constructing a Map for O(1) matching afterwards.
