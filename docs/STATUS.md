# Current Status

## Summary

Map App Harness is no longer just scaffolding. It is a working multi-tenant product with real tenant-specific workflows.

At the same time, it is not yet at the point where tenant onboarding and tenant adaptation are mostly self-serve. The core work now is extracting current tenant behavior into reusable platform structure without slowing current tenant delivery.

## What is live in the repo

### Shared runtime surfaces
- root login redirect and tenant entry flow
- territory map runtime
- accounts directory
- account detail page
- integrations/plugins surface
- runtime health, sync jobs, and supporting APIs

### Tenant-specific workflows

#### PICC
- preferred partner discount workflow
- mock-order proposal workflow
- Nabis/runtime integration paths

#### FraterniTees
- Printavo login/setup flow
- Printavo sync and preview flow
- lead-qualification accounts module with score-based sorting
- lead score + DNC + no-address-aware territory experience
- account-detail trend comparison over the last 2 years

## Current architectural reality

The repo already has:
- a generic runtime model
- tenant-scoped runtime APIs
- differentiated tenant workflows
- reusable shared shells for territory/accounts/detail

The repo does not yet fully have:
- an explicit primitive catalog
- first-class workspace/package manifests
- compiled tenant read-model outputs as the default pattern
- a governed change-request system

## The main problem now

The main problem is not "add more product." The main problem is:

- continue shipping for current tenants
- while reducing how much tenant behavior is hardcoded in shared code

If that does not happen, onboarding future tenants will stay founder-driven.

## Near-term direction

1. document the platform truth clearly
2. define primitives/packages/workspace model
3. extract current tenant behavior into that model
4. keep current tenants moving
5. build the path to self-serve onboarding and safe tenant adaptation

## Current benchmark for decisions

When choosing between two implementations, prefer the one that makes tenant #10 more likely to:

- onboard without you
- connect providers without you
- get a useful workspace quickly
- request safe changes without you
