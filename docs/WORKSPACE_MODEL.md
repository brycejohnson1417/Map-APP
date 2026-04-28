# Workspace Model

For vocabulary, read [GLOSSARY.md](GLOSSARY.md). For the JSON schema and override contract, read [tenant-types/SCHEMA.md](tenant-types/SCHEMA.md).

## Purpose

This document defines how tenant behavior is moving out of shared code and into portable workspace structure.

The goal is not to build a generic no-code builder. The goal is to make tenant workspaces:

- portable
- inspectable
- AI-legible
- governable
- increasingly self-serve

## Core concepts

### Workspace
A tenant workspace is the full operational definition for one organization:

- installed packages
- enabled modules
- scoring rules
- filters and sorts
- sync mappings
- document templates
- plugin/integration settings

The committed JSON contract is defined in [tenant-types/SCHEMA.md](tenant-types/SCHEMA.md).

### Tenant Type
A tenant type is the reusable industry-level operating contract for a group of tenants with similar tools and workflows.

Examples:
- `Screenprinting` for FraterniTees and other screenprinters using Printavo/social workflows
- `Cannabis Wholesale` for PICC and similar wholesale territory/account operations

Tenant type docs define universal defaults. Tenant-specific docs define one tenant's decisions, exceptions, credentials, and rollout state.

### Package
A package is a reusable bundle of behavior that can be installed into one or more workspaces.

Examples:
- territory map kit
- lead scoring kit
- proposal/PDF kit
- tenant vertical kits

### Primitive
A primitive is the lowest reusable business behavior the platform exposes.

Packages are built from primitives plus configuration.

## Directional file shape

This is the shape the repo now uses in its first live form:

```text
tenant-types/
  screenprinting/
    type.json
  cannabis-wholesale/
    type.json

tenants/
  fraternitees/
    workspace.json
    field-mappings.json
  picc/
    workspace.json
    field-mappings.json
    preferred-partner-pricing.json
  field-ops-starter/
    workspace.json

packages/
  core-runtime/
  territory-map-kit/
  account-directory-kit/
  lead-score-kit/
  trend-module-kit/
  change-request-kit/
  connector-onboarding-kit/
docs/
  tenant-types/
    screenprinting/
    cannabis-wholesale/
  tenants/
    fraternitees/
    picc/
```

The repo is still early in this extraction. The manifests now exist and are wired into login, navigation, onboarding, integrations, and FraterniTees score behavior, but not every tenant-specific behavior has been pulled under them yet.

## Tenant type responsibilities

A tenant type definition should answer:

- which industry defaults apply to all tenants of the type
- which adapters are standard for that type
- which modules are default, optional, or future
- which configuration surfaces must be editable by tenant admins
- which dirty-data patterns the type should expect
- which docs apply universally to the type
- which security boundaries are non-negotiable

For Screenprinting, this includes Printavo mappings, owned/watched social accounts, reorder rules, email draft templates, dashboard customization, and future catalog adapter boundaries.

For Cannabis Wholesale, this includes Nabis/CRM mapping, territory workflows, route/account controls, proposal/savings documents, and wholesale account reporting.

Tenant types are not tenant forks. They are default operating contracts that compile with tenant-specific workspace config.

## Workspace responsibilities

A workspace definition should eventually be able to answer:

- which tenant type it belongs to
- which packages are installed
- which modules appear on each surface
- which scoring model is active
- which filters and sorts are visible
- which connectors are required or optional
- which tenant rules affect map/account/document behavior
- which geocoding rules suppress or downgrade bad addresses
- which route-scoping and copy decisions should render without shared-code tenant branches

## What should become config first

These are good candidates for workspace config:

- tenant type overrides that do not weaken security
- score weights and grade thresholds
- DNC rules
- visible account detail sections
- map and account filters
- sort options
- trend windows
- branding and labels
- package/plugin toggles

These are already live in the current repo:

- FraterniTees score weights, grade guards, DNC rule, and trend window
- account-directory sort and grade options
- account-detail section registry
- account-detail hero/orders/updated labels
- integrations-route behavior per workspace
- navigation model per workspace
- route-planning plugin default per workspace
- territory default color modes and visible map color modes
- geocoding placeholder/suppressed-address policy for FraterniTees
- FraterniTees and PICC tenant type references in their workspace manifests

## What should stay code

These are still platform-code responsibilities:

- canonical entity model
- adapter contracts
- security and tenant isolation
- read-model compiler/runtime
- package loader/versioning
- tenant type registry validation
- change policy engine

## Change-system classification

The future change system should classify requests into:

### 1. Config change
Safe, declarative, previewable.

### 2. Package change
Tenant or reusable package behavior update.

### 3. Primitive proposal
New reusable capability needed.

### 4. Core-platform change
Touches platform substrate or shared runtime.

This classification is the backbone of scaling tenant changes without becoming a services shop.
