# Change System

## Purpose

The change system moves tenant requests out of ad hoc founder support and into a governed product surface.

The current goal is simple:

- let nontechnical tenants comment directly on the screen they mean
- preserve the screenshot and marked context needed to implement it
- normalize that request into structured fields internally
- create a queue that humans and future automation can attack cleanly

## Current shipped path

### Surface
- `/change-requests?org=<slug>`
- header-level `Comment a request` launcher on authenticated tenant pages
- workspace compiler normalization keeps the change-request package, navigation item, and enabled flag present for every tenant workspace, even if a future template forgets to declare them

### Persistence
- `public.change_request`
- `public.change_request_attachment`
- Supabase Storage bucket: `change-request-attachments`

### API
- `GET /api/runtime/organizations/[slug]/change-requests`
- `POST /api/runtime/organizations/[slug]/change-requests`
- `PATCH /api/runtime/organizations/[slug]/change-requests/[requestId]`
- `DELETE /api/runtime/organizations/[slug]/change-requests/[requestId]`

### Tenant-facing capture flow
- tenant opens `Comment a request`
- page enters a full-viewport locked comment mode rendered above the runtime, so normal buttons and links cannot be clicked accidentally
- tenant clicks directly on one or more points on the live page
- tenant adds a plain-language comment for each marked point
- comment-mode chrome stays compact so most of the underlying page remains visible while annotating
- on mobile, comment mode keeps the page visible and pushes detail capture into the later queue-edit flow instead of forcing a large form over the screen
- if screenshot capture fails in a browser-specific rendering edge case, the request still submits with the notes file instead of blocking the queue
- if later screenshot annotation generation fails after capture, the request still submits and warns that screenshots were skipped
- if browser attachment upload fails during submit, the request retries without attachments instead of losing the queue item
- server-side attachment persistence is now best-effort: queue creation succeeds first, attachment upload warnings are returned separately
- harness submits one request per completed comment with an annotated screenshot when capture succeeds, or notes-only metadata when screenshot capture falls back

### Normalized internal fields
The UI no longer asks tenants to fill these in directly, but the harness still stores:

- title
- current URL
- surface
- problem
- requested outcome
- business context
- acceptance criteria
- optional attachments

## Current classification model

- `config`
- `package`
- `primitive`
- `core`

The current classifier is heuristic. It uses request text plus the workspace default. It is intentionally simple for v1.

Current routing intent:
- scoring, thresholds, sort, trend, section, and copy requests bias toward `config`
- reusable module or document requests bias toward `package`
- reusable platform building blocks bias toward `primitive`
- auth, schema, runtime, deployment, or cross-tenant behavior biases toward `core`

These labels are internal harness concepts. They should not be treated as required tenant-facing vocabulary.

## What this already enables

- tenant change capture from inside the workspace
- one comment -> one queue item tied to an exact screen area
- screenshot/attachment-backed requests
- tenant-scoped queue review
- tenant-visible request editing, file upload, and delete actions without exposing internal classifier jargon
- a stable handoff artifact for future AI/policy systems

## What is not done yet

- preview environments
- policy gates
- auto-apply for safe config changes
- maintainer scheduling and assignment
- request conversation threads
- escalation SLAs
- stronger replay/remap of comment anchors after layout changes

## Next work

- add preview + policy fields to the data model
- add request status transitions beyond the current queue states
- attach classifier output to workspace/package/primitive candidates
- route safe config changes into automated diffs
- add request conversations and follow-up questions without breaking the screenshot-first workflow
