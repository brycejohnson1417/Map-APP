<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Instructions

This repository is the canonical source of truth for the new scalable map product.

## Canonical Context

- Local canonical path: `/Users/brycejohnson/Code/map-app`
- GitHub repo: `https://github.com/brycejohnson1417/Map-APP.git`
- Canonical branch: `main`
- PICC is the first tenant/customer, not the only intended user.
- The old PICC app can inform UI/features, but this repo owns the rebuilt architecture.

## Operating Mode

- Prefer scalable, adapter-based product work over patching legacy behavior directly.
- Keep CRM, ordering-platform, Notion, GHL, and Nabis integrations behind explicit interfaces.
- Use `data-tools` for shared sync jobs, bulk cleanup, and data-contract work that is not runtime UI code.
- Treat tenant-specific PICC logic as tenant configuration or a bounded adapter unless there is a clear product reason otherwise.
- Do not point this app at the `picc-push` Vercel project.

## Definition Of Done

- State the task definition of done before implementation.
- Run `npm run verify` before claiming completion.
- If browser behavior changed, start the app and verify the relevant route.
- If verification cannot run, explain the blocker and what remains unverified.
- Final reports must list changed files, commands run, what passed, what failed, and remaining risk.
