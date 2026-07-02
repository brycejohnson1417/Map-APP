## 2025-07-02 - Replace getWorkspaceExperienceBySlug with compileWorkspaceExperience
**Learning:** React Server Components wrapped with `cache()` fragment when using optional pre-fetched objects to the function signature as React keys off all arguments.
**Action:** When a method like `getWorkspaceExperienceBySlug` is already wrapped in React `cache()`, bypassing it to call the underlying synchronous compiler `compileWorkspaceExperience` with an already fetched `organization` avoids a redundant async database fetch and TS2339 compiler issues.
