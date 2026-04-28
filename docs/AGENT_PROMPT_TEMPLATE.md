# Agent Prompt Template

Use this template for Codex CLI implementation runs.

```text
You are working in /Users/brycejohnson/Code/map-app.

Read first:
- AGENTS.md
- docs/HANDOFF.md
- docs/GLOSSARY.md
- docs/AUTONOMOUS_PRODUCT_BUILD.md
- docs/WORK_REGISTRY.md
- docs/WORK_REGISTRY.json
- docs/DEFINITION_OF_DONE.md
- docs/ARCHITECTURE_RUNWAY.md
- docs/DATA_MODEL.md
- docs/API_CONTRACTS.md
- docs/ACCEPTANCE_AND_FIXTURES.md
- docs/ENVIRONMENT_AND_DEPLOYMENT_POLICY.md
- docs/MIGRATION_SAFETY.md
- docs/tenant-types/SCHEMA.md
- docs/tenant-types/screenprinting/PRODUCT_SPEC.md
- docs/tenant-types/screenprinting/FULL_IMPLEMENTATION_HANDOFF.md

Scope:
<describe one lane: core, adapter, tenant type, tenant-specific, docs/ops>

Task:
<describe the specific implementation slice>

Execution:
- Parse docs/WORK_REGISTRY.json before choosing work.
- Execute ready items in priority order unless this prompt narrows scope.
- Promote dependency-unblocked planned items to ready and continue.
- If a future proposal item is the smallest necessary foundation for the current work, promote that focused slice, document why, and continue.
- Update the registry status after meaningful slices.

Hard rules:
- Continue through implementation, docs, tests, verification, and run report. Do not stop at a plan unless explicitly instructed.
- If a documented future foundation item becomes the best prerequisite for the feature, implement the smallest useful version of that foundation first, document why, and continue.
- Preserve existing FraterniTees Printavo sync, lead scoring, score trends, DNC behavior, top-customer leaderboard, account directory, account detail, map, and change-request capabilities.
- Preserve existing PICC territory/account, Nabis/Notion, PPP savings, and mock proposal capabilities.
- Do not write back to Printavo.
- Do not auto-send emails.
- Do not enable social publishing unless explicitly feature-flagged and requested.
- Every tenant business row must be scoped by organization_id.
- Update docs when schema, API, tenant type, config, or verification contracts change.
- Keep changes focused and revertable.

Deliverables:
1. Implementation.
2. Targeted tests or validation checks for non-trivial logic.
3. Updated docs.
4. Updated docs/WORK_REGISTRY.json status and dependencies.
5. Run report under docs/runs/<timestamp>-<short-task>.md.

Verification:
- npm run check:work-registry
- npm run check:self-contained-requirements
- npm run check:tenant-types
- npm run verify
- If UI changed and a local server is available:
  SMOKE_BASE_URL=http://localhost:3000 npm run smoke:runtime
  SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_VERIFY=1 npm run verify:browser

Do not claim done unless verification ran or the blocker is documented.
```
