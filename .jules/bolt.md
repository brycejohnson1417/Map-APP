## 2024-06-09 - [Avoid redundant database calls inside Tenant Access resolution]
**Learning:** In tenant resolution logic, calling high-level workspace fetchers like `getWorkspaceExperienceBySlug` introduces redundant database lookups when the underlying `Organization` has already been queried locally.
**Action:** Use synchronous compilers like `compileWorkspaceExperience` with locally available `Organization` objects instead of repeating async backend fetchers, saving database roundtrips per login request.
