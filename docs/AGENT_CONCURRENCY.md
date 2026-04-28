# Agent Concurrency

## Purpose

This file defines lightweight coordination rules for Codex/AI/human work in the current repo.

This is not a full monorepo/worktree orchestration system. It is the minimum discipline needed to let multiple implementation runs happen without corrupting tenant behavior or docs.

## Work Lanes

| Lane | Scope | Rules |
|---|---|---|
| Core | shared runtime, data model, API contracts, tenant isolation, auth/session, verification scripts | Touch only when the change benefits multiple tenants or establishes a reusable primitive. |
| Adapter | provider-specific connector code such as Printavo, Nabis, Notion, Meta/Instagram, catalog vendors | Provider logic belongs here; runtime/product UI should depend on adapter contracts. |
| Tenant type | universal behavior for `Screenprinting`, `Cannabis Wholesale`, or future tenant types | Must not contain one-tenant-only decisions. |
| Tenant-specific | one tenant's workspace/docs/config such as FraterniTees or PICC | Must not redefine universal tenant type behavior. |
| Docs/Ops | docs, run reports, verification policy, setup/runbooks | Must keep docs self-contained and current. |

## Current Practical Rules

- Prefer one implementation focus per branch/session.
- Declare the lane and intended write scope in the run report.
- Do not mix unrelated Core, Adapter, Tenant type, and Tenant-specific changes unless the task explicitly requires the integration.
- Do not change PICC behavior while implementing Screenprinting unless verification proves the shared change preserves PICC.
- Do not change FraterniTees behavior while implementing Cannabis Wholesale unless verification proves preservation.
- Do not bypass `docs/DATA_MODEL.md`, `docs/API_CONTRACTS.md`, or `docs/tenant-types/SCHEMA.md` when changing schema/API/config contracts.

## Lock File

Use [locks/LOCKS.md](locks/LOCKS.md) for breaking or high-risk active work.

Add an entry when a run:

- changes shared runtime contract
- changes database schema used by multiple tenants
- changes adapter ports
- changes tenant-session/auth behavior
- blocks other agents from safely merging related work

Remove the entry when the work is merged, abandoned, or no longer blocking.

## Run Reports

Meaningful implementation runs should create a run report using [runs/RUN_REPORT_TEMPLATE.md](runs/RUN_REPORT_TEMPLATE.md).

The run report records:

- scope
- changed files
- commands run
- what passed
- what failed
- tenant behavior preserved
- remaining risk

This keeps future agents from reverse-engineering intent from git diffs.

## Future Direction

The larger future stack may add branch namespaces, worktree-specific databases, package-scoped checks, and CI lock validation. Those are not required before the Screenprinting foundation build.
