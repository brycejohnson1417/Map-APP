# FraterniTees Instagram UX Fix Run

Date: 2026-04-28

## Trigger

User reported that FraterniTees had no visible Instagram login, Sales & Social loaded slowly, watched-account import did not feel meaningful, and mapping/config controls were not sufficiently actionable from the UI.

## Changes

- Added tenant-facing Meta/Instagram OAuth start and callback routes.
- Added OAuth URL/token exchange helpers for Instagram Login and Facebook Login for Business.
- Added visible Instagram and Meta Business Suite controls to the FraterniTees Integrations page.
- Added direct `Connect Instagram` actions to the Social dashboard/accounts/import surfaces.
- Preserved Meta app credentials and access tokens through the encrypted integration vault.
- Made watched-account creation update the UI without a full page reload and create a persisted alert/activity trail.
- Added editable non-destructive social-account mapping fields for school/org key, customer/account ID, and contact ID.
- Renamed the Screenprinting admin entry point to `Settings & mappings`.
- Reduced the initial Screenprinting dashboard metric query by excluding raw Printavo `source_payload` from all-order metric loads.

## Verification

- `npm run typecheck` passed.
- Local browser smoke against `http://localhost:3000/screenprinting?org=fraternitees&module=social&social=accounts`:
  - Social accounts view rendered.
  - `Connect Instagram` was visible.
  - Existing account detail exposed non-destructive mapping controls.
  - `Settings & mappings` opened tenant configuration.
- Local browser smoke against `http://localhost:3000/integrations?org=fraternitees`:
  - Instagram and Meta Business Suite section rendered.
  - `Connect Instagram` and advanced Meta app settings were visible.
- Local OAuth start route without credentials redirected to Integrations with a clear setup error.
- Supabase remote migration list confirmed `20260428100000_meta_instagram_provider` is applied.

## Notes

- No production/provider write-back was enabled.
- Publishing, comment replies, and message replies remain gated by owned-account records, stored token, requested Meta scopes, and tenant feature flags.
- Temporary browser-test watchlist data was removed after verification.
