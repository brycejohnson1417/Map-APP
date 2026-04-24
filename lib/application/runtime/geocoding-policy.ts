import "server-only";

import type { WorkspaceDefinition } from "@/lib/domain/workspace";

type GeocodingConfig = WorkspaceDefinition["geocoding"];
type SuppressedAddress = NonNullable<NonNullable<GeocodingConfig>["suppressedAddresses"]>[number];

interface AddressInput {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

function normalize(value: string | null | undefined) {
  return value
    ?.toLowerCase()
    .replace(/\broad\b/g, "rd")
    .replace(/\bstreet\b/g, "st")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() ?? "";
}

function patternMatches(value: string, pattern: string) {
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return value.includes(normalize(pattern));
  }
}

function matchesSuppressedAddress(
  input: AddressInput,
  suppressedAddress: SuppressedAddress,
) {
  const line1 = normalize(input.addressLine1);
  const line2 = normalize(input.addressLine2);
  const city = normalize(input.city);
  const state = normalize(input.state);
  const postalCode = normalize(input.postalCode);

  if (!line1.includes(normalize(suppressedAddress.addressLine1))) {
    return false;
  }

  if (suppressedAddress.addressLine2 && line2 && !line2.includes(normalize(suppressedAddress.addressLine2))) {
    return false;
  }

  if (suppressedAddress.city && city !== normalize(suppressedAddress.city)) {
    return false;
  }

  if (suppressedAddress.state && state !== normalize(suppressedAddress.state)) {
    return false;
  }

  if (suppressedAddress.postalCode && postalCode && postalCode !== normalize(suppressedAddress.postalCode)) {
    return false;
  }

  return true;
}

export function resolveSuppressedGeocodingAddress(input: AddressInput, config?: GeocodingConfig | null) {
  const suppressedAddresses = config?.suppressedAddresses ?? [];
  return suppressedAddresses.find((suppressedAddress) => matchesSuppressedAddress(input, suppressedAddress)) ?? null;
}

export function hasUsableWorkspaceAddress(input: AddressInput, config?: GeocodingConfig | null) {
  const line1 = input.addressLine1?.trim() ?? "";
  const placeholderPatterns = config?.placeholderAddressPatterns ?? [];
  const normalizedLine1 = normalize(line1);

  if (line1 && !placeholderPatterns.some((pattern) => patternMatches(normalizedLine1, pattern))) {
    return true;
  }

  if (input.postalCode?.trim()) {
    return true;
  }

  return Boolean(input.city?.trim() && input.state?.trim());
}
