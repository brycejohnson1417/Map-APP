# ADR 0006: Connectors as product contracts

## Status
Accepted

## Context
Connectors are visible product capabilities: tenants install them, preview data, sync records, and rely on their health. Treating them as hidden glue makes onboarding and support brittle.

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

## Alternatives considered
- UI-only connector setup with provider logic inside components: rejected because CLI, jobs, and verification need the same behavior.
- Provider-specific one-off setup pages: rejected because tenant onboarding must become repeatable.
- Secrets in committed workspace files: rejected because connector credentials are tenant secrets.

## Follow-up checks
- Connector setup should validate required fields and store secrets encrypted.
- Connector health should be visible to tenants/operators.
- Connector writes to external systems require explicit approval and audit trails.
