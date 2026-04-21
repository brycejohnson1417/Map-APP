# ADR 0006: Connectors as product contracts

## Status
Accepted

## Decision
Treat integrations as stable product contracts, not incidental provider glue. The core product interacts with connector interfaces, and providers implement those contracts through adapters/plugins.

## Rationale
The platform is intended to support many tenants with different CRMs, order systems, calendars, and internal APIs. Hardcoding provider logic into the application layer would make the system tenant-specific and prevent the product from scaling operationally.

## Consequences
- connector contracts must be explicit and versionable
- provider-specific logic belongs in adapters/plugins
- field mapping and tenant configuration become first-class platform features
- future marketplace or tenant-private connectors remain possible without rewriting the core
- the connector surface should be stable enough that the CLI, runtime UI, and migration tooling all call the same application services
