# Migration Playbook

## Purpose
This playbook is the entry point for a fresh Codex thread asked to migrate a customer organization.

## Read order
1. `README.md`
2. `docs/STRATEGY.md`
3. `docs/PLATFORM_SPEC.md`
4. `docs/ARCHITECTURE.md`
5. `docs/IMPLEMENTATION_PLAN.md`
6. `docs/VERIFICATION_STRATEGY.md`
7. `docs/tenants/picc/REQUIREMENTS.md`
8. `docs/tenants/picc/MIGRATION.md`
9. `docs/tenants/picc/FIELD_MAPPINGS.md`
10. `docs/tenants/picc/BASELINE.md`
11. `docs/tenants/picc/ACCEPTANCE.md`
12. `docs/tenants/picc/LEGACY_SYSTEM.md`
13. `docs/tenants/picc/DATA_MIGRATION.md`
14. `docs/tenants/picc/CREDENTIALS.md`
15. `docs/tenants/picc/MIGRATION_LOG.md`

## Rules
- Do not skip phases in the tenant migration runbook.
- Do not invent legacy facts.
- Do not proceed past a failed validation gate.
- Do not modify tenant field mappings without recording the reason.
- Do not perform destructive legacy operations.

## Required commands
```bash
npm run mapapp -- health check <org-slug>
npm run mapapp -- migration dry-run <org-slug>
npm run mapapp -- migration validate <org-slug>
npm run verify
```

## When blocked
If required information is missing:
1. record the blocker in `docs/tenants/picc/MIGRATION_LOG.md`
2. ask the human operator for the exact missing artifact
3. stop instead of guessing

## Definition of readiness
The migration is ready for a fresh thread only when:
- the required commands are runnable
- the migration pack has no unresolved TODO markers that block execution
- the migration log contains no unresolved blocker that prevents the next phase
