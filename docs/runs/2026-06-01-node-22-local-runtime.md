# Node 22 Local Runtime Alignment

## Summary

Issue #36 tracked local `EBADENGINE` warnings caused by the shell using Node 25 while the repo requires Node 22.x. This run adds local runtime pins for nvm and mise and documents the Homebrew Node 22 path used in this environment.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Changed Files

- `.nvmrc`
- `.tool-versions`
- `docs/SETUP.md`
- `docs/runs/2026-06-01-node-22-local-runtime.md`

## Commands Run

```bash
gh issue view 36 --json title,body,labels,comments,url,state,createdAt
which node
node -v
command -v mise
ls /opt/homebrew/opt/node@22/bin/node
PATH="/opt/homebrew/opt/node@22/bin:$PATH" node -v
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm install
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build
npm run check:self-contained-requirements
```

## Results

| Check | Result | Notes |
|---|---|---|
| Runtime pins | pass | Added `.nvmrc` and `.tool-versions` for Node 22. |
| Install under Node 22 | pass | `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm install` completed with 0 vulnerabilities. |
| Typecheck under Node 22 | pass | `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run typecheck` passed. |
| Build under Node 22 | pass | `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run build` passed. |
| Self-contained docs | pass | `npm run check:self-contained-requirements` passed. |
| Smoke/browser | not run | No rendered UI changed. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Document the preferred local Node manager/version for this repo.
- [x] Make it easy to enter Node 22 locally.
- [x] Re-run install/build/typecheck under Node 22.
