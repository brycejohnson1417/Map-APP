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
- change-request queue surface with screen-comment capture
- runtime health, sync jobs, and supporting APIs

### Tenant-specific workflows

#### PICC
- preferred partner discount workflow
- mock-order proposal workflow
- Nabis/runtime integration paths

#### FraterniTees
- Printavo login/setup flow
- Printavo sync and preview flow
- tenant-scoped daily Printavo auto-sync settings and cron path
- production cron route exercised successfully for FraterniTees daily Printavo sync
- lead-qualification accounts module with workspace-driven score/sort config
- tabbed FraterniTees accounts workspace that separates the scoring engine from the top-customer leaderboard
- FraterniTees accounts header now shows the latest Printavo sync timestamp directly in the API connection card
- lead score + DNC + no-address-aware territory experience
- top-100 trailing 12-month spend leaderboard on the accounts surface
- account-detail trend comparison over the last 2 years
- account-directory row-level score-trend badges for the current 2-year score direction
- mobile territory list-first flow for large pin sets, with mobile selected-account detail sheets when a row or pin is focused
- self-serve domain handoff so teammates on the same company domain can resolve back into the same workspace after bootstrap

## Current architectural reality

The repo already has:
- a generic runtime model
- tenant-scoped runtime APIs
- differentiated tenant workflows
- reusable shared shells for territory/accounts/detail
- first workspace manifests and package manifests wired into runtime navigation
- first change-request persistence layer, attachment storage path, and screen-comment intake flow
- workspace compiler normalization that forces the change-request package, nav item, and enabled flag on for every tenant workspace
- full-viewport locked comment mode rendered above the live runtime so on-screen comment capture can safely intercept page clicks
- comment-mode chrome compacted so the live page stays visible during desktop and mobile annotation
- change-request submission now degrades cleanly when browser screenshot capture hits unsupported CSS color formats
- mobile change-request submission now also degrades cleanly if later screenshot annotation generation fails after capture
- change-request creation now writes the queue item with `queued` status on the current schema instead of using the old `new` status that would 500 on create
- change-request create/update APIs now return JSON errors and treat attachment upload as best-effort so queue items are not blocked by attachment failures
- change-request capture now creates one queue item per on-screen comment, with tenant-visible edit/delete/add-details flows on collapsible request cards
- shared app-frame mobile navigation now uses an explicit menu instead of relying on horizontal nav overflow
- mobile territory rendering now uses a true single-mode view so list mode does not keep a live Leaflet map mounted underneath it
- mobile territory console/filter controls now render in normal flow instead of hiding rows under floating chrome, and mobile pin/list focus now opens a dedicated selected-account sheet
- runtime credential resolution for paid providers now prefers tenant integration installs and tenant-scoped env keys, with generic global fallbacks removed from tenant-facing map/geocoding/Nabis runtime paths
- `npm run check:tenant-isolation` now fails if tenant runtime code reaches for generic shared Google Maps, Nabis, Notion, Printavo, HubSpot, Salesforce, or HighLevel-style credential env names
- tenant-mutating runtime routes for change requests, Notion sync queueing, geocoding, printavo sync, and account check-ins now consistently require tenant-session auth
- generic tenant-session cookies and template-aware onboarding instead of shared runtime paths hardcoding PICC/FraterniTees session cookies
- workspace-driven account-detail copy and territory color/filter behavior
- workspace-driven geocoding policy hooks for tenant-specific no-address and suppressed-address rules
- smoke verification now creates and deletes a real tenant-scoped change request so queue regressions fail before deploy
- FraterniTees account search now preserves multi-word search input instead of stripping whitespace inside the Supabase `or(...)` filter
- the change-request queue CTA now matches the shared header launcher copy so tenants see one consistent `Comment` action
- browser verification can now click a real mobile territory canvas pin through a Playwright-only map hook instead of relying on SVG marker DOM that does not exist when Leaflet is rendering circles on canvas

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
3. strengthen the new onboarding and screenshot-first change-request systems
4. keep current tenants moving
5. build the next layer of safe adaptation and compiled read models

## Current benchmark for decisions

When choosing between two implementations, prefer the one that makes tenant #10 more likely to:

- onboard without you
- connect providers without you
- get a useful workspace quickly
- request safe changes without you
