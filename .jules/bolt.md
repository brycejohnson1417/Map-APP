## 2026-06-11 - Avoid redundant workspace resolution database queries

**Learning:** Workspace experience resolution (e.g. `getWorkspaceExperienceBySlug`) involves redundant database queries if the `Organization` object has already been fetched. When an `Organization` object is already available in memory (for instance, during tenant access resolution), the fallback to asynchronous `getWorkspaceExperienceBySlug` introduces unneeded latency.

**Action:** When a full `Organization` object is already available in scope (such as after `organizations.listByIds`, `organizations.findFirstByWorkspaceEmailDomain`, or `organizations.findBySlug`), pass it directly to the synchronous `compileWorkspaceExperience` function instead of invoking `getWorkspaceExperienceBySlug`. Ensure the fallback asynchronous lookup is kept for type safety and edge cases where the direct memory object might be `undefined` or lacks the required `.settings` property.
