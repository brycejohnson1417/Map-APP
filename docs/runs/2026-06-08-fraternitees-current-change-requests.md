# FraterniTees Current Change Requests Run

## Summary

Implemented GitHub issue [#268](https://github.com/brycejohnson1417/Map-APP/issues/268), covering the current queued FraterniTees in-app change requests.

## Scope

- Added app-wide `noindex, nofollow` metadata for private tenant surfaces.
- Added viewport and control font sizing to prevent mobile browser focus zoom on form fields.
- Added a FraterniTees Accounts `Calendar Year` tab with current-year customer activity, fraternity/chapter grouping, close-status signal, and sort controls.
- Added tenant-scoped manual account grade overrides from the Accounts UI.
- Added an authenticated manager-only account grade override API route that writes only `account.custom_fields` and records an audit event.

## Out Of Scope

- No Printavo write-back.
- No production change-request status mutation.
- No PICC-Web-App changes.
- No schema migration.

## Validation

- `npm run check:fraternitees-change-requests` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run verify` passed, including build.
- Browser check against `http://127.0.0.1:3018/accounts?org=fraternitees&view=calendar_year` confirmed:
  - calendar-year tab rendered with real FraterniTees account links,
  - `robots` metadata was `noindex, nofollow`,
  - viewport was `width=device-width, initial-scale=1, maximum-scale=1`,
  - form-control computed font size was `16px`,
  - no framework overlay,
  - no console errors.
- Browser check against `http://127.0.0.1:3018/accounts?org=fraternitees` confirmed:
  - scoring tab rendered,
  - manual grade controls were present for listed accounts,
  - computed-state controls were disabled until changed,
  - no console errors.
- Mobile browser checks at `390x844` confirmed no horizontal overflow on calendar-year and scoring views.
- Non-mutating API permission check confirmed unauthenticated grade writes return `401`.

## Notes

The local verification worktree required copying the existing untracked `.env.local` from the canonical checkout for browser runtime only. That file was not committed.

Browser text-entry was blocked by the Browser plugin virtual clipboard, so authenticated typing was not used for QA. The rendered Browser checks were still completed, and the write route was verified with a non-mutating unauthenticated request.
