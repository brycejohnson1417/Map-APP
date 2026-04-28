# Screenprinting Implementation Handoff

## Tenant type scope

Tenant type: `Screenprinting`

This is the implementation handoff for building the full Screenprinting Sales and Social foundation.

Tenant-specific FraterniTees docs may record pilot decisions and exceptions. They must not replace the universal Screenprinting contract.

## Required Reading

Read these files before editing:

1. `docs/GLOSSARY.md`
2. `docs/AUTONOMOUS_PRODUCT_BUILD.md`
3. `docs/WORK_REGISTRY.md`
4. `docs/WORK_REGISTRY.json`
5. `docs/DEFINITION_OF_DONE.md`
6. `docs/ARCHITECTURE_RUNWAY.md`
7. `docs/DATA_MODEL.md`
8. `docs/API_CONTRACTS.md`
9. `docs/ACCEPTANCE_AND_FIXTURES.md`
10. `docs/ENVIRONMENT_AND_DEPLOYMENT_POLICY.md`
11. `docs/MIGRATION_SAFETY.md`

Then read `docs/tenant-types/screenprinting/PRODUCT_SPEC.md`.

When implementing a focused surface, also read:

- Sales work: `docs/tenant-types/screenprinting/SALES_MODULE.md`
- Social work: `docs/tenant-types/screenprinting/SOCIAL_MODULE.md`
- FraterniTees pilot decisions: `docs/tenants/fraternitees/README.md`, `docs/tenants/fraternitees/PILOT_SCOPE.md`, `docs/tenants/fraternitees/DATA_DECISIONS.md`

## Code To Inspect

Before designing migrations or UI, inspect:

- `supabase/migrations/`
- `lib/domain/runtime.ts`
- `lib/domain/workspace.ts`
- `lib/platform/workspace/registry.ts`
- `lib/application/fraternitees/`
- `lib/infrastructure/adapters/printavo/`
- `app/accounts/`
- `app/integrations/`
- `app/runtime/[slug]/page.tsx`
- `app/api/runtime/organizations/[slug]/`

## Product Goal

Build the Screenprinting tenant type as a reusable industry workspace for screenprinting businesses. FraterniTees is the first tenant, but the implementation must not become a FraterniTees-only fork.

The implementation must provide:

- read-only Printavo sales/order/customer foundation
- configurable status, payment, tag, field, category, and dirty-data mapping
- customer/account cleanup and non-destructive merge/link suggestions
- opportunities and reorder workflows
- draft-only email follow-up with editable templates
- owned and watched social account registry
- API-backed and manual social account import
- social dashboard, calendar, campaigns, alerts, comments/messages/manual threads
- social account/message/comment links to customers, organizations, contacts, opportunities, and campaigns
- customizable dashboards and saved views
- stable internal primitives with maximum tenant-facing configuration

## Non-Negotiable Constraints

- Do not write back to Printavo in MVP.
- Do not auto-send emails in MVP.
- Do not require live social publishing in MVP.
- Do not destructively merge customers, organizations, contacts, or social identities.
- Do not remove or replace existing FraterniTees value such as lead scoring, score trends, top-customer spend, Printavo sync, account directory, account detail, map, or change requests.
- It is acceptable to improve or reorganize UI/UX when the underlying capability remains reachable and verified.
- Do not hardcode FraterniTees decisions as universal Screenprinting behavior.
- Do not put Screenprinting assumptions into PICC or Cannabis Wholesale.
- Do not use generic shared provider credentials for tenant runtime paths.
- Do not leak data across tenants.
- Do not treat dirty Printavo data as authoritative until mappings and review states exist.

## Build Order

1. Implement the architecture runway in `docs/ARCHITECTURE_RUNWAY.md`.
   - If a future proposal item becomes the best prerequisite for the current Screenprinting feature, implement the smallest useful version of that foundation first per `docs/AUTONOMOUS_PRODUCT_BUILD.md`.
2. Use `docs/WORK_REGISTRY.json` as the execution queue and update statuses after each meaningful slice.
3. Add additive migrations for the required Screenprinting tables in `docs/DATA_MODEL.md`.
4. Add domain types, repositories, and services for mappings, opportunities, reorders, email templates, social accounts, posts, threads, campaigns, alerts, dashboards, and identity resolution.
5. Add API routes from `docs/API_CONTRACTS.md`.
6. Add Screenprinting admin configuration UI.
7. Build Sales dashboard, orders, order detail, accounts cleanup, opportunities, reorders, email templates, and goals surfaces.
8. Build Social dashboard, accounts registry, account detail, posts, post detail, alerts, alert rules, calendar, campaigns, conversations, and compose capability gate.
9. Add non-destructive identity resolution review UI.
10. Add targeted tests for mapping, reorders, alerts, templates, and identity matching using fixture-backed checks from `docs/ACCEPTANCE_AND_FIXTURES.md`.
11. Update docs after each slice.
12. Run full verification.

If this scope is too large for one safe PR, split it into individually revertable PRs in the order above.

## Database Expectations

Add tables with tenant-scoped RLS and indexes matching list filters:

- `mapping_rule`
- `opportunity`
- `reorder_signal`
- `email_template`
- `social_account`
- `social_post`
- `social_thread`
- `campaign`
- `alert_rule`
- `alert_instance`
- `identity_resolution`
- `dashboard_definition`

Every tenant business row must include `organization_id`.

Prefer additive migrations. Do not break existing FraterniTees Printavo sync, current FraterniTees account directory views, or PICC runtime surfaces.

## Admin Configuration UX

Tenant admins must be able to configure:

- Printavo status mapping
- Printavo payment mapping
- Printavo tag mapping
- Printavo field trust and dirty-data settings
- customer and organization categories
- sales follow-up ownership
- social follow-up ownership
- owned social accounts
- watched social accounts
- manual social account import
- reorder cycles and high-value windows
- email templates
- social alert rules
- dashboards and saved views
- feature flags and plugin capabilities

Risky mapping saves should show impact previews when feasible.

## Security Acceptance

Every new query and mutation must prove tenant scope:

- use `organization_id`
- require tenant-session auth for tenant-mutating routes
- role-gate admin configuration once role enforcement exists
- do not use generic provider env fallbacks
- do not share dashboard, alert, social, identity, or campaign state across tenants
- do not treat public social account metadata as shared tenant-specific state

## Verification

Required:

```bash
npm run check:work-registry
npm run verify
```

When UI changes are involved and a server is available:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:runtime
SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_VERIFY=1 npm run verify:browser
```

Add targeted tests for non-trivial matching, mapping, alert, reorder, template-rendering, and identity-resolution logic.

## Documentation Requirements

Update docs while implementing:

- tenant type docs when behavior applies to every Screenprinting tenant
- FraterniTees docs when the decision applies only to FraterniTees
- platform docs when primitives, packages, routes, security, or verification change
- `docs/DATA_MODEL.md` when migrations change
- `docs/API_CONTRACTS.md` when routes change
- `docs/WORK_REGISTRY.json` when status, dependencies, docs, verification, stop conditions, or safe defaults change
- `docs/TODO.md` after each completed slice
- `docs/runs/<timestamp>-<task>.md` after meaningful implementation runs

Never hide implementation gaps. If a capability is deferred, document where and why.
