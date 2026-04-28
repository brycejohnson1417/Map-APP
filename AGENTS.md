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
- Self-contained product requirements are mandatory. Product docs must be complete enough for a fresh AI agent or human to build correctly without chat history, memory, screenshots, transcripts, videos, or private context.
- Do not leave lazy references to outside context in requirements. Convert inspiration from conversations, demos, attachments, or screenshots into explicit workflows, data needs, UI behavior, configuration rules, security boundaries, and acceptance criteria.
- Start product work with `docs/HANDOFF.md`, `docs/GLOSSARY.md`, `docs/AUTONOMOUS_PRODUCT_BUILD.md`, `docs/WORK_REGISTRY.md`, `docs/WORK_REGISTRY.json`, `docs/DEFINITION_OF_DONE.md`, `docs/ARCHITECTURE_RUNWAY.md`, `docs/DATA_MODEL.md`, `docs/API_CONTRACTS.md`, and the relevant tenant type or tenant-specific docs.
- Treat `docs/WORK_REGISTRY.json` as the autonomous execution queue. Execute `ready` items in priority order, promote dependency-unblocked items to `ready`, and update the registry after meaningful slices.
- If a documented future foundation item becomes the best prerequisite for a requested feature, implement the smallest useful version of that foundation first, document why, and continue unless an allowed stop condition applies.
- Do not treat future proposal docs as implementation approval unless the work registry marks the item `ready` or the promoted slice is the smallest necessary prerequisite for a current item.
- For meaningful implementation slices, add a run report under `docs/runs/` using `docs/runs/RUN_REPORT_TEMPLATE.md`.

## Definition Of Done

- Use `docs/DEFINITION_OF_DONE.md` as the task definition of done before implementation.
- Run `npm run verify` before claiming completion.
- Keep `docs/SELF_CONTAINED_REQUIREMENTS.md` satisfied and update product docs when requirements change.
- If browser behavior changed, start the app and verify the relevant route.
- If verification cannot run, explain the blocker and what remains unverified.
- Final reports must list changed files, commands run, what passed, what failed, and remaining risk.
