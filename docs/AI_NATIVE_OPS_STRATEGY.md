# AI-Native Operations Strategy

## Purpose

This document translates the AI-native founder/operator thesis into Map App Harness product strategy.

The source input was the local Markdown transcript attached by the user for the Lenny's Podcast Marc Andreessen episode.

The transcript is inspiration, not a product requirement. This document is the self-contained product requirement.

## Strategic conclusion

Map App Harness should not become a generic AI wrapper.

The product should become an AI-native operations harness for vertical businesses with messy accounts, territories, orders, contacts, provider data, follow-up work, and change requests.

The durable value is not the model call. The durable value is the operating system around it:

- canonical tenant data
- provider adapters
- identity resolution
- workflow-specific read models
- tenant type packages
- safe action previews
- human approval gates
- audit history
- measurable customer outcomes

PICC and FraterniTees are the first proof surfaces. They are not the product identity.

## What changed in the operating thesis

### 1. The job is becoming task orchestration

The product should model work as explicit tasks, not broad job titles.

For PICC, examples include:

- choose which accounts to visit today
- identify stale or conflicting CRM records
- draft follow-up after a vendor day or order
- prepare a Preferred Partner or VMI proposal
- compare territory coverage against recent order activity
- flag accounts blocked by missing contact, credit, license, menu, or inventory context

For Screenprinting, examples include:

- identify reorder opportunities
- classify dirty Printavo statuses and tags
- draft customer follow-ups
- prioritize social accounts and comments
- route account cleanup decisions
- summarize manager goals and at-risk accounts

The platform should turn these tasks into visible queues, briefs, drafts, previews, and review actions.

### 2. The valuable operator is E-shaped

The product should assume the best user is not narrowly one role.

The target operator combines:

- domain knowledge
- product judgment
- enough technical understanding to evaluate AI output
- enough design and communication taste to ship useful workflows

The app should help this operator manage more work, not hide all complexity behind a chatbot.

### 3. AI should teach and explain the operation

The product should make each AI recommendation inspectable.

Every generated brief, draft, or suggested action should show:

- source records used
- missing data
- confidence or risk state
- why the recommendation was made
- what action would happen if approved
- what remains manual

This makes the app useful for training new reps, operators, and admins, not only automating existing work.

### 4. The app layer may be where the value compounds

Models, prompts, and generic agent harnesses may be copied quickly. Vertical workflow fit is harder to copy.

Map App Harness should compound value in:

- canonical account/order/contact/location models
- provider-specific adapters for Nabis, Notion, GHL, Printavo, Meta, Google Maps, and future systems
- tenant type defaults
- package boundaries
- audited action history
- dirty-data and identity-review workflows
- UI surfaces that let a human repeatedly trust and correct the system

### 5. The founder should manage an execution plane

The repo should be friendly to many narrow AI-agent workstreams, but the product should keep those workstreams governed.

Good agent work should have:

- one repo root
- one coherent slice
- explicit definition of done
- linked docs/contracts
- verification commands
- a final report

The product itself should eventually offer a similar discipline for tenant change requests.

## Product principles

### Principle 1: Domain workflow depth beats model novelty

Do not chase a generic chat surface first.

Build the workflows where Map App Harness has real data and real customer pain:

- territory operations
- account prioritization
- order-derived follow-up
- provider data cleanup
- identity resolution
- tenant change requests
- draft-only outbound communication
- proposal generation

### Principle 2: AI proposes; humans approve sensitive actions

Default AI capabilities should be read-only or draft-only.

AI may:

- rank accounts
- summarize records
- draft messages
- propose config changes
- propose identity links
- propose cleanup decisions
- generate acceptance criteria
- generate a work-registry candidate

AI must not silently:

- write back to provider systems
- change production tenant data
- send messages
- alter auth, billing, RLS, or environment settings
- apply risky tenant configuration
- hide source conflicts

### Principle 3: Every AI output needs provenance

User-facing AI output should identify the underlying records or state it used.

If the source data is stale, missing, conflicted, or fixture-backed, the UI should say so plainly.

### Principle 4: Tenant type packages are the scaling unit

If an AI-assisted workflow repeats across tenants in the same industry, it belongs in:

- tenant type docs
- package config
- reusable primitive behavior
- admin-configurable mappings

It should not become one more tenant-specific branch in shared code.

### Principle 5: The change-request system is the AI intake surface

Screen comments and tenant requests should become structured work:

- classify request as config, package, primitive, adapter, data, or core-platform
- identify impacted surfaces
- propose acceptance criteria
- preview risk
- suggest verification
- produce a draft work-registry item when appropriate

This is a better product moat than a free-form chatbot.

## AI-native product surfaces

### Operations Brief

Audience: tenant operators, reps, managers, and founder/admin users.

Purpose: provide a daily or situational brief from runtime data.

Inputs:

- accounts
- contacts
- orders
- activities
- territory state
- sync freshness
- identity conflicts
- configured tenant goals

Outputs:

- ranked next actions
- account visit suggestions
- stale-data warnings
- follow-up drafts
- proposal opportunities
- source links and confidence states

Required guardrails:

- no provider write-back
- no outbound sending
- source records visible
- missing/conflicting data visible
- user confirmation before any state change

### Data Quality Review

Audience: admins and operators responsible for CRM hygiene.

Purpose: turn messy provider data into a review queue.

Inputs:

- duplicate accounts
- missing contacts
- conflicting provider identities
- dirty status/tag values
- stale sync jobs
- unmapped fields

Outputs:

- grouped review queues
- suggested fixes
- affected surfaces
- safe defaults
- approval or defer actions

Required guardrails:

- preserve source payloads
- keep destructive cleanup manual
- record audit events for accepted decisions

### Change Request Copilot

Audience: tenant admins and platform maintainers.

Purpose: convert user-visible requests into governed platform work.

Inputs:

- screen comments
- route and screenshot metadata
- tenant type
- workspace definition
- relevant docs and contracts
- current package/config state

Outputs:

- request classification
- impacted docs/files
- acceptance criteria
- risk classification
- preview requirements
- suggested work-registry candidate

Required guardrails:

- proposal-only until maintainer approval
- never edit production tenant data directly
- distinguish tenant config from core-platform work

### Proposal Builder

Audience: PICC and future wholesale-style tenants.

Purpose: turn account, order, inventory, pricing, and territory context into draft proposals.

Initial PICC workflows:

- Preferred Partner savings explanation
- VMI or restock proposal
- account-specific follow-up
- territory-account expansion plan

Required guardrails:

- draft-only output
- show source orders/accounts used
- disclose missing inventory or live sales data
- keep tenant-specific pricing rules in package/config boundaries

### Reorder And Social Workbench

Audience: Screenprinting tenants.

Purpose: combine order history, reorder signals, customer activity, and social context into action queues.

Initial Screenprinting workflows:

- reorder follow-up draft
- high-value customer watchlist
- social alert prioritization
- customer/account mapping review
- campaign follow-up suggestions

Required guardrails:

- Printavo remains read-only by default
- social publishing remains gated
- drafts require human review
- dirty mappings are visible

## Moat map

### Not durable by itself

- a chatbot
- prompts
- thin model wrappers
- generic agent orchestration
- generated one-off tenant code
- UI copy that says "AI-powered"

### Potentially durable

- trusted canonical account/order/contact/location data
- source-preserving provider adapters
- tenant-specific decision history
- tenant type package defaults
- identity-resolution corrections
- workflow-specific read models
- audit trails and approval gates
- accumulated examples of accepted and rejected recommendations
- browser-verified workflows that save real operator time

## Operating doctrine for Codex work

Treat Codex as execution capacity, not product management.

Good prompts should specify:

- mode
- repo path
- one coherent slice
- source docs
- definition of done
- verification commands
- final report expectations

For Map App Harness, the default path is:

1. Read repo docs.
2. Pick or create a self-contained work item.
3. Build the smallest useful slice.
4. Verify it.
5. Update docs.
6. Report changed files, commands, pass/fail state, and remaining risk.

## Strategic non-goals

- Do not rebuild PICC-Web-App inside this repo.
- Do not turn Map App Harness into a generic no-code builder.
- Do not let AI directly mutate provider systems before the adapter, permission, preview, and audit contracts exist.
- Do not claim AI outcomes from fixture or stale data as live truth.
- Do not add tenant-specific code when config, package, primitive, or tenant type behavior is the right boundary.

## Acceptance criteria for AI-native work

Any AI-native feature should satisfy these checks before it is considered real:

- The user can operate it from the browser UI.
- The feature uses tenant-scoped runtime data or clearly labeled fixtures.
- The feature shows provenance for recommendations.
- The feature exposes missing, stale, or conflicting data.
- The feature is draft-only or approval-gated for sensitive actions.
- The feature records or prepares audit history for accepted decisions.
- The feature has automated verification for deterministic logic.
- The feature has browser proof when visible behavior changes.
- The docs explain the workflow without relying on chat history.
