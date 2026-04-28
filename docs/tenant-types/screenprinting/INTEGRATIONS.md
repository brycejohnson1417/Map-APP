# Screenprinting Integrations

## Tenant type scope

Screenprinting integrations should make the workspace useful without giving external systems unsafe write access by default.

Tenant-specific integration docs should record credentials, connection status, field mappings, and known API limitations for one tenant only.

## Printavo

MVP mode: read-only.

Pull:

- customers
- contacts
- quotes/orders/invoices where available
- statuses
- tags
- payment state
- production and customer due dates
- totals
- line items
- source IDs and deep links

Do not push back to Printavo in the MVP. Future write-back requires:

- explicit tenant enablement
- role permission
- visible preview
- audit event
- retry/error handling
- rollback or manual correction plan

Tenant-specific configuration:

- which statuses map to quoted, production, completed, cancelled, paid, unpaid, dirty, or ignored
- which tags map to categories, reps, teams, exclusions, or dirty fields
- which fields are trusted for reporting
- which fields require cleanup

## Instagram and Meta

Mode: Meta Graph-ready with feature-gated write actions.

Supported connection paths:

- Business Login for Instagram on `graph.instagram.com` for directly connected Instagram professional accounts.
- Facebook Login for Business on `graph.facebook.com` for Instagram Business/Creator accounts linked through Meta Business Suite Pages.

Pull where permitted:

- owned accounts
- account profile metrics
- media/posts/reels/stories where available
- comments where permissions allow
- insights where permissions allow
- sync status

Write where permitted:

- publish draft/planned posts through `/media` and `/media_publish`
- reply to comments through `/comments/{comment-id}/replies`
- reply to messages through `/{ig-user-id}/messages`

All write actions require:

- owned `social_account`
- saved Meta connector
- encrypted access token
- required read scopes
- matching optional scope for publish/comments/messages
- tenant feature flag
- tenant-session mutation

Tenant-specific configuration:

- owned accounts
- watched accounts
- account categories
- alert rules
- comment/reply permissions
- message mapping rules
- publishing capability toggle

Watched accounts:

- watched handles can be manually added or imported without ownership
- API enrichment only runs where Meta permits it, such as authorized Business/Creator metadata, mentions/comments involving owned accounts, or future connected providers
- watched account records must never be treated as destructive identity merges

## Manual imports

Manual import must be a first-class path because not every watched account or social platform will be API-accessible.

Supported import targets:

- social accounts
- customer/org mappings
- campaign lists
- customer categories
- watched competitor/media lists

Manual imports must still produce tenant-scoped records and should never bypass identity review.

## Email

MVP mode: draft-only.

The app can prepare an email draft and let the user copy it or open an email client. It should not send emails until a tenant enables an email provider integration and accepts the operational risk.

## Future catalog adapters

Catalog costs and profitability should wait until the order/customer foundation is stable, but the adapter boundary should be documented now.

Future catalog adapters should expose:

- provider name
- product search
- SKU matching
- blank cost
- inventory availability
- cache timestamp
- stale data warning
- tenant-specific credentials

Examples may include S&S Activewear, AlphaBroder, SanMar, or tenant-specific vendor feeds. No single catalog provider should be hardcoded as the only path.

## Current Implementation

- `OrderingPlatformAdapter`, `SocialPlatformAdapter`, and a future `CatalogAdapter` stub are defined in `lib/application/screenprinting/adapters.ts`.
- Printavo preview and sync use `lib/infrastructure/adapters/printavo/ordering-adapter.ts`, which wraps the existing read-only Printavo client.
- Manual social fallback uses `lib/infrastructure/adapters/social/manual-social-adapter.ts` and fixture-backed owned/watched account data.
- Meta readiness and action boundaries use `lib/infrastructure/adapters/social/meta-instagram-adapter.ts`.
- Live social write routes are available but permission-gated by connector state, scopes, owned-account IDs, and tenant feature flags.
