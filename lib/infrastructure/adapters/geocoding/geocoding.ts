import "server-only";

export type GeocodeProvider = "openstreetmap";

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
  maxPerSync: number;
  openGeocodingBaseUrl: string;
  openGeocodingUserAgent: string;
  openGeocodingMinDelayMs: number;
}

const DEFAULT_OPEN_GEOCODING_BASE_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_OPEN_GEOCODING_USER_AGENT = "MapApp/1.0 (https://map-app-supabase.vercel.app)";
const DEFAULT_OPEN_GEOCODING_MIN_DELAY_MS = 1_100;
const DEFAULT_OPEN_GEOCODING_MAX_PER_SYNC = 20;

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

export async function resolveGeocodingPlan(): Promise<GeocodingPlan> {
  const openGeocodingMinDelayMs = numberFromEnv(
    process.env.OPEN_GEOCODING_MIN_DELAY_MS,
    DEFAULT_OPEN_GEOCODING_MIN_DELAY_MS,
    1_000,
    10_000,
  );

  return {
    provider: "openstreetmap",
    maxPerSync: numberFromEnv(process.env.OPEN_GEOCODING_MAX_PER_SYNC, DEFAULT_OPEN_GEOCODING_MAX_PER_SYNC, 1, 50),
    openGeocodingBaseUrl: process.env.OPEN_GEOCODING_BASE_URL?.trim() || DEFAULT_OPEN_GEOCODING_BASE_URL,
    openGeocodingUserAgent: process.env.OPEN_GEOCODING_USER_AGENT?.trim() || DEFAULT_OPEN_GEOCODING_USER_AGENT,
    openGeocodingMinDelayMs,
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
  return geocodeWithOpenStreetMap(candidate, plan);
}
