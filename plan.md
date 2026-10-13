1. **Import `compileWorkspaceExperience`** in `lib/application/auth/tenant-access.ts`.
2. **Modify `resolveTenantAccess`** in `lib/application/auth/tenant-access.ts`. Replace calls to `getWorkspaceExperienceBySlug(organization.slug)` with `compileWorkspaceExperience({ slug: organization.slug, organization })` wherever `organization` object is already fetched (specifically in membership resolution, domain resolution, and guessed slug resolution).
3. **Verify compilation and behavior** locally.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit the PR** with Bolt format.
