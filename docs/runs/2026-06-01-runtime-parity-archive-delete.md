# Runtime-Parity Archive Branch Decision

## Summary

Issue #33 asked whether to keep, merge, or delete the archived remote branch `origin/codex/runtime-parity`. The branch contains old worktree workflow documentation from commit `83ce1d9`, but the paths and project wording are stale relative to the current `/Users/brycejohnson/Code/map-app` checkout and current project-boundary contract. The decision is to delete the remote archive branch and avoid merging obsolete instructions.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Reviewed Branch

- Branch: `origin/codex/runtime-parity`
- Head commit: `83ce1d9`
- Subject: `Document parallel worktree workflow`
- Diff against current `origin/main`: `AGENTS.md`, `README.md`, and new `docs/WORKTREE_WORKFLOW.md`

## Decision

Delete the remote branch after this decision is merged.

## Rationale

- The branch documentation points agents to old paths under `/Users/brycejohnson/Documents/MAP-APP-SUPABASE/...` instead of the current `/Users/brycejohnson/Code/map-app` repo.
- It references older production/PICC boundaries that have been superseded by the current `/Users/brycejohnson/Code/AGENTS.md` and repo-level process.
- The useful generic idea, keeping separate worktrees and stable checkpoints, is already covered by the current branch/PR discipline and does not need this stale doc.
- Merging it would increase confusion for future agents.

## Commands Run

```bash
gh issue view 33 --json title,body,labels,comments,url,state,createdAt
git fetch origin codex/runtime-parity:codex/runtime-parity
git log --oneline --decorate --max-count=5 codex/runtime-parity
git diff --stat origin/main...codex/runtime-parity
git diff --name-status origin/main...codex/runtime-parity
git diff origin/main...codex/runtime-parity -- AGENTS.md README.md docs/WORKTREE_WORKFLOW.md
```

## Results

| Check | Result | Notes |
|---|---|---|
| Branch inspected | pass | Confirmed only old workflow docs were unique. |
| Merge docs | dropped | Docs are stale and conflict with current repo/workspace paths. |
| Delete decision | pass | Reason recorded before branch deletion. |
| Typecheck | not run | No application code changed. |
| Lint | not run | No application code changed. |
| Build | not run | No application code changed. |
| Smoke/browser | not run | No rendered UI changed. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Inspect the branch contents.
- [x] Decide keep / merge docs / delete.
- [x] If deleting, confirm nothing unique is needed first.
