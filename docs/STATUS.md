# Current Status

## Summary

Map App Harness is no longer just scaffolding. It is a working multi-tenant product with real tenant-specific workflows.

At the same time, it is not yet at the point where tenant onboarding and tenant adaptation are mostly self-serve. The core work now is extracting current tenant behavior into reusable platform structure without slowing current tenant delivery.

## What is live in the repo

### Shared runtime surfaces
- root login redirect and tenant entry flow
- template-driven onboarding flow
- territory map runtime
- accounts directory
- account detail page
- integrations/plugins surface
- change-request queue surface
- runtime health, sync jobs, and supporting APIs

### Tenant-specific workflows

#### PICC
- preferred partner discount workflow
- mock-order proposal workflow
- Nabis/runtime integration paths

#### FraterniTees
- Printavo login/setup flow
- Printavo sync and preview flow
- lead-qualification accounts module with workspace-driven score/sort config
- lead score + DNC + no-address-aware territory experience
- account-detail trend comparison over the last 2 years
- self-serve domain handoff so teammates on the same company domain can resolve back into the same workspace after bootstrap

## Current architectural reality

The repo already has:
- a generic runtime model
- tenant-scoped runtime APIs
- differentiated tenant workflows
- reusable shared shells for territory/accounts/detail
- first workspace manifests and package manifests wired into runtime navigation
- first change-request persistence layer and attachment storage path
- generic tenant-session cookies and template-aware onboarding instead of shared runtime paths hardcoding PICC/FraterniTees session cookies
- workspace-driven account-detail copy and territory color/filter behavior
- workspace-driven geocoding policy hooks for tenant-specific no-address and suppressed-address rules

The repo does not yet fully have:
- a complete primitive extraction across every tenant surface
- compiled tenant read-model outputs as the default pattern beyond the FraterniTees account directory
- preview/policy automation on top of the new change-request queue
- fully self-serve connector depth across all templates

## The main problem now

The main problem is not "add more product." The main problem is:

- continue shipping for current tenants
- while reducing how much tenant behavior is hardcoded in shared code
- without letting shared runtime defaults quietly snap back to PICC-first assumptions

If that does not happen, onboarding future tenants will stay founder-driven.

## Near-term direction

1. document the platform truth clearly
2. keep moving tenant behavior from shared branching into workspace/package config
3. strengthen the new onboarding and change-request systems
4. keep current tenants moving
5. build the next layer of safe adaptation and compiled read models

## Current benchmark for decisions

When choosing between two implementations, prefer the one that makes tenant #10 more likely to:

- onboard without you
- connect providers without you
- get a useful workspace quickly
- request safe changes without you
