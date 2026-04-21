# ADR 0010: Secrets encryption and rotation

## Status
Accepted

## Decision
Store tenant-scoped connector secrets encrypted at rest, keyed by organization and installation, with an explicit rotation path and a clear distinction between browser-safe config and server-only secrets.

## Rationale
Connector credentials are tenant-specific operational secrets. They must not live in shared public environment variables or leak across organizations.

## Consequences
- browser-safe values such as a tenant's Maps JavaScript key are configured separately from server-only secrets
- server-only connector secrets remain encrypted and are only resolved inside trusted backend code
- the platform needs a documented key-management and rotation story before broad customer onboarding
- setup docs must define which secrets are human-provided environment variables during early development
