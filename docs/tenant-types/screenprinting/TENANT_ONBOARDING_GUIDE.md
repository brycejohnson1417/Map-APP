# Screenprinting Tenant Onboarding Guide

This guide is for tenant admins configuring a Screenprinting workspace after the product foundation is deployed.

## Setup Order

1. Connect providers in Integrations.
   - Printavo remains read-only.
   - Meta / Instagram can use Business Login for Instagram or Facebook Login for Business.
   - Save the auth mode, Graph API version, app/business IDs, granted scopes, and access token.

2. Review mappings in the Screenprinting Admin tab.
   - Status mappings decide how Printavo statuses roll into sales buckets.
   - Payment mappings decide paid/unpaid/needs-review reporting.
   - Tag mappings decide categories and customer/account routing.
   - Field trust decides which source fields are authoritative, needs-review, dirty, ignored, or blocked from reporting.

3. Preview before saving.
   - Use Preview impact for each config section.
   - Save one section at a time after review.
   - Change history and audit events should stay readable.

4. Configure social operations.
   - Owned accounts are authorized through Meta and can publish/reply only when token, scopes, owned Instagram user IDs, public media URLs, and feature flags are present.
   - Watched accounts can be added manually without ownership.
   - API enrichment for watched accounts only runs where the provider permits it.

5. Review identity suggestions.
   - Approve or reject social/customer/contact/org suggestions.
   - Approval links records non-destructively.
   - Never destructively merge customers, organizations, contacts, or social identities.

## Admin UI Surfaces

- Tenant Setup Guide: high-level setup checklist.
- Onboarding Help: in-app support cards for provider setup, mapping review, owned vs watched accounts, and review queues.
- Tenant Configuration: editable settings for mappings, field trust, reorder rules, templates, social categories, alert rules, and feature flags.
- Identity Resolution: non-destructive approval/rejection queue.
- Import and Account Setup: manual watched/owned social account import and Meta owned-account scan.
- Meta / Instagram connection: readiness state, missing scopes, connection mode, and enabled capabilities.

## Support Rules

- If the UI cannot safely automate a decision, mark the data `needs_review` or `dirty`.
- If provider credentials or scopes are missing, show a gated state instead of fake success.
- If a tenant-specific decision is required, expose it as a tenant setting or review workflow, not a shared-code branch.
- Keep Printavo source data read-only until a tenant-approved write-back workflow exists.
