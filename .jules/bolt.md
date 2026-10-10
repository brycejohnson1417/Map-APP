## 2024-05-15 - Bypass cached functions when data is already available
**Learning:** React cache() keys off all arguments. Extending function signatures with pre-fetched data fragments the cache. We should directly call the internal synchronous compiler instead.
**Action:** Replaced `getWorkspaceExperienceBySlug` with `compileWorkspaceExperience` when `Organization` object is already in scope to avoid N+1 DB queries and cache fragmentation.
