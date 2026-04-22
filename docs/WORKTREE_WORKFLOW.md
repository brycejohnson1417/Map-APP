# Worktree Workflow

## Purpose
This repo must stay operationally separate from the current production Neon app while Map App Harness reaches functional parity.

The production Neon app is still the working business system. The Supabase app is the replacement/platform build. Do not mix code, migrations, deploy targets, or credentials between them.

## Directory Boundaries

### Production Neon App
- Path: `/Users/brycejohnson/Documents/New project/Picc-web-app`
- Purpose: current working PICC production app
- Default mode: triage, measurement, and surgical fixes only
- GitHub: `https://github.com/bryce-picc/Picc-web-app.git`

Rules:
- Do not refactor broadly in this repo while the Supabase app is being built.
- Do not change Notion workspace structure or Neon schema without explicit approval.
- Keep fixes small, measured, and individually reversible.
- Use this repo only when the user explicitly asks for current production app work.

### Supabase Main Worktree
- Path: `/Users/brycejohnson/Documents/MAP-APP-SUPABASE/Map-APP`
- Branch: `main`
- Purpose: stable deployed Supabase checkpoint
- GitHub: `https://github.com/brycejohnson1417/Map-APP.git`
- Vercel alias: `https://map-app-supabase.vercel.app`

Rules:
- Keep `main` deployable.
- Do not use `main` for long-running feature work.
- Only merge tested, reviewed checkpoints into `main`.

### Supabase Runtime-Parity Worktree
- Path: `/Users/brycejohnson/Documents/MAP-APP-SUPABASE/worktrees/runtime-parity`
- Branch: `codex/runtime-parity`
- Purpose: active parity work against the old production app

Rules:
- Use this worktree for ongoing Supabase app implementation.
- This is the safe place for larger feature slices, refactors, connector work, and parity gaps.
- Keep commits focused enough that they can be reviewed or reverted.
- Before merging back to `main`, run the verification gates below.

## Recommended Agent Starting Prompt
Use this when opening a fresh Codex/Claude/Poke thread:

```text
Work only in /Users/brycejohnson/Documents/MAP-APP-SUPABASE/worktrees/runtime-parity.
This is the Supabase Map App Harness runtime-parity worktree on branch codex/runtime-parity.
Do not touch /Users/brycejohnson/Documents/New project/Picc-web-app unless I explicitly ask for production Neon app triage.
Read docs/WORKTREE_WORKFLOW.md, docs/STRATEGY.md, docs/ARCHITECTURE.md, docs/IMPLEMENTATION_PLAN.md, docs/TODO.md, and docs/tenants/picc/REQUIREMENTS.md before implementing.
Treat /Users/brycejohnson/Documents/MAP-APP-SUPABASE/Map-APP main as the stable deployed checkpoint.
```

## Common Commands

From the active Supabase parity worktree:

```bash
cd "/Users/brycejohnson/Documents/MAP-APP-SUPABASE/worktrees/runtime-parity"
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run dev
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run lint
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mapapp -- migration validate picc
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run mapapp -- migration dry-run picc
PATH="/opt/homebrew/opt/node@22/bin:$PATH" APP_URL=https://map-app-supabase.vercel.app npm run mapapp -- health check picc
```

Create additional Supabase worktrees from stable `main` when parallel feature branches are needed:

```bash
cd "/Users/brycejohnson/Documents/MAP-APP-SUPABASE/Map-APP"
git worktree add -b codex/<feature-name> ../worktrees/<feature-name> main
cd "../worktrees/<feature-name>"
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm ci
cp -p ../../Map-APP/.env.local .env.local
cp -R ../../Map-APP/.vercel .vercel
```

## Merge Gate Back To Main
Before merging a parity branch into `main`, verify:

- `npm run lint` passes.
- Vercel preview or production build passes.
- `npm run mapapp -- migration validate picc` passes.
- `npm run mapapp -- migration dry-run picc` passes.
- Relevant runtime smoke checks pass.
- `docs/tenants/picc/MIGRATION_LOG.md` is updated for migration-impacting changes.
- Any production Neon app comparison is documented as evidence, not copied code.

## Current Functional Parity Focus
The runtime-parity branch should prioritize:

- account detail page parity
- actual Google Maps territory rendering
- territory boundary create/edit/move/add-point workflows
- rep-home marker layer with per-tenant Google Maps credentials
- Notion delta sync and dirty-page refresh
- Nabis order ingestion refresh and account matching review queue
- filter parity for referral source, sample delivery, vendor days, overdue, and account status
- route planning and account visit workflows
- role-aware tenant admin for connectors and field mappings

## Node Version
Use Node 22 for this repo. The local default Node 25 has caused TypeScript and Next build commands to hang in this environment.

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" node -v
```
