## 2024-05-18 - Optimize Change Request Attachment URLs

**Learning:** `Promise.all` + `.map` with `createSignedUrl` was causing N+1 requests to Supabase storage. For an endpoint getting lists of records with attachments, this would scale linearly with the number of attachments on screen. Supabase supports batching this with `createSignedUrls`.
**Action:** Always prefer `createSignedUrls` batch API when retrieving multiple presigned URLs.
