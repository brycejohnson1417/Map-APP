# Second Screenprinter Tenant

## Tenant-specific scope

Tenant-specific docs record only one-tenant decisions. Universal Screenprinting behavior belongs in `docs/tenant-types/screenprinting/`.

## Purpose

This tenant proves a second Screenprinting workspace can compile from the shared tenant type without adding a tenant-specific code branch.

## Current decisions

- Tenant type: `Screenprinting`
- Workspace manifest: `tenants/second-screenprinter/workspace.json`
- Printavo is represented through the read-only ordering adapter boundary.
- Social data starts with manual import fallback.
- Social publishing, catalog costs, and profitability are disabled.
- Comments and messages are disabled until tenant credentials and permissions are explicitly configured.

## Data policy

All tenant business data remains scoped by `organization_id`. The fixture-backed onboarding proof must not destructively merge customers, contacts, organizations, or social identities.
