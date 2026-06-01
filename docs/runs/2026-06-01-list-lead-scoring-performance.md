# List And Lead-Scoring Performance Evaluation

## Summary

Issue #31 asked whether stale generated PR ideas around territory list memoization and FraterniTees lead-scoring date lookup still applied. After inspecting current `main`, no safe implementation was justified. Territory list rows are not memoized, but the parent still creates per-row callbacks, so a simple memo wrapper would not provide a clear measured benefit. FraterniTees lead scoring does parse order dates more than once in `scoreGroup`, but a synthetic benchmark of 7,200 orders across 600 customers averaged about 15.5ms, with warm runs around 11-15ms. That is not a bottleneck worth changing without real production evidence.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | Screenprinting |
| Tenant | FraterniTees |
| Risk level | low |

## Reviewed Areas

- `components/territory/territory-workspace.tsx`
- `lib/application/fraternitees/lead-scoring.ts`
- `components/accounts/fraternitees-lead-qualification-module.tsx`
- `lib/application/runtime/account-service.ts`

## Commands Run

```bash
gh issue view 31 --json title,body,labels,comments,url,state,createdAt
rg "function PinRow|const PinRow|memo\\(|React.memo|pins.map|large pin" -n components/territory components/accounts lib
rg "leadScore|lead score|Date\\(|new Date|lastOrder|closeRate|grade" -n lib app components scripts
node <<'NODE'
// Transpiled lib/application/fraternitees/lead-scoring.ts and benchmarked scoreFraterniteesLeads
// with 7,200 synthetic FraterniTees orders across 600 customers.
NODE
npm run check:self-contained-requirements
```

## Benchmark Result

```json
{
  "orders": 7200,
  "customers": 600,
  "runsMs": [34.61, 14.95, 15.58, 13.39, 11.34, 11.62, 11.59, 11.23],
  "avgMs": 15.54
}
```

## Results

| Check | Result | Notes |
|---|---|---|
| Territory list rendering | no-change | `PinRow` could be memoized only with callback restructuring; no measured wasted-render evidence justified that change. |
| Lead-scoring date parsing | no-change | Repeated parsing exists, but benchmark timing is already low for a larger-than-current synthetic workload. |
| Self-contained docs | pass | `npm run check:self-contained-requirements` passed. |
| Typecheck | not run | No application code changed in this slice. |
| Lint | not run | No application code changed in this slice. |
| Build | not run | No application code changed in this slice. |
| Smoke/browser | not run | No rendered UI changed in this slice. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Identify whether current territory list rendering has measurable wasted renders.
- [x] Identify whether FraterniTees lead scoring date parsing is a real bottleneck.
- [x] Implement only if there is a clear measurable benefit and no UX regression.

## Decision

Close #31 without code changes. Revisit only if production traces, a React profiler capture, or a much larger tenant dataset shows this area consuming meaningful runtime.
