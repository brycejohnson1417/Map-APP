## 2026-06-23 - Optimize Tenant Access DB Query Resolution
**Learning:** In `resolveTenantAccess`, the `Organization` object is already fetched prior to resolving workspace experiences (e.g. from `organizationsById`), yet the original code fired an redundant async database query via `getWorkspaceExperienceBySlug(organization.slug)`.
**Action:** Use `compileWorkspaceExperience` directly when the full `Organization` object (including the `settings` property) is available, saving a DB query while preserving the `else` fallback to the standard cache method if not.
