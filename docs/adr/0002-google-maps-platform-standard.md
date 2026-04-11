# ADR 0002: Google Maps Platform standard

## Status
Accepted

## Decision
Use Google Maps Platform for map rendering, geocoding, and routing.

## Rationale
The product needs highly polished map UX, reliable routing, and commercial-grade geocoding. Open-source mapping stacks are valuable, but Google Maps provides the strongest default user experience for this product.

## Consequences
- Google Maps JavaScript API drives the map UI.
- Geocoding and route generation use Google APIs.
- PostGIS is still used for local spatial logic such as point-in-polygon, radius search, and territory balancing.
