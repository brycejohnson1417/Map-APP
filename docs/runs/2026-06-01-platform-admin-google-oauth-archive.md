# Platform Admin Google OAuth Branch Archive Decision

## Summary

Issue #28 asked whether to keep or archive the saved WIP branch `wip/platform-admin-google-oauth-20260505`. The branch is not a safe fast-lane candidate: it is stale against current `main`, is a broad auth/admin feature slice, and changes Google OAuth, platform-admin sessions, cross-tenant switching, tenant-session behavior, Supabase client behavior, env docs, and an `/admin` console. The decision is to archive the branch and require any future platform-admin OAuth work to start from a fresh issue/spec, current `main`, and approval-lane review.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Reviewed Branch

- Branch: `wip/platform-admin-google-oauth-20260505`
- Head commit: `07d5ea4`
- Diff size against current `origin/main`: 21 files, roughly 1,350 added lines.

## Decision

Archive the saved WIP branch instead of opening a normal feature PR.

## Rationale

- The branch touches authentication, admin sessions, cross-tenant switching, and OAuth callback behavior, which are approval-lane areas under the repo operating contract.
- The branch predates current tenant-access and dependency/security fixes, so it would need a fresh design pass rather than a mechanical merge.
- The project now has dedicated tenant-auth and tenant-isolation security issues; broad platform-admin OAuth should be rebuilt in that context instead of landing stale WIP.
- No user-facing production capability is lost by deleting the branch because it was explicitly saved as unmerged WIP.

## Commands Run

```bash
gh issue view 28 --json title,body,labels,comments,url,state,createdAt
git fetch origin wip/platform-admin-google-oauth-20260505:wip/platform-admin-google-oauth-20260505
git log --oneline --decorate --max-count=5 wip/platform-admin-google-oauth-20260505
git diff --stat origin/main...wip/platform-admin-google-oauth-20260505
git diff --name-status origin/main...wip/platform-admin-google-oauth-20260505
git show --stat --oneline --summary wip/platform-admin-google-oauth-20260505
```

## Results

| Check | Result | Notes |
|---|---|---|
| Branch reviewed | pass | Confirmed branch exists at `07d5ea4` and inspected file-level scope. |
| Decision recorded | pass | This run report records the archive decision before branch deletion. |
| Typecheck | not run | No application code changed in this slice. |
| Lint | not run | No application code changed in this slice. |
| Build | not run | No application code changed in this slice. |
| Smoke/browser | not run | No rendered UI changed in this slice. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Decide keep/merge/archive.
- [x] Record the archive reason before deleting the branch.
- [x] Avoid merging stale approval-lane auth/admin work.

## Follow-Up

- If platform-admin Google OAuth is still desired, create a new issue with a current architecture plan, UI acceptance criteria, threat model, and explicit approval-lane handling for auth/session changes.
