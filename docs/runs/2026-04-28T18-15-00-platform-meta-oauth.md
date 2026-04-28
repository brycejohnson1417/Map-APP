# Platform Meta OAuth Run

## Scope

Implement option 1 for Meta/Instagram: one platform-owned Meta app in backend environment variables, with tenant authorization through the frontend and tenant access tokens stored as encrypted integration secrets.

## Changes

- Added a global Meta OAuth callback route at `/api/runtime/connectors/meta/oauth/callback`.
- Updated the tenant start route to use the global callback URL and platform-owned Meta app credentials.
- Removed tenant-facing Meta app ID, app secret, manual token, Graph version, and scope editing from the FraterniTees integration UI.
- Kept tenant-facing choices for login path and optional Business portfolio ID.
- Stopped storing the platform app secret as a tenant integration secret; OAuth now stores only tenant authorization tokens.
- Updated tenant connector manifests and docs to explain the platform-owned app model.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run verify` passed.
- `SMOKE_BASE_URL=http://localhost:3000 NEXT_PUBLIC_DEFAULT_ORG_SLUG=fraternitees npm run smoke:runtime` passed.
- Local browser check passed for `/integrations?org=fraternitees`:
  - Connect Instagram visible.
  - Tenant authorization settings visible.
  - Global callback URL visible.
  - Tenant-facing Meta app ID/secret fields not visible.
  - OAuth start safely redirects to an explicit platform setup error when backend Meta app credentials are absent.
  - Global callback safely redirects when signed tenant state is missing.
