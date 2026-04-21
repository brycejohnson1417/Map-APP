# PICC Migration Runbook

## Purpose
This file is the execution runbook for migrating PICC from the legacy `picc-push` system to Map App Harness.

It is written for a fresh developer or coding agent with access only to this repo.

## Preconditions
Before migration work proceeds beyond preparation:
- Supabase project is provisioned and reachable
- platform migrations are applied
- PICC organization bootstrap path exists
- tenant connector credentials are available through the documented environment contract
- baseline metrics are captured in `BASELINE.md`
- field mappings exist in both `FIELD_MAPPINGS.md` and `tenants/picc/field-mappings.json`
- unresolved legacy facts listed in `MIGRATION_LOG.md` are resolved or explicitly accepted as blockers

## Phases

### Phase 0 — Prepare
Commands:
```bash
npm run mapapp -- health check picc
npm run mapapp -- migration dry-run picc
npm run mapapp -- migration validate picc
npm run verify
```

Exit criteria:
- health check passes for the required environment contract
- migration dry-run reports no missing required files
- migration validate reports no unresolved placeholder markers in required artifacts

Rollback:
- none required; this phase is read-only preparation

### Phase 1 — Bootstrap runtime
Commands:
```bash
npm run seed:runtime
npm run mapapp -- health check picc
```

Exit criteria:
- organization bootstrap completes
- required integrations are registered for the tenant

Rollback:
- document the failed bootstrap in `MIGRATION_LOG.md`
- remove or reset partial tenant bootstrap data only with human approval

### Phase 2 — Shadow verification
Commands:
```bash
npm run mapapp -- migration dry-run picc
npm run mapapp -- migration validate picc
```

Required comparison inputs:
- legacy row counts and representative payloads from `LEGACY_SYSTEM.md`
- validation SQL and parity rules from `DATA_MIGRATION.md`
- thresholds from `ACCEPTANCE.md`

Exit criteria:
- validation compares legacy facts to the new runtime model without unexplained mismatches
- open migration questions are empty or explicitly deferred

Rollback:
- stop and update `MIGRATION_LOG.md`
- do not advance to user-facing cutover

### Phase 3 — Controlled cutover
Commands:
```bash
# final cutover commands are intentionally deferred until migration dry-run,
# validation, and shadow-mode tooling exist in the new runtime
```

Exit criteria:
- defined in `ACCEPTANCE.md`
- human operator approves production switch

Rollback:
- switch traffic back to the legacy app
- preserve migration evidence and failure notes in `MIGRATION_LOG.md`

## Hard stop rules
- Do not fabricate mappings, schema, or counts.
- Do not delete from the legacy system.
- Do not proceed past a failed validation gate.
- Do not claim cutover readiness while `MIGRATION_LOG.md` still contains unresolved blockers.

## Current blockers
- authenticated timing and payload measurements from the live legacy app are still missing
- migration dry-run and validate commands still check repo and evidence readiness, not live parity execution
