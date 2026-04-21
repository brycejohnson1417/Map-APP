# ADR 0011: Per-organization Google Maps keys

## Status
Accepted

## Decision
Google Maps remains the only supported mapping provider in year one, but each organization brings its own Google Cloud project, billing, browser key, and server-side maps key.

## Rationale
Map usage cost should belong to the organization generating the traffic. Shared Google Maps billing would couple customer usage and create operational risk.

## Consequences
- organization onboarding must collect both a browser-safe Maps JavaScript key and a server-side maps key
- browser keys require documented referrer restrictions
- server-side map operations must resolve credentials per organization
- the platform does not need a generic pluggable maps-provider contract in year one
