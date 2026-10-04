## 2024-05-21 - [Bypass React cache() in resolveTenantAccess]
**Learning:** React's cache() wrapper around getWorkspaceExperienceBySlug is great for deduplicating queries within a request, but in resolveTenantAccess we already have the full Organization object. Passing the organization slug into the cached function causes an unnecessary asynchronous database fetch.
**Action:** Replace getWorkspaceExperienceBySlug with a direct call to the underlying synchronous compileWorkspaceExperience when the Organization object is already available.
