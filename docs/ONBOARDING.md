# Onboarding System

## Purpose

The onboarding system is the first self-serve control-plane path for tenant #10.

It exists to let a new tenant:

1. pick or be matched to a tenant type
2. claim an organization slug
3. create the organization and owner membership
4. receive a workspace definition seeded from that tenant type
5. land directly in integrations for connector setup

## Current shipped path

### Login
- `/login`
- accepts any valid work email
- resolves existing membership first
- falls back to domain-based tenant type/workspace routing
- falls back to self-serve onboarding for unknown domains

### Onboarding
- `/onboarding`
- renders live workspace cards from `tenants/*/workspace.json`
- posts to `/api/onboarding/bootstrap`
- creates the organization with `settings.workspace.templateId` as a legacy internal workspace-definition id
- stores the creator email domain in `settings.workspace.overrides.emailDomains`
- sets tenant session cookies
- redirects to `/integrations?org=<slug>` when connectors exist

## Current tenant types and workspaces

### FraterniTees
- template id: `fraternity-sales`
- tenant type: `Screenprinting`
- self-serve: yes
- first connector: Printavo
- runtime goal: scored account directory + map + change queue

### PICC
- template id: `wholesale-territory-ops`
- tenant type: `Cannabis Wholesale`
- self-serve: no
- guided setup for Nabis / Notion

### Field Ops Starter
- template id: `field-ops-starter`
- self-serve: yes
- generic empty ops shell with CSV / Google Sheets scaffolding

## Current limitations

- connector depth is uneven across tenant types and workspaces
- only FraterniTees has a full first-sync path today
- onboarding does not yet support team invitations, approval workflow, or domain verification
- domain resolution is email-domain based, not yet verified-domain based
- template overrides are still shallow
- legacy internal names still use `templateId`; new user-facing docs and UI should say tenant type
- tenant type selection and tenant-specific configuration are not yet a complete self-serve admin experience

## Next work

- add richer self-serve connector save/sync paths for more providers
- add connection tests and validation feedback
- add first-run workspace checks after sync
- add tenant type export/import and workspace override previews
