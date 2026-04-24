# Platform Spec

## Product definition

Map App Harness is a multi-tenant business-operations platform that gives each tenant a tailored operational workspace without requiring a separate codebase.

The platform is built around:

- canonical runtime data
- a map/list/detail operating shell
- adapters for tenant systems
- reusable primitives and packages
- portable tenant workspace definitions
- a future change system for safe adaptation

## What customers actually buy

Customers do not buy a "workspace compiler." They buy a workspace that solves a painful operating job:

- wholesale territory and account operations
- order-aware customer scoring
- proposal generation
- follow-up and field workflows

The compiler-like architecture exists to make those workspaces reusable and adaptable, not to become the external product pitch too early.

## North-star tenant journey

The target self-serve journey is:

1. tenant signs in
2. tenant picks a workspace template
3. tenant connects one or more providers
4. tenant syncs canonical accounts/orders/contacts
5. tenant receives a usable workspace immediately
6. tenant changes scoring, filters, modules, and documents through config
7. tenant requests more advanced changes through an in-app change system
8. safe changes preview and ship without founder involvement

That is the standard we are working toward.

## Current reality

The repo is partially there already:

- shared tenant-aware runtime exists
- template-driven onboarding v1 exists
- current tenants already use differentiated workspaces
- adapters for Notion, Nabis, Printavo, CSV-style mapping patterns, and Google Maps/geocoding are in flight or landed
- account, territory, and document flows are live
- workspace manifests and package manifests are live
- change-request persistence, attachments, and screenshot-first screen comments are live

The missing pieces are mainly:

- broader primitive extraction and package contracts
- clearer read-model compilation
- preview/policy layers on the governed tenant change workflow

## Core platform requirements

1. `Supabase Postgres` is the runtime source of truth for product reads.
2. `organization_id` scopes every business row and permission boundary.
3. External systems sync into local runtime models.
4. The map, accounts, and supporting workflows operate over the same canonical data.
5. The platform supports multiple tenants without code forks.
6. Tenant behavior should move toward config/packages instead of direct shared-code branching.
7. Documentation must be good enough for a fresh human or AI to continue without hidden history.

## Core concepts

### Canonical entities
- organization
- membership
- account
- identity
- contact
- order
- activity
- location/territory
- document
- sync state

### Extensibility units
- primitive
- package
- workspace definition
- adapter
- change request

## Product surfaces

### Shared surfaces
- login and tenant routing
- territory map
- account directory
- account detail
- integrations/plugins
- runtime health and sync visibility

### Tenant-specific surfaces already present
- PICC PPP savings and mock-order proposals
- FraterniTees lead scoring and Printavo onboarding

These should increasingly become package/module outputs, not isolated branches.

## AI and automation role

The platform should become AI-friendly, but AI is not the product surface.

The right model is:

- tenant-facing change assistant
- structured request translation
- policy-based routing
- safe config/package application
- maintainer queue for new primitives and core work

## Success definition

The platform is succeeding when:

1. each new tenant requires less custom branching than the previous one
2. reusable primitives/packages grow from real tenant work
3. tenant #10 can onboard and adapt meaningfully without direct founder involvement
