# Primitive Catalog v1

This is the first explicit catalog of reusable platform pieces already visible in the repo or clearly justified by current tenant work.

It is intentionally small. It should grow from real tenant demand, not speculative abstraction.

## How to use this catalog

When a tenant asks for something new, classify it as:

- existing primitive plus config
- existing package plus config
- new primitive candidate
- core-platform change

If a request cannot be described this way, the platform model is probably still too implicit.

## Current primitive candidates

## 1. Score model

Purpose:
- compute a tenant-specific score, grade, and priority from canonical account/order outcomes

Examples:
- FraterniTees lead score
- future wholesale account quality scores

Status:
- partial, extracted into a shared score-model config contract and still finishing service-level reuse

Needs:
- broader reuse outside FraterniTees and compiled read-model generation

## 2. DNC rule

Purpose:
- identify accounts that should be deprioritized or temporarily excluded

Examples:
- FraterniTees lost-order threshold

Status:
- partial, live in workspace config and shared scoring helpers

Needs:
- reusable rule contract and display semantics

## 3. Trend summary

Purpose:
- compare current and previous periods for the same account or cohort

Examples:
- last 12 months vs previous 12 months
- trending up/down on score or revenue

Status:
- landed as a shared primitive component with FraterniTees account-detail usage

## 4. Filter registry

Purpose:
- define which filters are available on a tenant surface and what they mean

Examples:
- lead grade
- DNC flagged
- no address available
- referral source

Status:
- partial, first shared filter-toolbar primitive is live but registry extraction is still incomplete

## 5. Sort registry

Purpose:
- define which sort orders a tenant can use on a given list

Examples:
- score
- close rate
- order count
- revenue
- recency

Status:
- partial, FraterniTees sort options now come from workspace config

## 6. Account detail module

Purpose:
- configurable section inside account detail

Examples:
- map agreement block
- identity/location block
- trend block
- PPP savings block
- proposal block

Status:
- partial, account-detail sections are now workspace-driven for current tenants

## 7. KPI card set

Purpose:
- small dashboard summaries over canonical or compiled data

Examples:
- total organizations
- average score
- DNC count
- order count

Status:
- landed as a first shared primitive component

## 8. Territory pin layer

Purpose:
- render filtered, minimal pin payloads for a tenant map

Examples:
- standard account pins
- lead-colored or score-aware pin surfaces

Status:
- landed

## 9. Connector adapter

Purpose:
- bring external provider data into canonical runtime

Examples:
- Nabis
- Printavo
- Notion

Status:
- landed/in-progress depending on provider

## 10. PDF/document generator

Purpose:
- create tenant-specific outbound documents from local runtime data

Examples:
- PICC PPP discount summary PDF
- PICC mock-order proposal PDF
- future tenant proposal packs

Status:
- landed for PICC-specific flows, not yet packaged

## 11. Geocoding policy

Purpose:
- define how addresses become mappable locations and when not to map

Examples:
- default open-source geocoding
- Google upgrade path
- FraterniTees HQ suppression rule

Status:
- partial, implemented in service code today

## 12. Change request

Purpose:
- capture tenant intent and classify it into safe platform actions

Examples:
- config change
- package change
- primitive proposal
- core-platform queue item

Status:
- landed as an initial queue with persistence, attachments, and heuristic classification
