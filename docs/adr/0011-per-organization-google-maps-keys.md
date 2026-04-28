# ADR 0011: Per-organization Google Maps keys

## Status
Accepted

## Context
Map usage can generate material cost. A tenant's map traffic should be attributable to that tenant's own Google Cloud project and restrictions.

## Decision
Google Maps remains the only supported mapping provider in year one, but each organization brings its own Google Cloud project, billing, browser key, and server-side maps key.

## Rationale
Map usage cost should belong to the organization generating the traffic. Shared Google Maps billing would couple customer usage and create operational risk.

## Consequences
- organization onboarding must collect both a browser-safe Maps JavaScript key and a server-side maps key
- browser keys require documented referrer restrictions
- server-side map operations must resolve credentials per organization
- the platform does not need a generic pluggable maps-provider contract in year one

## Alternatives considered
- One shared Google Maps project/key: rejected because tenant usage and billing would be coupled.
- Fully pluggable maps provider abstraction now: deferred because tenant workflow extraction is higher priority.
- No Google Maps support: rejected because routing/geocoding/map UX is core to territory workflows.

## Follow-up checks
- Browser keys must be referrer-restricted.
- Server keys must stay server-only.
- Tenant runtime routes must not fall back to generic shared Google Maps env keys.
