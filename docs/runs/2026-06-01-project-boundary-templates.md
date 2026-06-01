# Project Boundary Template Run Report

## Summary

Updated the Map-APP issue and PR templates so new work must explicitly confirm whether it belongs to the map-app multi-tenant platform, PICC tenant context inside map-app, or an explicitly described cross-project case. The template wording calls out the separate PICC-Web-App production repo and the `map-app-supabase` deployment target without adding new approval gates.

## Scope

| Field | Value |
|---|---|
| Lane | docs-ops |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Changed Files

- `.github/ISSUE_TEMPLATE/bug.yml`
- `.github/ISSUE_TEMPLATE/feature.yml`
- `.github/ISSUE_TEMPLATE/task.yml`
- `.github/pull_request_template.md`
- `docs/runs/2026-06-01-project-boundary-templates.md`

## Commands Run

```bash
ruby -e 'require "yaml"; %w[.github/ISSUE_TEMPLATE/bug.yml .github/ISSUE_TEMPLATE/feature.yml .github/ISSUE_TEMPLATE/task.yml].each { |path| YAML.load_file(path); puts path }'
```

## Results

| Check | Result | Notes |
|---|---|---|
| Issue template YAML parse | pass | Ruby YAML parsed all three issue forms. |
| Typecheck | not needed | Template/docs-only change. |
| Lint | not needed | Template/docs-only change. |
| Build | not needed | Template/docs-only change. |
| Browser | not needed | No browser-facing runtime behavior changed. |

## Tenant Behavior Preserved

- FraterniTees: no runtime behavior changed.
- PICC: no PICC-Web-App files or trackers changed; PICC is only referenced for Map-APP tenant-boundary clarification.

## Acceptance Criteria

- [x] Bug issue template includes project-boundary confirmation.
- [x] Feature issue template includes project-boundary confirmation.
- [x] Task issue template includes project-boundary confirmation.
- [x] PR template includes project-boundary confirmation.
- [x] Guidance distinguishes PICC tenant context from live PICC-Web-App work.

## Remaining Risk

- GitHub rendering cannot be fully previewed from the CLI, so validation uses YAML parsing and direct template inspection.

## Follow-Up

- Coordinate with issue #121 if broader project-boundary docs need further cleanup.
