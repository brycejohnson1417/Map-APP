## 2024-03-24 - Avoiding React cache fragmentation with synchronous compilers

**Learning:** The `getWorkspaceExperienceBySlug` function is wrapped in React's `cache()`. Initially, it seemed like a good idea to pass pre-fetched `organization` objects into this function to avoid redundant database lookups. However, because React's cache keys off *all* arguments, passing an object causes the cache to fragment (a new cache entry is created for every object reference).

**Action:** When a service method is wrapped in `cache()` and the underlying data is already available in the application layer, bypass the cached function entirely. Instead, call the internal synchronous compiler (e.g., `compileWorkspaceExperience`) directly. This avoids N+1 database queries without fragmenting the global React cache.
