# Acceptance And Fixtures

## Purpose

Autonomous implementation needs realistic fixtures and observable workflow checks. Live provider credentials are useful, but they cannot be required for every build or test.

This file defines the fixture and acceptance policy for Screenprinting and future tenant types.

## Fixture Rules

Every tenant type with provider-backed workflows should have committed fixtures that cover:

- clean data
- dirty data
- missing fields
- duplicate identities
- conflicting statuses or tags
- owned accounts
- watched accounts
- permission-limited provider states
- manual import fallback

Fixtures must never contain real secrets, live access tokens, private customer data, or provider credentials.

## Initial Screenprinting Fixtures

The first Screenprinting fixture bundle lives at:

```text
fixtures/screenprinting/sample-screenprinting-data.json
```

It is intentionally small and should grow as implementation exposes new edge cases.

It covers:

- FraterniTees-like tenant config
- second screenprinter tenant config
- Printavo-like orders with clean and dirty statuses
- customers and organizations with duplicate identity signals
- owned and watched social accounts
- posts, comments, messages, and alert candidates
- manual import records

## Required Acceptance Workflows

Screenprinting implementation must include acceptance coverage for:

| Workflow | Required proof |
|---|---|
| Status mapping | Changing tenant mappings changes quote/order/report buckets. |
| Dirty field trust | Dirty fields are excluded from authoritative reporting until trusted. |
| Reorder cycle | Tenant-defined reorder rules create, snooze, convert, and ignore reorder signals. |
| Draft email | Email templates render draft-only output and never auto-send. |
| Opportunity pipeline | Opportunities move between tenant-defined stages without provider write-back. |
| Owned social accounts | Owned accounts can be tracked, synced/imported, and linked to comments/messages. |
| Watched social accounts | Watched accounts can be monitored without publishing permissions. |
| Social alerts | Tenant-defined alert thresholds create actionable alerts. |
| Identity suggestions | Customer/organization/contact/social links are suggested, reviewed, and non-destructive. |
| Tenant isolation | A second tenant cannot see FraterniTees data and FraterniTees cannot see PICC data. |

## Live Provider Policy

Live provider checks are optional unless a registry item explicitly requires them.

When credentials are missing:

- use fixtures
- use manual import fallback
- skip live-provider checks with a clear skip message
- do not claim live sync or live API behavior was verified

## Acceptance Script Naming

Preferred locations:

```text
tests/acceptance/<tenant-type>/<workflow>.test.ts
scripts/acceptance/<tenant-type>-<workflow>.mjs
```

Use the existing repo structure if tests already live elsewhere.

## Updating Fixtures

When a bug or tenant data issue reveals a new edge case:

1. Add or update a fixture.
2. Add an acceptance check that fails before the fix.
3. Implement the fix.
4. Run verification.
5. Update the related registry item and run report.
