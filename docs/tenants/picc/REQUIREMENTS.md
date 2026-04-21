# PICC Requirements

## Purpose
This file captures the tenant-specific context and requirements for PICC.

An agent working on the core Map App platform should assume nothing about PICC unless it is written here. This document explains:
- what PICC is switching over from,
- what the old application did poorly,
- which workflows matter for this tenant,
- what tenant-specific acceptance looks like.

These are not generic platform rules. They are the requirements for one tenant.

## Legacy system context
PICC is switching from an existing application internally referred to as `picc-push`, served at `piccnewyork.org`.

That system mixed together:
- map views
- account detail
- Notion CRM reads
- order-derived logic
- territory drawing
- calendar and workflow surfaces

It behaved like several mini-apps sharing partial state instead of one consistent runtime.

The most important legacy problems were:
- data freshness problems between Notion and the map
- account detail being fresher than map pins for the same account
- high polling / oversized payloads
- poor shared-state behavior for boundaries and layers
- filter correctness depending on fragile Notion rollups
- unclear operational truth across map, account, and calendar surfaces

## Current pain this platform must eliminate for PICC
- stale rep assignments between Notion and the map
- map pins and account detail disagreeing about the same account
- oversized territory/store payloads causing slow loads and high database egress
- shared territory layers not propagating reliably to all users
- filters depending on fragile Notion rollups at request time
- the product feeling like separate mini-apps instead of one unified account system

## PICC-critical surfaces

### Territory map
- small, fast pin payload
- colorize by rep
- deterministic rep/account status/filter behavior
- lasso and selection workflows
- territory boundaries shared across users in the same organization
- admin-only boundary editing
- shared markers such as rep homes
- Google routing and map polish

### Account system
- one canonical account detail surface
- account detail must agree with map/list/calendar data
- local fields for rep, account manager, referral source, vendor day status, and order/sample aggregates
- direct link out to source CRM record when configured

### Filters and sales operations
- lead/account status filters
- referral source filters, including blank values
- sample and order date filters
- vendor day status filters
- local order/sample logic based on normalized data, not runtime parsing of fragile CRM rollups

### Calendar and vendor-day operations
- local calendar surface built from local event models
- clear separation of personal vs company views
- vendor day workflows aligned with account truth and assignments

## Notion-specific expectations
- Notion can remain the first place people edit CRM information
- changes should reach the app within seconds to a few minutes
- webhook-first ingestion with incremental polling fallback
- app correctness must not depend on opening the account detail page to force a refresh

## Nabis-specific expectations
- `licensed_location_id` and `nabis_retailer_id` are first-class identifiers
- Nabis orders are normalized locally
- order-derived fields are computed locally
- ambiguous matching goes to review, not hidden fuzzy updates

## What “unified system” means for PICC
- map, accounts, calendar, vendor days, and sync health all point back to the same account system
- the same account should not have multiple competing truths depending on which screen a user opens
- local runtime data should be the source used by every user-facing surface

## Acceptance bar
PICC is not ready to switch from `picc-push` to Map App Harness until:
1. rep changes made in Notion show up in the runtime quickly and consistently,
2. map pins and account detail agree without live Notion reads,
3. territory boundaries save once and become visible to other users reliably,
4. filters operate on trustworthy local fields,
5. runtime loads are materially smaller and faster than the old Neon app.
