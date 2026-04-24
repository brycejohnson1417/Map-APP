# Workspace Model

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
```

The repo is still early in this extraction. The manifests now exist and are wired into login, navigation, onboarding, integrations, and FraterniTees score behavior, but not every tenant-specific behavior has been pulled under them yet.

## Workspace responsibilities

A workspace definition should eventually be able to answer:

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
- integrations-route behavior per template
- navigation model per template
- route-planning plugin default per workspace
- territory default color modes and visible map color modes
- geocoding placeholder/suppressed-address policy for FraterniTees

## What should stay code

These are still platform-code responsibilities:

- canonical entity model
- adapter contracts
- security and tenant isolation
- read-model compiler/runtime
- package loader/versioning
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
