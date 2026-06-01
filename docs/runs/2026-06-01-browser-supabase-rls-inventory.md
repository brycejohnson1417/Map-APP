# Browser Supabase RLS Inventory

Date: 2026-06-01

Issue: https://github.com/brycejohnson1417/Map-APP/issues/38

Branch: `codex/38-rls-browser-access-inventory`

## Scope

- Inventory browser Supabase usage.
- Record the direct-browser auth and membership model.
- Add verification that blocks direct browser Supabase access until explicit tenant RLS policies and cross-tenant tests exist.

## Out Of Scope

- Supabase schema migrations.
- New RLS policy rollout.
- Production schema/auth changes.
- Secret rotation or provider writes.

## Inventory

- `lib/supabase/client.ts` remains the only browser Supabase client helper.
- Current committed app code does not import `@/lib/supabase/client` from `app/`, `components/`, or runtime modules.
- Current committed browser-reachable modules do not import `@supabase/supabase-js` directly.
- Server-side Supabase access remains through `lib/supabase/admin.ts` and service/repository/API boundaries.

## Policy Decision

Direct browser tenant-table access remains blocked. Before a tenant table is exposed to the browser, the same PR must include:

- explicit table policies for the exposed operations
- a documented JWT claim shape mapping the authenticated user to `public.organization_member.clerk_user_id`
- membership checks on `public.organization_member.organization_id`
- role checks for tenant-mutating browser writes
- browser/client verification that another tenant's rows cannot be read or changed

## Verification Added

- `scripts/lib/browser-supabase-boundary.mjs` implements the boundary scanner.
- `scripts/check-browser-supabase-boundary.mjs` scans `app/`, `components/`, and `lib/`.
- `scripts/test-browser-supabase-boundary.mjs` covers allowed helper usage plus import, call, and SDK-import violations.
- `npm run check:browser-supabase-boundary:self-test` and `npm run check:browser-supabase-boundary` are part of `npm run verify`.

## Validation

- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" node scripts/test-browser-supabase-boundary.mjs`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:browser-supabase-boundary:self-test`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run check:browser-supabase-boundary`
- `PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run verify`
