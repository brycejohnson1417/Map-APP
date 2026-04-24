# Map App Harness

Map App Harness is a multi-tenant business-operations platform built around one idea:

- tenants should get a fast, beautiful, useful workspace now
- the platform should keep getting more self-serve, reusable, and configurable with each tenant

Externally, this product is sold as opinionated vertical workspaces. Internally, it is being architected as a harness that composes tenant workspaces from canonical data, reusable primitives, packages, and portable workspace definitions.

PICC is the first tenant. FraterniTees is the second. Neither tenant is the product.

## Product direction

The next durable version of this repo is not "a CRM with tenant forks." It is:

- a canonical runtime for accounts, contacts, orders, activities, locations, and documents
- a map/list/detail shell that can serve multiple verticals
- tenant-installed adapters and packages
- tenant workspace definitions that stay portable and text-native
- a change system that can translate tenant requests into safe config/package changes

The governing test for new platform work is simple:

> Does this make tenant #10 more likely to onboard and keep moving without founder involvement?

If the answer is no, it is probably the wrong abstraction or the wrong slice.

## Current repo state

The repo already contains working product surfaces, not just scaffolding:

- shared login and tenant routing
- self-serve onboarding for template-based workspaces
- self-serve domain handoff for bootstrap-created workspaces
- runtime-backed territory map and accounts surfaces
- shared account detail page
- workspace-driven navigation and integration surfaces
- in-app screen-comment change capture with annotated screenshots and queue visibility
- PICC-specific PPP savings and mock-order proposal workflows
- FraterniTees-specific Printavo onboarding, sync, lead scoring, and map/account experiences
- first-class workspace/package manifests under `tenants/` and `packages/`
- first primitive components for scorecards, filter bars, and trend panels
- tenant-scoped integration state and plugin toggles
- runtime APIs for territory, accounts, sync jobs, geocoding, and tenant integrations

The repo is also mid-transition:

- most shared auth/session and route-scoping now run through generic tenant session cookies and workspace manifests
- tenant differences still exist in some shared code paths, but the remaining work is now concentrated in reusable primitive/read-model extraction rather than tenant-specific login/session hacks
- the primitive catalog is only partially extracted into reusable runtime components
- workspace/package manifests exist but not every tenant behavior is driven by them yet
- the change-request system exists, but preview/policy automation is still next
- onboarding exists, but connector depth is still uneven across templates
- onboarding is email-domain based today, not verified-domain based

That is the main architectural work now.

## Architecture stance

- `Supabase Postgres` is the operational source of truth for runtime reads
- `Clerk` remains the auth layer
- user-facing surfaces read local runtime data, not live provider payloads
- provider credentials are organization-scoped and encrypted
- tenant-facing provider resolution must never fall back to shared/global paid API keys
- change requests are a core tenant capability and are normalized on for every compiled workspace, not a per-template optional feature
- shared multi-tenant is the default topology today
- tenant-specific behavior should move toward workspace config, packages, and read-model compilation rather than shared-code branching

## What is being built

The target platform shape has seven major layers:

1. canonical data layer
2. primitive layer
3. package layer
4. tenant workspace definition layer
5. compiled read-model/runtime layer
6. tenant change-request system
7. control plane for installs, policies, releases, and auditability

See the docs below for the detailed plan.

## Key docs

- [docs/STATUS.md](docs/STATUS.md)
- [docs/STRATEGY.md](docs/STRATEGY.md)
- [docs/PLATFORM_SPEC.md](docs/PLATFORM_SPEC.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/WORKSPACE_MODEL.md](docs/WORKSPACE_MODEL.md)
- [docs/PRIMITIVE_CATALOG.md](docs/PRIMITIVE_CATALOG.md)
- [docs/ONBOARDING.md](docs/ONBOARDING.md)
- [docs/CHANGE_SYSTEM.md](docs/CHANGE_SYSTEM.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/TODO.md](docs/TODO.md)
- [docs/VERIFICATION_STRATEGY.md](docs/VERIFICATION_STRATEGY.md)
- [docs/AUTONOMOUS_EXECUTION.md](docs/AUTONOMOUS_EXECUTION.md)
- [docs/HANDOFF.md](docs/HANDOFF.md)
- [docs/SETUP.md](docs/SETUP.md)

Tenant-specific migration and requirements material lives under `docs/tenants/<org>/`.

## Local setup

1. Install dependencies

```bash
npm install
```

2. Copy the environment template

```bash
cp .env.example .env.local
```

3. Fill in `.env.local` using [docs/SETUP.md](docs/SETUP.md)

4. Run the app

```bash
npm run dev
```

## Verification

Baseline repo verification:

```bash
npm run verify
```

If you have a local server running and want runtime smoke checks too:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run verify
```

If you want browser-level verification too:

```bash
SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_VERIFY=1 npm run verify
```

## Key scripts

```bash
npm run mapapp -- health check <org-slug>      # tenant migration preflight, not generic repo verification
npm run mapapp -- migration dry-run <org-slug>
npm run mapapp -- migration validate <org-slug>
npm run seed:runtime
```
