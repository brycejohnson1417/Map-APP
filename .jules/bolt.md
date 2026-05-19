## 2026-05-19 - Prevent Redundant DB Queries by passing fetched Objects to synchronous Compilers
**Learning:** Passing already-fetched 'Organization' objects directly to synchronous compilers (like compileWorkspaceExperience) rather than calling async services (like getWorkspaceExperienceBySlug) avoids redundant lookup queries and improves authorization resolution speed.
**Action:** Whenever a hydrated domain object is already available in scope, prioritize synchronous pure functions that accept the hydrated object over async repository-backed services.
