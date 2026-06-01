## 2024-05-24 - Avoid redundant DB queries
**Learning:** Avoid redundant database queries by passing already-fetched Organization objects directly to synchronous compilers (e.g., compileWorkspaceExperience) instead of calling async services like getWorkspaceExperienceBySlug that perform a redundant findBySlug lookup.
**Action:** Use compileWorkspaceExperience when the organization object is already fetched.
