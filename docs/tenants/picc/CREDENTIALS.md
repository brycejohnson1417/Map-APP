# PICC Credentials

## Purpose
This file lists which credentials the migration and runtime need, where they are expected to come from, and how a fresh thread should reason about them.

Do not put raw secrets in this file.

## Confirmed legacy credential/env names

### Database
- `DATABASE_URL` — legacy runtime database
- production local env points this at Neon

### Notion
- `NOTION_API_KEY`
- `NOTION_MASTER_LIST_DATABASE_ID`
- `NOTION_CONTACTS_DATABASE_ID`
- `NOTION_MEETING_NOTES_DATABASE_ID`
- `NOTION_VENDOR_DAY_DATABASE_ID`
- `NOTION_VENDOR_DAY_EVENTS_DATABASE_ID`

### Google Maps / routing
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — browser map rendering
- `GOOGLE_MAPS_SERVER_API_KEY` — server-side maps
- `GOOGLE_GEOCODING_API_KEY` — geocoding
- `GOOGLE_ROUTES_API_KEY` — routing

### Nabis
- `NABIS_API_KEY`
- `NABIS_API_BASE_URL`

### Tenant/runtime scoping
- `TERRITORY_ORG_ID`

## New platform credential contract
A fresh migration thread should expect these through `.env.local` based on:
- `.env.example`
- `docs/SETUP.md`

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `APP_ENCRYPTION_KEY`
- `NEON_SOURCE_DATABASE_URL`
- `NOTION_TOKEN`
- `NABIS_API_KEY`
- `GOOGLE_MAPS_BROWSER_API_KEY`
- `GOOGLE_MAPS_SERVER_API_KEY`

## Current operating rule
The repo now documents the environment contract, but the real values still need to be supplied by the human operator before autonomous migration work can proceed.
