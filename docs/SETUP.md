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
Provider credentials must be tenant-scoped. Use the organization slug prefix:

- `<ORG>_NOTION_TOKEN`
- `<ORG>_NOTION_WORKSPACE_ID`
- `<ORG>_NOTION_DATA_SOURCE_IDS`
- `<ORG>_NOTION_COMPANIES_DATA_SOURCE_ID`
- `<ORG>_NOTION_CONTACTS_DATA_SOURCE_ID`
- `<ORG>_NOTION_WEBHOOK_VERIFICATION_TOKEN`
- `<ORG>_NABIS_API_BASE_URL`
- `<ORG>_NABIS_ORDERS_PATH`
- `<ORG>_NABIS_API_KEY`
- `<ORG>_GOOGLE_MAPS_BROWSER_API_KEY`
- `<ORG>_GOOGLE_MAPS_SERVER_API_KEY`

Examples:

- `PICC_NABIS_API_KEY`
- `PICC_NOTION_TOKEN`
- `PICC_GOOGLE_MAPS_SERVER_API_KEY`
- `FRATERNITEES_GOOGLE_MAPS_BROWSER_API_KEY`

`<ORG>_NOTION_DATA_SOURCE_IDS` remains supported as a bootstrap list. For live sync, prefer the explicit
company/contact variables so PICC's Dispensary Master List CRM and Contacts Database cannot be
accidentally swapped.

### Optional deployment verification
- `VERCEL_PROJECT_ID`
- `VERCEL_TOKEN`

## Notes
- Do not put tenant secrets into committed files.
- Browser-safe Google Maps keys are still tenant-scoped configuration and should not be shared across organizations.
- Server-side maps keys, Notion tokens, and Nabis credentials are treated as secrets.
- Generic paid-provider env fallbacks are no longer allowed for tenant runtime paths. If a tenant needs a provider, use an organization-scoped integration install or an organization-scoped env key.
- `NEXT_PUBLIC_DEFAULT_ORG_SLUG` / `ORG_SLUG` can still define a local default org, but the platform fallback is now `starter` rather than implicitly pointing at PICC.

## Live Sync Command

Use the CLI when validating a tenant sync locally or from an operator shell:

```bash
npm run mapapp -- sync live picc --dry-run --limit=25
npm run mapapp -- sync live picc
```

The command reads Notion companies/contacts and Nabis orders, then writes normalized rows into
Supabase `account`, `contact`, `account_identity`, `order_record`, `sync_cursor`, `sync_job`, and
`audit_event`. It does not write back to Notion.

For PICC NY, `NABIS_ORDERS_PATH` should point at the NY orders endpoint: `/ny/order`.
