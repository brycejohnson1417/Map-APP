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

MVP mode: monitoring and calendar first.

Pull where permitted:

- owned accounts
- account profile metrics
- media/posts/reels/stories where available
- comments where permissions allow
- insights where permissions allow
- sync status

Push only when a future tenant explicitly enables publishing or reply capabilities.

Tenant-specific configuration:

- owned accounts
- watched accounts
- account categories
- alert rules
- comment/reply permissions
- message mapping rules
- publishing capability toggle

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
