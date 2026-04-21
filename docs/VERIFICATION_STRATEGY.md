# Verification Strategy

## Goal
The repo must support self-verification. An agent or developer should be able to prove the current slice is correct without relying on memory, hope, or manual guesswork.

The principle is simple: each layer gets the cheapest verification that can catch the likely failure mode.

## Verification Layers

### 1. Static correctness
Purpose:
- catch type drift
- catch bad imports
- catch obvious lint regressions

Commands:
- `npm run typecheck`
- `npm run lint`

Current lint implementation:
- `oxlint` for fast, reliable static checks on app code and scripts
- `tsc` remains the type-safety gate

### 2. Build correctness
Purpose:
- prove the app still compiles in production mode
- catch route/render/build-time mistakes

Command:
- `npm run build`

### 3. Runtime smoke verification
Purpose:
- prove the built app exposes the critical routes and pages
- catch missing env assumptions and broken route wiring

Command:
- `SMOKE_BASE_URL=http://localhost:3000 npm run smoke:runtime`

Current smoke checks:
- `/`
- `/architecture`
- `/territory`
- `/api/runtime/health`
- `/runtime/:slug` when `NEXT_PUBLIC_DEFAULT_ORG_SLUG` or `ORG_SLUG` is set
- `/api/runtime/organizations/:slug`
- `/api/runtime/organizations/:slug/sync-jobs`

### 4. Service and adapter tests
Purpose:
- verify domain and orchestration logic without depending on the browser
- keep sync and matching logic deterministic

Required over time:
- sync payload validation
- job dedupe behavior
- identity matching
- aggregate calculations
- permission decisions

Current status:
- not yet implemented as a formal test suite
- every new service with branching logic should add focused tests before the platform reaches territory/account parity

### 5. Browser verification
Purpose:
- prove the user-facing flow actually works, not just the HTTP routes
- especially important for map, territory, and shared-state flows

Target tool:
- Playwright

Priority flows to automate:
1. open home and architecture pages
2. open runtime org page
3. queue a Notion dirty-page sync manually
4. open territory page
5. verify shared territory layer visibility once the territory runtime exists

Current repo command:
- `SMOKE_BASE_URL=http://localhost:3000 npm run verify:browser`

## Default Verification Loop
For normal feature work:

1. implement the change
2. run `npm run verify`
3. if the feature changes user flow, run browser/smoke verification
4. if the feature changes sync or matching behavior, add or update tests
5. document any intentional gaps before shipping

## `npm run verify`
This command is the repo-standard baseline loop.

It runs:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run smoke:runtime` only when `SMOKE_BASE_URL` is set
- `npm run verify:browser` only when both `SMOKE_BASE_URL` and `PLAYWRIGHT_VERIFY=1` are set

For the full autonomous loop:
- `npm run verify:full`
- this runs the baseline verification and then invokes a fresh Codex review via `npm run review:adversarial`

This makes the agent loop cheap by default and richer when a server is available.

## Verification by Work Type

### Docs-only changes
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Route or service changes
- `npm run verify`
- smoke affected routes if possible

### Sync logic changes
- `npm run verify`
- add/update deterministic tests
- replay representative payloads

### UI flow changes
- `npm run verify`
- browser or smoke verification of the changed route

## Definition of Done
A change is not done just because it compiles.

A change is done when:
1. the spec and implementation still agree,
2. the baseline verification loop passes,
3. the changed behavior has a direct verification path,
4. known gaps are explicit, not hidden.
5. tenant migration artifacts do not pretend facts that are still unknown.

## Adversarial Review
Fresh-context review is required for meaningful slices.

The review agent should check:
- spec drift
- architecture drift
- weak verification coverage
- accidental tenant-specific assumptions leaking into the core
- missing tenant isolation or security decisions

If the reviewer finds a real gap, the implementation loops until the gap is either fixed or explicitly accepted in docs.

## Long-Running Agent Loop
This repo is expected to support long-running autonomous work. The verification system therefore needs to be:
- cheap enough to run frequently
- explicit enough that a fresh agent can invoke it
- layered enough that the agent can choose the right proof for the right change

The canonical process for an agent is:
1. read the current spec and todo list
2. implement one meaningful slice
3. run `npm run verify`
4. run smoke checks if a server is available
5. request adversarial review from a fresh context
6. loop until the reviewer no longer finds meaningful gaps
