# Workspace Model

## Purpose

This document defines the direction for how tenant behavior should move out of shared code and into portable workspace structure.

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

This is the shape the repo should move toward:

```text
tenants/
  fraternitees/
    workspace.yaml
    scoring/
    modules/
    sync/
    documents/
  picc/
    workspace.yaml
    scoring/
    modules/
    sync/
    documents/

packages/
  territory-map-kit/
  lead-scoring-kit/
  document-pdf-kit/
```

The repo does not fully use this structure yet. That is a target extraction path.

## Workspace responsibilities

A workspace definition should eventually be able to answer:

- which packages are installed
- which modules appear on each surface
- which scoring model is active
- which filters and sorts are visible
- which connectors are required or optional
- which tenant rules affect map/account/document behavior

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
