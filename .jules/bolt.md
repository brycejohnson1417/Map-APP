## 2025-05-25 - Performance Optimization Pattern: Synchronous Workspace Compilation
**Learning:** Avoid redundant database queries by passing already-fetched 'Organization' objects directly to synchronous compilers (e.g., 'compileWorkspaceExperience' from '@/lib/platform/workspace/compiler') instead of calling async services like 'getWorkspaceExperienceBySlug' that perform a redundant 'findBySlug' lookup.
**Action:** Use 'compileWorkspaceExperience' to synchronously generate the runtime experience when the organization object is already present in context.
