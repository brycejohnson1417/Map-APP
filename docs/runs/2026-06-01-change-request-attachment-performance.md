# Change-Request Attachment Performance Run

## Summary

Issue #30 asked to evaluate stale generated PR ideas around change-request attachment performance. Current code still had both performance issues: attachment signed URLs were generated with one Supabase Storage request per attachment, and attachment uploads ran serially. This run replaces signed URL N+1 behavior with Supabase `createSignedUrls` batching and uploads accepted attachments with bounded parallelism while preserving per-file warning behavior.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | none |
| Tenant | none |
| Risk level | medium |

## Changed Files

- `lib/application/change-requests/change-request-attachment-helpers.ts`
- `lib/application/change-requests/change-request-service.ts`
- `lib/infrastructure/supabase/change-request-repository.ts`
- `scripts/test-change-request-attachment-performance.mjs`
- `scripts/verify.mjs`
- `package.json`
- `docs/runs/2026-06-01-change-request-attachment-performance.md`

## Commands Run

```bash
gh issue view 30 --json title,body,labels,comments,url,state,createdAt
rg "signedUrl|createSigned|upload\\(|storage|attachment" -n lib app components scripts
npm run check:change-request-attachments
npm run typecheck
npm run lint
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| RED test | pass | `node scripts/test-change-request-attachment-performance.mjs` failed before the helper existed. |
| Attachment helper test | pass | `npm run check:change-request-attachments` passed. |
| Typecheck | pass | `npm run typecheck` passed. |
| Lint | pass | `npm run lint` passed with 0 warnings and 0 errors. |
| Tenant isolation | pass | Covered by `npm run verify`. |
| Self-contained docs | pass | Covered by `npm run verify`. |
| Tenant type docs | pass | Covered by `npm run verify`. |
| Build | pass | Covered by `npm run verify`. |
| Smoke/browser | not run | Submit/upload browser flows were intentionally not exercised because they would create tenant change requests or upload files. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Measure current attachment signing/upload behavior.
- [x] Replace N+1 signed URL generation with a tested batch implementation.
- [x] Implement safe upload parallelism with bounded concurrency and per-file warning handling.
- [x] Verify tenant isolation and change-request attachment logic without mutating tenant data.

## Remaining Risk

- Live upload behavior was not exercised in browser because that would create real change-request rows and storage objects. The deterministic helper coverage verifies batching and concurrency logic without external writes.

## Follow-Up

- Add a fully mocked API integration test for change-request file uploads if the repo adds a server test harness that can replace Supabase Storage with an in-memory adapter.
