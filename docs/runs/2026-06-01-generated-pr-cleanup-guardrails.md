# Generated PR Cleanup Guardrails

## Summary

Issue #35 asked for lightweight repo workflow notes before closing generated PRs or deleting generated branches. This run adds a Map-APP-specific generated PR cleanup section to `AGENTS.md` covering bot PR piles, dirty worktrees, and WIP/archive branches.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Changed Files

- `AGENTS.md`
- `docs/runs/2026-06-01-generated-pr-cleanup-guardrails.md`

## Commands Run

```bash
gh issue view 35 --json title,body,labels,comments,url,state,createdAt
npm run check:self-contained-requirements
```

## Results

| Check | Result | Notes |
|---|---|---|
| Cleanup rules documented | pass | Added classification, issue-linking, duplicate-fix, dirty-worktree, and WIP-branch guardrails. |
| Typecheck | not run | Documentation-only change. |
| Lint | not run | Documentation-only change. |
| Build | not run | Documentation-only change. |
| Smoke/browser | not run | No rendered UI changed. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Add lightweight repo workflow note.
- [x] Include examples for bot PR piles.
- [x] Include examples for dirty worktrees.
- [x] Include examples for WIP branches.
