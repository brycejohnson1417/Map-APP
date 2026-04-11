# ADR 0003: Adapter-based integrations

## Status
Accepted

## Decision
All CRM, orders, calendar, and identity integrations must implement adapter contracts instead of being hardcoded into the application domain.

## Rationale
The platform needs to support bring-your-own APIs for future customers. Hardcoding Notion or Nabis assumptions into business logic would make the product brittle and PICC-specific.

## Consequences
- The domain layer stays generic.
- Per-tenant connector configuration and field mappings become first-class.
- New providers can be added without rewriting the app core.
