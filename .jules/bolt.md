
## 2026-05-17 - Optimize Tenant Access Resolution
**Learning:** Avoid redundant database queries by passing already-fetched `Organization` objects directly to synchronous compilers (e.g., `compileWorkspaceExperience`) instead of calling async services like `getWorkspaceExperienceBySlug` that perform a redundant `findBySlug` lookup.
**Action:** Use `compileWorkspaceExperience` directly in `resolveTenantAccess`.
