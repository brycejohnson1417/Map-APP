# Build Localstorage File Warning

## Summary

Investigated and fixed the repeated production build warning `--localstorage-file was provided without a valid path`. The warning came from importing the browser standalone PDFKit bundle in server-only PDF renderers; under Node 25 that bundle probes `localStorage` during Next page-data collection. The PDF renderers now import the Node PDFKit entrypoint and the custom standalone type shim was removed.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Changed Files

- `lib/application/runtime/mock-order-proposal-pdf.ts`
- `lib/application/runtime/ppp-savings-pdf.ts`
- `lib/types/pdfkit-standalone.d.ts`
- `docs/runs/2026-06-01-localstorage-file-warning.md`

## Commands Run

```bash
npm run build
node --trace-warnings node_modules/.bin/next build
node --help | rg -n "localstorage|localStorage|webstorage"
npm run verify
```

## Results

| Check | Result | Notes |
|---|---|---|
| Reproduce warning | pass | `npm run build` reproduced the warning during page-data collection. |
| Trace source | pass | `node --trace-warnings node_modules/.bin/next build` pointed at `.next/server/chunks/node_modules_pdfkit_js_pdfkit_standalone...js`. |
| Build after fix | pass | `node --trace-warnings node_modules/.bin/next build` passed with no `--localstorage-file` warnings. |
| Typecheck | pass | `npm run verify` passed typecheck. |
| Lint | pass | `npm run verify` passed lint. |

## Tenant Behavior Preserved

- FraterniTees: no Printavo calls, email sends, or provider writes were run.
- PICC: no Nabis calls, Notion calls, or provider writes were run.

## Acceptance Criteria

- [x] Identify where the flag is coming from.
- [x] Remove or correctly configure it if repo-controlled.
- [x] Document the investigation result.
- [x] `npm run verify` passes.

## Remaining Risk

- PDF visual layout was not changed intentionally; this only switches PDFKit from the browser standalone bundle to the package Node entrypoint.

## Follow-Up

- None.
