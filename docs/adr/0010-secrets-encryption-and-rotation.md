# ADR 0010: Secrets encryption and rotation

## Status
Accepted

## Context
Tenants bring credentials for providers such as Printavo, Nabis, Notion, Google Maps, and future social/catalog APIs. Those credentials must not be shared or committed.

## Decision
Store tenant-scoped connector secrets encrypted at rest, keyed by organization and installation, with an explicit rotation path and a clear distinction between browser-safe config and server-only secrets.

## Rationale
Connector credentials are tenant-specific operational secrets. They must not live in shared public environment variables or leak across organizations. A platform-owned OAuth client ID/secret may identify the Map App product itself, but any access tokens or provider data granted by a tenant remain tenant-scoped encrypted secrets.

## Consequences
- browser-safe values such as a tenant's Maps JavaScript key are configured separately from server-only secrets
- server-only connector secrets remain encrypted and are only resolved inside trusted backend code
- the platform needs a documented key-management and rotation story before broad customer onboarding
- setup docs must define which secrets are human-provided environment variables during early development

## Alternatives considered
- Shared global provider env vars for tenant runtime: rejected because usage, quota, and data access would be coupled. Platform-owned OAuth app credentials are allowed only when they identify the app client and do not replace tenant-scoped access tokens.
- Store secrets directly in tenant workspace JSON: rejected because committed files are not a secret store.
- Ask users to paste credentials for every sync run only: rejected because automation and scheduled sync need saved credentials.

## Follow-up checks
- Secret resolution should prefer tenant integration installs.
- Rotation metadata should be stored with the secret.
- Logs and API responses must never expose secret values.
