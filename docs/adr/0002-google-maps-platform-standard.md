# ADR 0002: Google Maps Platform standard

## Status
Accepted

## Context
The product needs map rendering, geocoding, and routing for field and account workflows. Tenant map cost and key ownership must be controlled.

## Decision
Use Google Maps Platform for map rendering, geocoding, and routing.

## Rationale
The product needs highly polished map UX, reliable routing, and commercial-grade geocoding. Open-source mapping stacks are valuable, but Google Maps provides the strongest default user experience for this product.

## Consequences
- Google Maps JavaScript API drives the map UI.
- Geocoding and route generation use Google APIs.
- PostGIS is still used for local spatial logic such as point-in-polygon, radius search, and territory balancing.
- Google Maps is a product standard, not a pluggable provider contract for year one.

## Alternatives considered
- OpenStreetMap-only stack: useful as fallback, but not the strongest default for commercial geocoding/routing UX.
- Provider-agnostic maps abstraction in year one: deferred because it adds complexity before tenant workflow fit is proven.
- Shared global Google Maps key: rejected because it couples tenant usage, billing, and quota risk.

## Follow-up checks
- Browser and server keys must be tenant-scoped.
- Fallback map behavior must be explicit when Google keys are missing.
- Route/geocode code must not use generic paid-provider env fallbacks for tenant runtime paths.
