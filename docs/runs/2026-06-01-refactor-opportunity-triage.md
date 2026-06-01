# Refactor Opportunity Triage From Closed PR #1

## Summary

Issue #32 asked to review the broad generated refactoring analysis from closed PR #1 against current `main`, mark each topic keep/drop, and create scoped implementation issues only for work worth doing soon. The PR #1 document was not merged. This run keeps three focused follow-ups and drops broad, platform-wide rewrites that would be too risky without a current product/spec driver.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Current Measurements

| Area | Current signal |
|---|---|
| Territory workspace | `components/territory/territory-workspace.tsx` is 1,921 lines. |
| FraterniTees portal | `components/fraternitees/fraternitees-portal.tsx` is 1,181 lines. |
| PPP savings service | `lib/application/runtime/ppp-savings-service.ts` is 1,098 lines. |
| Legacy FraterniTees Printavo sync route | `app/api/tenants/fraternitees/printavo/sync/route.ts` is 335 lines. |
| Runtime Printavo sync route | `app/api/runtime/organizations/[slug]/printavo/sync/route.ts` is 109 lines. |
| Screenprinting service/repository | `screenprinting-service.ts` is 2,344 lines; `repository.ts` is 913 lines. |

## Topic Decisions

| Topic from PR #1 | Decision | Reason |
|---|---|---|
| Decouple FraterniTees tenant-specific logic from core runtime/UI | Keep as future architecture concern, not soon issue | Still directionally valid, but too broad and likely overlaps tenant-type/plugin architecture work. Needs a product architecture spec before implementation. |
| Extract Printavo sync orchestration out of API routes | Keep / issue created | Smaller, testable boundary improvement with clear route-handler simplification and no required provider writes during validation. |
| Decompose the large territory workspace component | Keep / issue created | High-change surface and largest active frontend file; worth staging carefully behind browser regression tests. |
| Decompose the FraterniTees workspace component | Drop for now | Large, but less active than territory and likely to change as tenant-type screens evolve. Revisit after higher-priority screenprinting architecture work. |
| Split PPP savings service into focused modules | Keep / issue created | Clear adapter/template/calculator boundaries can improve testability without changing pricing behavior if done with deterministic tests. |
| Standardize database access through repositories | Drop as standalone | Too broad. Repository cleanup should happen inside specific feature/refactor slices where the boundary is already being touched. |

## Follow-Up Issues Created

- #238: Refactor territory workspace into focused map/data/detail modules
- #239: Extract Printavo sync orchestration out of API routes
- #240: Split PPP savings service into adapter, calculator, and email template boundaries

## Commands Run

```bash
gh issue view 32 --json title,body,labels,comments,url,state,createdAt
gh pr view 1 --json title,body,state,url,createdAt,closedAt,files,comments
gh pr diff 1 --patch
wc -l components/territory/territory-workspace.tsx components/fraternitees/fraternitees-portal.tsx lib/application/runtime/ppp-savings-service.ts app/api/tenants/fraternitees/printavo/sync/route.ts 'app/api/runtime/organizations/[slug]/printavo/sync/route.ts' lib/application/screenprinting/screenprinting-service.ts lib/application/screenprinting/repository.ts
gh issue create ...
```

## Results

| Check | Result | Notes |
|---|---|---|
| PR #1 reviewed | pass | Confirmed it only added a broad `list.md` analysis and was closed as stale generated work. |
| Topics marked keep/drop | pass | Decisions recorded above. |
| Follow-up issues | pass | Created #238, #239, and #240. |
| Typecheck | not run | No application code changed in this slice. |
| Lint | not run | No application code changed in this slice. |
| Build | not run | No application code changed in this slice. |
| Smoke/browser | not run | No rendered UI changed in this slice. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Review each topic against current code.
- [x] Mark as keep/drop.
- [x] Create separate implementation issues only for items worth doing soon.
