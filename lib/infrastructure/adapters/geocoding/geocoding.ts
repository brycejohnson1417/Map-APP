import "server-only";

export type GeocodeProvider = "google_maps" | "openstreetmap";

interface GoogleGeocodeResult {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
}

interface GoogleGeocodeResponse {
  status: string;
  results?: GoogleGeocodeResult[];
  error_message?: string;
}

interface NominatimResult {
  display_name?: string;
  lat?: string;
  lon?: string;
}

export interface GeocodeCandidate {
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface GeocodingPlan {
  provider: GeocodeProvider;
  googleApiKey: string | null;
  maxPerSync: number;
  openGeocodingBaseUrl: string;
  openGeocodingUserAgent: string;
  openGeocodingMinDelayMs: number;
}

const DEFAULT_OPEN_GEOCODING_BASE_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_OPEN_GEOCODING_USER_AGENT = "MapApp/1.0 (https://map-app-supabase.vercel.app)";
const DEFAULT_OPEN_GEOCODING_MIN_DELAY_MS = 1_100;
const DEFAULT_OPEN_GEOCODING_MAX_PER_SYNC = 20;
const DEFAULT_GOOGLE_GEOCODING_MAX_PER_SYNC = 80;

let lastOpenGeocodeAt = 0;

function cleanPart(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function buildAddress(candidate: GeocodeCandidate) {
  const street = [cleanPart(candidate.addressLine1), cleanPart(candidate.addressLine2)].filter(Boolean).join(" ");
  const locality = [cleanPart(candidate.city), cleanPart(candidate.state), cleanPart(candidate.postalCode)].filter(Boolean).join(", ");
  const country = cleanPart(candidate.country) ?? "USA";
  const namedFallback = [cleanPart(candidate.name), locality || cleanPart(candidate.state), country].filter(Boolean).join(", ");
  const address = [street, locality, country].filter(Boolean).join(", ");

  return address || namedFallback;
}

function numberFromEnv(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function slugEnvPrefix(slug: string | null | undefined) {
  return String(slug ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function resolveTenantGoogleMapsServerKey(organizationSlug: string | null | undefined) {
  const prefix = slugEnvPrefix(organizationSlug);
  const scoped = prefix ? process.env[`${prefix}_GOOGLE_MAPS_SERVER_API_KEY`]?.trim() : "";
  if (scoped) {
    return scoped;
  }

  return process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim() || null;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForOpenGeocodingSlot(minDelayMs: number) {
  const now = Date.now();
  const waitMs = Math.max(0, lastOpenGeocodeAt + minDelayMs - now);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  lastOpenGeocodeAt = Date.now();
}

export function resolveGeocodingPlan(input: { organizationSlug?: string | null } = {}): GeocodingPlan {
  const googleApiKey = resolveTenantGoogleMapsServerKey(input.organizationSlug);
  const provider: GeocodeProvider = googleApiKey ? "google_maps" : "openstreetmap";
  const openGeocodingMinDelayMs = numberFromEnv(
    process.env.OPEN_GEOCODING_MIN_DELAY_MS,
    DEFAULT_OPEN_GEOCODING_MIN_DELAY_MS,
    1_000,
    10_000,
  );

  return {
    provider,
    googleApiKey,
    maxPerSync:
      provider === "google_maps"
        ? numberFromEnv(process.env.GOOGLE_GEOCODING_MAX_PER_SYNC, DEFAULT_GOOGLE_GEOCODING_MAX_PER_SYNC, 1, 200)
        : numberFromEnv(process.env.OPEN_GEOCODING_MAX_PER_SYNC, DEFAULT_OPEN_GEOCODING_MAX_PER_SYNC, 1, 50),
    openGeocodingBaseUrl: process.env.OPEN_GEOCODING_BASE_URL?.trim() || DEFAULT_OPEN_GEOCODING_BASE_URL,
    openGeocodingUserAgent: process.env.OPEN_GEOCODING_USER_AGENT?.trim() || DEFAULT_OPEN_GEOCODING_USER_AGENT,
    openGeocodingMinDelayMs,
  };
}

async function geocodeWithGoogle(candidate: GeocodeCandidate, apiKey: string) {
  const address = buildAddress(candidate);

  if (!address) {
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;
  if (payload.status !== "OK") {
    return null;
  }

  const result = payload.results?.[0];
  const location = result?.geometry?.location;
  if (typeof location?.lat !== "number" || typeof location.lng !== "number") {
    return null;
  }

  return {
    latitude: location.lat,
    longitude: location.lng,
    geocodedAddress: result?.formatted_address ?? address,
    provider: "google_maps" as const,
  };
}

async function geocodeWithOpenStreetMap(candidate: GeocodeCandidate, plan: GeocodingPlan) {
  const address = buildAddress(candidate);

  if (!address) {
    return null;
  }

  await waitForOpenGeocodingSlot(plan.openGeocodingMinDelayMs);

  const url = new URL(plan.openGeocodingBaseUrl);
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");
  if (String(candidate.country ?? "").toLowerCase().includes("us") || !candidate.country) {
    url.searchParams.set("countrycodes", "us");
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": plan.openGeocodingUserAgent,
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as NominatimResult[];
  const result = payload[0];
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    geocodedAddress: result?.display_name ?? address,
    provider: "openstreetmap" as const,
  };
}

export async function geocodeAccountCandidate(candidate: GeocodeCandidate, plan: GeocodingPlan) {
  if (plan.provider === "google_maps" && plan.googleApiKey) {
    return geocodeWithGoogle(candidate, plan.googleApiKey);
  }

  return geocodeWithOpenStreetMap(candidate, plan);
}
