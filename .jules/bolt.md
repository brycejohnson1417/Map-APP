## 2024-05-18 - Batching Supabase Storage API Calls
**Learning:** Found a severe N+1 query problem in `lib/infrastructure/supabase/change-request-repository.ts` where we were calling `supabase.storage.from().createSignedUrl()` individually inside a `Promise.all` loop.
**Action:** Always prefer the batch `createSignedUrls` API provided by `@supabase/storage-js` when needing multiple signed URLs. It drastically reduces API roundtrips and handles mapping efficiently. Also, ensure graceful degradation if the batch fetch fails.
