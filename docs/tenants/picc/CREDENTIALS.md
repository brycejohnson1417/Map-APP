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

### Maps / routing
- Google Maps keys are not active in map-app for PICC right now.
- PICC map-app territory maps use the shared OpenStreetMap/Open Geocoding configuration.
- Legacy PICC-only Google geocoding/routing env names may exist in historical exports, but they are not part of the current map-app credential contract.

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

## Current operating rule
The repo now documents the environment contract, but the real values still need to be supplied by the human operator before autonomous migration work can proceed.
