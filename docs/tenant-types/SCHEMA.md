# Tenant Type And Workspace Schema

## Purpose

This file defines the JSON contracts for tenant type manifests and tenant workspace manifests.

For vocabulary, read [../GLOSSARY.md](../GLOSSARY.md). For database contracts, read [../DATA_MODEL.md](../DATA_MODEL.md).

## Tenant Type Manifest

Path: `tenant-types/<tenant-type-id>/type.json`

Tenant type manifests define industry-level defaults and contracts. They are not tenant-specific configuration files.

### Required Shape

```json
{
  "id": "screenprinting",
  "version": 1,
  "kind": "tenant_type",
  "displayName": "Screenprinting",
  "summary": "Industry-level summary.",
  "tenantDocScope": "Rules that apply to all tenants of this type.",
  "tenantSpecificDocScope": "Rules for docs/tenants/<tenant>/.",
  "stablePrimitives": ["organization", "account"],
  "configurationSurfaces": ["Printavo status mapping"],
  "defaultAdapters": ["printavo_read_only"],
  "securityBoundaries": ["Every runtime row must be scoped by organization_id."],
  "documentation": ["docs/tenant-types/screenprinting/README.md"]
}
```

### Field Contract

| Field | Type | Required | Rules |
|---|---:|---:|---|
| `id` | string | yes | Stable snake-case id. Used by `workspace.json tenantType.id`. |
| `version` | integer | yes | Increment when universal behavior, defaults, adapters, or required primitives change. |
| `kind` | string | yes | Must be `tenant_type`. |
| `displayName` | string | yes | Human-readable tenant type name. |
| `summary` | string | yes | One-paragraph product summary. |
| `tenantDocScope` | string | yes | Defines what universal docs can decide. |
| `tenantSpecificDocScope` | string | yes | Defines what tenant docs can decide. |
| `stablePrimitives` | string[] | yes | Internal primitives that implementations must preserve. |
| `configurationSurfaces` | string[] | yes | Admin/config areas tenants can customize without code forks. |
| `defaultAdapters` | string[] | yes | Adapter capabilities expected by default for this type. |
| `securityBoundaries` | string[] | yes | Tenant isolation and credential rules. |
| `documentation` | string[] | yes | Canonical docs for the type. Keep this short and authoritative. |

### Screenprinting Current Manifest Requirements

The `screenprinting` type must include these stable primitives:

- `organization`
- `account`
- `account_identity`
- `contact`
- `order_record`
- `activity`
- `opportunity`
- `campaign`
- `social_account`
- `social_post`
- `social_thread`
- `alert`
- `dashboard`
- `mapping_rule`
- `custom_field`

It must include these configuration surfaces:

- Printavo status mapping
- Printavo tag and field mapping
- customer and organization categories
- owned and watched social accounts
- sales and social follow-up ownership
- reorder cycles and high-value repeat windows
- email draft templates
- social alert thresholds
- identity resolution rules
- dashboard widgets and saved views
- feature flags and plugin capabilities

## Tenant Workspace Manifest

Path: `tenants/<tenant-slug>/workspace.json`

Tenant workspace manifests seed one tenant's compiled runtime experience. The runtime compiler may merge organization-level overrides from `organization.settings.workspace.overrides`.

### Required Shape

```json
{
  "id": "fraternity-sales",
  "version": 1,
  "kind": "tenant_workspace",
  "displayName": "FraterniTees",
  "tenantType": {
    "id": "screenprinting",
    "scope": "tenant_type",
    "displayName": "Screenprinting",
    "manifestPath": "tenant-types/screenprinting/type.json",
    "docsPath": "docs/tenant-types/screenprinting/README.md"
  },
  "templateLabel": "Fraternity Sales Ops",
  "description": "Tenant workspace description.",
  "selfServe": true,
  "emailDomains": ["example.com"],
  "defaultOrgSlug": "example",
  "defaultRedirectPath": "/accounts",
  "branding": {
    "heroEyebrow": "Workspace eyebrow",
    "heroTitle": "Workspace title",
    "heroDescription": "Workspace description"
  },
  "navigation": [],
  "packages": [],
  "connectors": [],
  "modules": {},
  "changeRequests": {
    "enabled": true,
    "defaultClassification": "config",
    "classifications": ["config", "package", "primitive", "core"],
    "allowAttachments": true
  },
  "onboarding": {
    "enabled": true,
    "summary": "Setup summary."
  }
}
```

### Field Contract

| Field | Type | Required | Rules |
|---|---:|---:|---|
| `id` | string | yes | Workspace seed id used by onboarding/bootstrap as `templateId`. |
| `version` | integer | yes | Increment when committed tenant workspace seed changes. |
| `kind` | string | yes | Must be `tenant_workspace`. |
| `displayName` | string | yes | Tenant display name. |
| `tenantType` | object | strongly required for current tenants | Declares the industry contract. |
| `tenantType.id` | string | yes when `tenantType` exists | Must match a tenant type manifest id. |
| `tenantType.scope` | string | yes when `tenantType` exists | Must be `tenant_type`. |
| `tenantType.displayName` | string | yes when `tenantType` exists | Human-readable type name. |
| `tenantType.manifestPath` | string | yes when `tenantType` exists | Path to `type.json`. |
| `tenantType.docsPath` | string | yes when `tenantType` exists | Path to tenant type docs entrypoint. |
| `templateLabel` | string | yes | User-facing tenant type/workspace option label. |
| `description` | string | yes | Product description. |
| `selfServe` | boolean | yes | Whether onboarding can create an org without guided setup. |
| `emailDomains` | string[] | yes | Domains that resolve to this tenant workspace seed. |
| `defaultOrgSlug` | string | yes | Default tenant slug for seeded tenant. |
| `defaultRedirectPath` | string | yes | Path after login/onboarding. |
| `branding` | object | yes | Hero/onboarding copy. |
| `navigation` | array | yes | Nav items with `id`, `label`, `href`, and `icon`. |
| `packages` | string[] | yes | Package manifest ids. |
| `connectors` | array | yes | Connector setup definitions. |
| `modules` | object | yes | Module config by module key. |
| `geocoding` | object | no | Tenant geocoding/suppression rules. |
| `scoring` | object | no | Tenant scoring model config. |
| `changeRequests` | object | yes | Change-request capability config. Compiler forces support on. |
| `onboarding` | object | yes | Onboarding capability config. |

## Connector Definition

```json
{
  "provider": "printavo",
  "label": "Printavo",
  "description": "Sync organizations, contacts, and orders directly from Printavo.",
  "required": true,
  "selfServe": true,
  "supportsPreview": true,
  "supportsFirstSync": true,
  "fields": [
    {
      "key": "email",
      "label": "Printavo email",
      "type": "email",
      "required": true,
      "placeholder": "ops@example.com"
    }
  ]
}
```

Field types allowed by current code: `text`, `email`, `secret`, `textarea`, `url`.

Secrets must be sent to server routes and stored in tenant-scoped encrypted installation secrets, not committed JSON.

## Module Config Contract

Current module keys:

- `accounts`
- `accountDetail`
- `territory`
- `integrations`

Required future Screenprinting module keys:

- `sales`
- `social`
- `screenprintingAdmin`

Module configs should include:

- `variant`
- tenant-controlled labels
- enabled sections
- filters/sorts/facets
- page size or date-range defaults
- feature flags that affect that module
- saved-view defaults where applicable

## Inheritance And Overrides

The runtime compile flow is:

1. Select a committed tenant workspace seed by `templateId`, org slug, or default fallback.
2. Read `organization.settings.workspace.overrides` if present.
3. Deep-merge overrides into the workspace seed.
4. Normalize mandatory platform support such as change requests.
5. Validate package ids exist.

Current compiler behavior:

- Objects are deep-merged.
- Arrays are replaced by the override value.
- Scalar values are replaced by the override value.
- `change-request-kit` and the Change Requests nav item are forced on.

Required rule: tenant overrides must not change `tenantType.id` silently. Moving a tenant to a different tenant type is a migration and requires docs and acceptance checks.

## Versioning And Upgrades

Tenant type version changes must include:

- old version
- new version
- changed defaults
- required migration, if any
- affected tenant workspace seeds
- affected organization-level overrides
- verification command

Workspace version changes must include:

- what changed for that tenant seed
- whether existing organizations need override migration
- how the change affects onboarding

Upgrade behavior for a new tenant type version:

1. Add the new manifest version.
2. Add additive migrations first when new primitives require tables.
3. Update docs in the tenant type folder.
4. Update workspace seeds that should receive the new defaults.
5. Leave existing organization overrides intact unless a migration explicitly transforms them.
6. Provide an admin preview of changed defaults before applying them to existing tenants when the change can alter reporting or workflow routing.

## Worked Example: Second Screenprinter Onboarding

Target tenant: `acme-screenprint`.

Goal: onboard without forking the app.

Committed setup:

1. Add `tenants/acme-screenprint/workspace.json`.
2. Set `tenantType.id` to `screenprinting`.
3. Use the Screenprinting docs as universal product requirements.
4. Configure branding, email domain, default redirect, modules, connector labels, geocoding policy, and initial feature flags.
5. Do not create new shared-code branches for Acme-specific status names, tags, social categories, dashboards, or reorder rules.

Runtime setup:

1. Bootstrap organization with slug `acme-screenprint`.
2. Connect Printavo through tenant-scoped connector install.
3. Run read-only Printavo preview.
4. Configure status/tag/field mapping through Screenprinting admin.
5. Mark dirty fields before reporting is treated as authoritative.
6. Add owned and watched social accounts through API scan or manual import.
7. Configure alert rules, follow-up owners, reorder windows, email templates, and dashboards.

Example tenant override stored in `organization.settings.workspace.overrides`:

```json
{
  "emailDomains": ["acmescreenprint.com"],
  "branding": {
    "heroTitle": "Run school, team, and local business growth from one workspace."
  },
  "modules": {
    "accounts": {
      "pageSize": 75
    },
    "territory": {
      "defaultColorMode": "orders"
    }
  }
}
```

This override changes the tenant experience without changing the Screenprinting tenant type contract.

## Type Versus Tenant Override Diff

| Decision | Belongs in tenant type | Belongs in tenant workspace seed | Belongs in organization override |
|---|---:|---:|---:|
| Screenprinting uses Printavo-style order sync | yes | no | no |
| Printavo is read-only in MVP | yes | no | no |
| FraterniTees domain is `fraternitees.com` | no | yes | possible |
| A tenant's current Printavo API key | no | no | encrypted connector secret |
| A tenant maps `Job Complete` to completed | no | seed default only if known | yes |
| Every tenant can define social alert thresholds | yes | no | yes |
| One tenant's watched Instagram handles | no | no | yes or product-owned social tables |
| Sales module has opportunities and reorders | yes | no | no |
| One tenant calls opportunities `Deals` | no | yes | yes |

## Acceptance Criteria

- `tenant-types/<type>/type.json` validates as JSON and includes all required arrays.
- Every current tenant workspace declares `tenantType`.
- The compiler can produce a workspace with committed seed plus organization overrides.
- A second Screenprinting tenant can onboard with a new workspace seed and organization overrides without adding a tenant-specific code branch.
- Risky mapping changes have an impact preview before save when feasible.
- Tenant type docs define universal behavior; tenant-specific docs record only one-tenant decisions.

## Current Second Screenprinting Proof

The second Screenprinting workspace seed is committed at `tenants/second-screenprinter/workspace.json`.

It uses `tenantType.id=screenprinting`, the same Screenprinting API/UI/config contracts, and different tenant-scoped feature flags and mapping defaults from FraterniTees. The runtime registry imports it as a workspace seed; no Screenprinting code branches on the tenant slug to enable it.
