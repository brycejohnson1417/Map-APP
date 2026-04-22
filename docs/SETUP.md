# Setup

## Purpose
This file defines the environment contract for local development, verification, and tenant migration work.

## Bootstrap steps
1. Copy `.env.example` to `.env.local`
2. Fill in the required environment variables
3. Install dependencies with `npm install`
4. Run `npm run verify`

## Environment loading behavior
- `npm run mapapp -- ...` automatically loads `.env.local` first and `.env` second.
- Shell-exported environment variables still take precedence over file-based values.
- Keep tenant and migration secrets in local env files or secret stores, not in committed files.

## Required environment groups

### Platform runtime
- `NEXT_PUBLIC_APP_URL` or `APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `APP_ENCRYPTION_KEY`

### Authentication
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Default local organization bootstrap
- `ORG_SLUG`
- `ORG_NAME`
- `OWNER_CLERK_ID`
- `OWNER_EMAIL`
- `OWNER_NAME`

### Legacy migration source
- `NEON_SOURCE_DATABASE_URL`

### Tenant connector credentials
- `NOTION_TOKEN`
- `NOTION_WORKSPACE_ID`
- `NOTION_DATA_SOURCE_IDS`
- `NOTION_WEBHOOK_VERIFICATION_TOKEN`
- `NABIS_API_KEY`

### Per-organization Google Maps credentials
- `GOOGLE_MAPS_BROWSER_API_KEY`
- `GOOGLE_MAPS_SERVER_API_KEY`

### Optional deployment verification
- `VERCEL_PROJECT_ID`
- `VERCEL_TOKEN`

## Notes
- Do not put tenant secrets into committed files.
- Browser-safe Google Maps keys are still tenant-scoped configuration and should not be shared across organizations.
- Server-side maps keys, Notion tokens, and Nabis credentials are treated as secrets.
