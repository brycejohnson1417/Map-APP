## 2025-02-24 - Avoid Redundant DB Queries in Synchronous Loops
**Learning:** In backend logic where entities like `Organization` are already fetched and cached from the DB, calling an async service like `getWorkspaceExperienceBySlug` introduces redundant DB lookups and performance penalties, especially inside loops.
**Action:** Use synchronous compilers like `compileWorkspaceExperience` directly, passing the already-fetched entity data instead of delegating to async convenience methods that trigger repeated lookups.
