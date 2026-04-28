# Screenprinting Competitor Gap Build

Date: 2026-04-28

## Goal

Implement the competitor-demo capabilities that FraterniTees lacked but can safely support in the current Screenprinting MVP without Printavo write-back, email sending, destructive merges, or tenant-specific shared-code branches. Social provider write-back is implemented only through owned-account Meta authorization, tenant feature flags, and audited product routes.

## Implemented

- Orders cockpit filters, count chips, and tenant-scoped saved views backed by `dashboard_definition`.
- Reorder workflow actions for draft outreach, snooze, and add-to-opportunity.
- Email draft marked-sent activity logging while keeping email draft-only.
- Editable opportunities with manual create and persisted stage updates.
- Manager performance goals saved per month in product-owned tenant storage.
- Account cleanup queues for non-destructive merge suggestions and unlinked orders.
- Order detail margin worksheet labeled as needs-review estimate, not synced actual cost.
- Social account filters and taxonomy controls for platform, ownership, category, priority, and status.
- Social post filters and draft-only composer that saves `social_post.status = draft`.
- Meta/Instagram readiness model for Business Login for Instagram and Facebook Login for Business, including owned-account discovery, watched-account manual import, capability gates, and setup guidance.
- Live-gated Meta routes for publishing posts, replying to comments, and replying to messages when token, scopes, owned account IDs, and tenant flags are present.
- Alerts inbox filters and mark-read actions.
- Custom dashboard creation from approved widget primitives backed by `dashboard_definition`.

## Guardrails

- Printavo remains read-only.
- Email remains draft-only.
- Social publishing, comment replies, and message replies are feature-gated and fail closed without Meta authorization.
- Merge/identity cleanup remains non-destructive.
- Product-owned writes require tenant-session-protected API routes and remain scoped by `organization_id`.

## Verification

- `npm run typecheck` passed after implementation fixes.
- `npm run lint` passed after implementation fixes.
- `npm run verify` passed after final implementation.
- `SMOKE_BASE_URL=http://127.0.0.1:3210 NEXT_PUBLIC_DEFAULT_ORG_SLUG=fraternitees npm run smoke:runtime` passed against a local production server.
- `SMOKE_BASE_URL=http://127.0.0.1:3210 NEXT_PUBLIC_DEFAULT_ORG_SLUG=fraternitees npm run verify:browser` passed against a local production server.
- Targeted Playwright walkthrough passed for authenticated `/screenprinting?org=fraternitees` Admin onboarding/config editors and Social Meta readiness.
- `supabase db push --yes` applied `20260427120000_screenprinting_foundation.sql` and `20260428100000_meta_instagram_provider.sql` to the linked Supabase project.

## Remaining Work

- Add deeper authenticated tenant-session E2E coverage for saved views, manager goals, draft posts, manual social import, campaign creation, alert updates, and identity approvals.
