<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Instructions

This repository is the canonical source of truth for the new scalable map product.

## Shared Anti-Slop Protocol

- Follow the cross-repo protocol in `/Users/brycejohnson/Code/AGENTS.md`.
- Repo-accessible canonical mirror: `https://github.com/brycejohnson1417/.github/blob/main/AGENTS.md`.
- This file adds Map-APP-specific product and validation constraints. If there is a conflict, follow the stricter rule.
- Keep protocol changes in the canonical files first; do not fork a Map-APP-only process unless this product has a specific stronger requirement.

## Canonical Context

- Local canonical path: `/Users/brycejohnson/Code/map-app`
- GitHub repo: `https://github.com/brycejohnson1417/Map-APP.git`
- Linear project: `Map-APP`
- Canonical branch: `main`
- Production app: `https://map-app-supabase.vercel.app`
- PICC is the first tenant/customer, not the only intended user.
- The old PICC app can inform UI/features, but this repo owns the rebuilt architecture.

## Project Boundary

- This repo is the newer multi-tenant product/platform. It is not the live PICC production app.
- Do not create or mirror map-app platform work into `brycejohnson1417/Picc-web-app` or the Linear `PICC-Web-app` project.
- Do not use the `picc-push` Vercel project or `piccnewyork.org` as this repo's deployment target.
- If a request, screenshot, issue, or branch could refer to either map-app or PICC-Web-App, verify the UI/repo identity first and ask for clarification if confidence is not high.
- Treat screenshots as project evidence. If the screenshot matches the live PICC production UI instead of this platform UI, stop and clarify before editing this repo.
- Keep public GitHub docs to the skeleton: product identity, setup, validation, public-safe architecture, and execution rules. Keep proprietary tenant workflows, private roadmap details, and customer/business intelligence in Linear or a future authenticated in-app tenant knowledge base.

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

## Non-Test Edit Proof Gate

Before editing meaningful non-test product code, post each of these as a chat-visible artifact. Docs, templates, and CI-only protocol changes can use the normal issue/branch/PR/validation proof without a RED test.

Linked issue. The GitHub issue URL for this slice. If none exists, run `/distill-issue` or open one manually before continuing.

Branch. A git status excerpt confirming you are on a feature branch, not on main. Use `/start-slice --issue <n> --slug <kebab>` to refresh main, branch into a worktree, install, and run preflight in one step.

Preflight. Output of `/preflight` covering gh auth, git remote, branch protection awareness, Vercel project link, lefthook install, Node/pnpm version match against package.json engines, and `.claude/settings.json` hook activation. `/start-slice` runs this for you at the end of bootstrap; otherwise invoke it directly with `node .agents/skills/preflight/scripts/preflight.ts`.

Failing test (RED). For behavior changes, add or identify the smallest relevant failing test before implementation. Use this repo's npm-based commands, not pnpm. If TDD is impractical for the slice, explain why and compensate with `npm run verify`, browser proof, or another concrete check.

Architecture and plan check. One line confirming `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md` were skimmed for conflicts with this slice. If there is a conflict, call it out before editing and update the affected doc in the same PR.

If you cannot produce one of these, stop and ask. Skipping silently is the failure mode this list exists to prevent. See `## Recent Misses` when present in the target repo.
