# Change System

## Purpose

The change system moves tenant requests out of ad hoc founder support and into a governed product surface.

The current goal is simple:

- capture tenant intent in the app
- preserve the context needed to implement it
- classify the work into a reusable bucket
- create a queue that humans and future automation can attack cleanly

## Current shipped path

### Surface
- `/change-requests?org=<slug>`

### Persistence
- `public.change_request`
- `public.change_request_attachment`
- Supabase Storage bucket: `change-request-attachments`

### API
- `GET /api/runtime/organizations/[slug]/change-requests`
- `POST /api/runtime/organizations/[slug]/change-requests`

### Current request fields
- title
- current URL
- surface
- problem
- requested outcome
- business context
- acceptance criteria
- optional classification override
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

## What this already enables

- tenant change capture from inside the workspace
- screenshot/attachment-backed requests
- tenant-scoped queue review
- a stable handoff artifact for future AI/policy systems

## What is not done yet

- preview environments
- policy gates
- auto-apply for safe config changes
- maintainer scheduling and assignment
- request conversation threads
- escalation SLAs

## Next work

- add preview + policy fields to the data model
- add request status transitions beyond the current queue states
- attach classifier output to workspace/package/primitive candidates
- route safe config changes into automated diffs
