# ADR 0003: Adapter-based integrations

## Status
Accepted

## Context
Current and future tenants use different CRMs, order systems, calendars, social platforms, and internal data sources. The app must not become provider-specific at the domain layer.

## Decision
All CRM, orders, calendar, and identity integrations must implement adapter contracts instead of being hardcoded into the application domain.

## Rationale
The platform needs to support bring-your-own APIs for future customers. Hardcoding Notion or Nabis assumptions into business logic would make the product brittle and tenant-specific.

## Consequences
- The domain layer stays generic.
- Per-tenant connector configuration and field mappings become first-class.
- New providers can be added without rewriting the app core.

## Alternatives considered
- Hardcode Notion/Nabis/Printavo directly into shared services: rejected because every tenant would increase shared-code branching.
- Build a fully generic integration marketplace first: deferred because concrete adapters are needed to prove the product contract.
- Use CSV as the only integration boundary: rejected because tenants need durable sync, identity, and credential handling.

## Follow-up checks
- Provider credentials are tenant-scoped.
- Provider field/status/tag differences flow through mapping rules or adapter transforms.
- Adapters preserve source ids and source payload references.
