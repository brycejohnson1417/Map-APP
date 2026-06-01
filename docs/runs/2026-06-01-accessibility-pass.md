# Accessibility Pass For Closed Generated PR Ideas

## Summary

Issue #29 asked for a first-party review of stale accessibility ideas from closed generated PRs. Current `main` already had several labels in place, but still had active collapsible and icon-only controls without complete accessibility metadata. This run adds expanded state to existing collapsible controls and labels icon-only dismiss/remove controls without changing visual layout or backend behavior.

## Scope

| Field | Value |
|---|---|
| Lane | core |
| Tenant type | none |
| Tenant | none |
| Risk level | low |

## Changed Files

- `components/accounts/ppp-savings-panel.tsx`
- `components/change-requests/change-request-list.tsx`
- `components/territory/territory-workspace.tsx`
- `docs/runs/2026-06-01-accessibility-pass.md`

## Commands Run

```bash
gh issue view 29 --json title,body,labels,comments,url,state,createdAt
rg "<button|aria-expanded|aria-label|Chevron|Filter|X className|toggle" components app -n
npm run typecheck
npm run lint
npm run verify
PORT=3001 npm run dev
node <<'NODE'
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/territory?org=fraternitees', { waitUntil: 'networkidle' });
  const filters = page.getByRole('button', { name: /^Filters$/ }).first();
  const before = await filters.getAttribute('aria-expanded');
  await filters.click();
  const after = await filters.getAttribute('aria-expanded');
  await page.locator('#territory-filter-panel').waitFor({ state: 'visible' });
  if (before !== 'false' || after !== 'true') throw new Error('Filters aria-expanded did not toggle.');
  await browser.close();
})();
NODE
```

## Results

| Check | Result | Notes |
|---|---|---|
| Accessibility source audit | pass | Checked current buttons/collapsibles against the stale generated PR ideas. |
| Typecheck | pass | `npm run typecheck` passed. |
| Lint | pass | `npm run lint` passed with 0 warnings and 0 errors. |
| Tenant isolation | pass | Covered by `npm run verify`. |
| Self-contained docs | pass | Covered by `npm run verify`. |
| Tenant type docs | pass | Covered by `npm run verify`. |
| Build | pass | Covered by `npm run verify`. |
| Smoke/browser | pass | Territory filters remained usable and toggled `aria-expanded` from `false` to `true` in a live browser. |

## Tenant Behavior Preserved

- FraterniTees: no provider API calls, outbound emails, Printavo writes, Nabis writes, or tenant data mutations were performed.
- PICC: no PICC-Web-App files, env vars, provider systems, or production data were touched.

## Acceptance Criteria

- [x] Audit current UI for icon-only buttons and collapsible controls.
- [x] Add missing `aria-label` / `aria-expanded` only where still applicable.
- [x] Verify with browser interaction and lint/build.

## Remaining Risk

- This pass covers current visible controls found in the stale PR audit area. It is not a full WCAG audit of the entire application.

## Follow-Up

- If deeper accessibility certification is needed, add an axe-based browser audit issue with scoped remediation criteria.
