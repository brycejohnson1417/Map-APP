## 2024-10-12 - Optimize tenant access by compiling workspace experience synchronously
**Learning:** When retrieving workspace experience using `getWorkspaceExperienceBySlug` in cases where the `organization` is already loaded (such as in `resolveTenantAccess`), it creates a redundant DB fetch.
**Action:** Use `compileWorkspaceExperience({ slug, organization })` directly from the application layer to bypass the cached data-fetching method and avoid fragmenting the React cache. Include fallback `else` logic in cases where maps return `undefined`.
