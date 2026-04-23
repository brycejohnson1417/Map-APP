# Running To-Do List

This is the live execution backlog. It should reflect what the repo actually needs next, not a stale foundation checklist.

## Current focus

- [ ] Finish the repo documentation rewrite so a fresh human or AI can understand the platform direction without chat history
- [ ] Define the first stable primitive catalog from real PICC + FraterniTees behavior
- [ ] Define the first workspace/package manifest shape
- [ ] Extract current tenant scoring/filter/module behavior away from shared branching
- [ ] Add compiled FraterniTees score/trend summaries that can be reused across accounts and territory surfaces
- [ ] Keep current tenant workflows shipping while tightening platform contracts

## Current tenant delivery

### PICC
- [ ] move PPP savings and mock proposal behavior toward clearer package/module boundaries
- [ ] reduce PICC-specific assumptions in shared runtime/presentation code

### FraterniTees
- [x] update grading to weight order volume, close rate, and revenue more explicitly
- [x] add sort controls for close rate and order count
- [x] add 2-year trend view on account detail
- [ ] capture the scoring/trend logic as a reusable primitive candidate

## Platform extraction

- [ ] define package manifest schema
- [ ] define workspace definition schema
- [ ] define module registry contract for account detail sections
- [ ] define filter/sort registry contract for account and territory surfaces
- [ ] define score-summary and trend-summary runtime contracts
- [ ] reduce direct interpretation of tenant-specific `custom_fields` in shared components

## Control plane and onboarding

- [ ] make tenant login/setup flow clearly template-driven
- [ ] expose connector install state cleanly for each tenant
- [ ] document the adapter credential and setup contract for fresh tenant onboarding
- [ ] make the root product flow clearer for non-PICC tenants

## Change system

- [ ] define `change_requests` data model
- [ ] define request classification model: config vs package vs primitive proposal vs core
- [ ] define preview/policy requirements for safe changes
- [ ] define maintainer queue flow for escalated work

## Verification and quality

- [ ] add targeted tests around FraterniTees scoring and trend logic
- [ ] add browser/runtime verification for tenant-specific account list flows
- [ ] keep the docs and backlog aligned after every major slice
- [ ] record what each tenant slice made more reusable

## Anti-patterns to avoid

- [ ] do not keep solving tenant requests by adding more shared-code branching
- [ ] do not treat current tenant velocity and platform extraction as separate concerns
- [ ] do not let AI-generated tenant code become the default customization path
- [ ] do not let docs drift behind the actual platform direction again
