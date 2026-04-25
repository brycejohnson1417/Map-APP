# Running To-Do List

This is the live execution backlog. It should reflect what the repo actually needs next, not a stale foundation checklist.

## Current focus

- [x] Finish the repo documentation rewrite so a fresh human or AI can understand the platform direction without chat history
- [x] Define the first stable primitive catalog from real PICC + FraterniTees behavior
- [x] Define the first workspace/package manifest shape
- [x] Extract current tenant scoring/filter/module behavior away from shared branching
- [ ] Add broader compiled FraterniTees score/trend summaries that can be reused across accounts and territory surfaces beyond the current account-detail and account-directory row badges
- [ ] Keep current tenant workflows shipping while tightening platform contracts
- [ ] continue deleting remaining shared-code tenant branching that is not justified by a primitive or workspace contract

## Current tenant delivery

### PICC
- [ ] move PPP savings and mock proposal behavior toward clearer package/module boundaries
- [ ] reduce PICC-specific assumptions in shared runtime/presentation code

### FraterniTees
- [x] update grading to weight order volume, close rate, and revenue more explicitly
- [x] add sort controls for close rate and order count
- [x] add 2-year trend view on account detail
- [x] show current 2-year score-trend direction directly in the account directory rows
- [x] add a top-100 trailing 12-month spend leaderboard for customer-protection workflows
- [x] add tenant-scoped daily Printavo auto-sync controls and cron wiring
- [x] fix the mobile territory console/filter/pin-detail flow so large maps default to list mode and focused accounts still open from rows or pins
- [x] capture the scoring/trend logic as a reusable primitive candidate
- [x] move score config, sort options, and account-detail sections into workspace config
- [ ] push more map filter/facet behavior into explicit registry config

## Platform extraction

- [x] define package manifest schema
- [x] define workspace definition schema
- [x] define module registry contract for account detail sections
- [ ] define filter/sort registry contract for account and territory surfaces
- [x] define score-summary and trend-summary runtime contracts
- [ ] reduce direct interpretation of tenant-specific `custom_fields` in shared components
- [ ] move more tenant-specific geocoding/address heuristics into explicit workspace policy schemas

## Control plane and onboarding

- [x] make tenant login/setup flow clearly template-driven
- [x] expose connector install state cleanly for each tenant
- [x] document the adapter credential and setup contract for fresh tenant onboarding
- [x] make the root product flow clearer for non-PICC tenants
- [ ] expand self-serve connector save/sync behavior for more providers
- [x] remove tenant-facing paid-provider runtime fallbacks to generic global env keys
- [x] require tenant-session auth on tenant-mutating runtime routes instead of leaving isolated write holes
- [ ] generalize tenant-scoped recurring connector sync beyond the first FraterniTees Printavo automation slice
- [ ] move remaining provider bootstrap and operator tooling onto installation-first, tenant-scoped credential resolution everywhere

## Change system

- [x] define `change_requests` data model
- [x] define request classification model: config vs package vs primitive proposal vs core
- [x] replace the technical tenant form with screenshot-first screen comments
- [ ] define preview/policy requirements for safe changes
- [x] define maintainer queue flow for escalated work
- [ ] add follow-up conversation threads without exposing harness jargon to tenants
- [ ] add stronger live replay of saved comment anchors when screenshots are missing or the layout changes later
- [ ] harden screenshot capture beyond the current fallback path so modern CSS color syntax does not routinely skip preview images

## Verification and quality

- [ ] add targeted tests around FraterniTees scoring and trend logic
- [ ] add browser/runtime verification for tenant-specific account list flows
- [x] add browser verification for mobile territory row focus plus canvas-pin focus
- [x] add browser verification for authenticated screen-comment capture flows
- [x] add a static tenant-isolation verification step so generic paid-provider env usage in runtime code fails fast
- [ ] keep the docs and backlog aligned after every major slice
- [ ] record what each tenant slice made more reusable

## Anti-patterns to avoid

- [ ] do not keep solving tenant requests by adding more shared-code branching
- [ ] do not treat current tenant velocity and platform extraction as separate concerns
- [ ] do not let AI-generated tenant code become the default customization path
- [ ] do not let docs drift behind the actual platform direction again
