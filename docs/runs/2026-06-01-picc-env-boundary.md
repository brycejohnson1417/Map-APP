# PICC Env Boundary Run Report

## Summary

Clarified that PICC-prefixed variables in Map-APP are tenant connector examples only, not PICC-Web-App production env names. The top-level `.env.example` now points detailed PICC guidance to tenant docs, `docs/SETUP.md` documents the boundary, and `docs/tenants/picc/CREDENTIALS.md` now lists the prefixed Map-APP contract instead of unprefixed legacy names under the new platform contract.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | Cannabis Wholesale |
| Tenant | PICC |
| Risk level | low |

## Changed Files

- `.env.example`
- `docs/SETUP.md`
- `docs/tenants/picc/CREDENTIALS.md`
- `docs/runs/2026-06-01-picc-env-boundary.md`

## Commands Run

```bash
npm run check:self-contained-requirements
git diff --check
```

## Results

| Check | Result | Notes |
|---|---|---|
| Self-contained docs | pass | `npm run check:self-contained-requirements` passed. |
| Whitespace diff check | pass | `git diff --check` passed. |
| Typecheck | not needed | Docs/env example only. |
| Lint | not needed | Docs/env example only. |
| Browser | not needed | No frontend behavior changed. |

## Tenant Behavior Preserved

- FraterniTees: tenant-scoped env examples remain labeled as tenant connector examples.
- PICC: no runtime behavior or credentials changed; docs now distinguish Map-APP tenant connector variables from PICC-Web-App production env.

## Acceptance Criteria

- [x] `.env.example` states PICC-prefixed variables are Map-APP tenant connector examples only.
- [x] `.env.example` states not to copy PICC-Web-App production env values.
- [x] Detailed PICC setup guidance is in `docs/tenants/picc/`.
- [x] FraterniTees examples remain tenant-scoped.

## Remaining Risk

- Existing historical migration logs still mention legacy unprefixed names because they document the prior system; this change does not rewrite historical records.

## Follow-Up

- Coordinate with issue #121 if broader project-boundary docs need more cleanup.
