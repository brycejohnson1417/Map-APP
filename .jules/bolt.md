## 2024-05-19 - Batch Signed URL Generation
**Learning:** Calling `createSignedUrl` in a loop (even with `Promise.all`) for Supabase Storage causes an N+1 API call pattern which can severely degrade performance on list views or when loading multiple attachments simultaneously.
**Action:** Always use the `@supabase/storage-js` `createSignedUrls` batch API when dealing with multiple files to retrieve all signed URLs in a single network request.
