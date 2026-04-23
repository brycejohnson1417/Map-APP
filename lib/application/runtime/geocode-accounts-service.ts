import "server-only";

import { findRuntimeOrganization } from "@/lib/application/runtime/runtime-rest";
import { hasUsableFraterniteesAddress, isFraterniteesHqAddress } from "@/lib/application/fraternitees/address-rules";
import { geocodeAccountCandidate, resolveGeocodingPlan, type GeocodeCandidate } from "@/lib/infrastructure/adapters/geocoding/geocoding";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface AccountGeocodeRow {
  id: string;
  name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  custom_fields: Record<string, unknown> | null;
  source_payload: Record<string, unknown> | null;
}

function readLimit(value: unknown, fallback: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

function hasUsableAddress(row: AccountGeocodeRow, organizationSlug: string) {
  if (organizationSlug === "fraternitees") {
    return hasUsableFraterniteesAddress({
      addressLine1: row.address_line_1,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
    });
  }

  if (row.address_line_1?.trim()) {
    return true;
  }

  if (row.postal_code?.trim()) {
    return true;
  }

  return Boolean(row.city?.trim() && row.state?.trim());
}

function toCandidate(row: AccountGeocodeRow): GeocodeCandidate {
  return {
    name: row.name ?? `Account ${row.id}`,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
  };
}

export async function geocodeMissingRuntimeAccounts(input: { organizationSlug: string; limit?: number }) {
  const organization = await findRuntimeOrganization(input.organizationSlug);
  if (!organization) {
    throw new Error("organization_not_found");
  }

  const plan = resolveGeocodingPlan({ organizationSlug: organization.slug });
  const limit = readLimit(input.limit, plan.maxPerSync, plan.maxPerSync);
  const supabase = getSupabaseAdminClient() as any;
  const fetchLimit = Math.min(Math.max(limit * 10, 200), 1_000);
  const { data, error } = await supabase
    .from("account")
    .select("id,name,address_line_1,address_line_2,city,state,postal_code,country,custom_fields,source_payload")
    .eq("organization_id", organization.id)
    .or("latitude.is.null,longitude.is.null")
    .order("updated_at", { ascending: true })
    .limit(fetchLimit);

  if (error) {
    throw error;
  }

  let attempted = 0;
  let geocoded = 0;
  let skippedNoAddress = 0;
  let failed = 0;

  for (const row of (data ?? []) as AccountGeocodeRow[]) {
    if (attempted >= limit) {
      break;
    }

    if (row.custom_fields?.noAddressAvailable === true) {
      skippedNoAddress += 1;
      continue;
    }

    if (organization.slug === "fraternitees" && isFraterniteesHqAddress({
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
    })) {
      skippedNoAddress += 1;
      await supabase
        .from("account")
        .update({
          latitude: null,
          longitude: null,
          custom_fields: {
            ...row.custom_fields,
            noAddressAvailable: true,
            addressSuppressedReason: "fraternitees_hq_individual_shipments",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      continue;
    }

    if (!hasUsableAddress(row, organization.slug)) {
      skippedNoAddress += 1;
      if (organization.slug === "fraternitees") {
        await supabase
          .from("account")
          .update({
            latitude: null,
            longitude: null,
            custom_fields: {
              ...row.custom_fields,
              noAddressAvailable: true,
              addressSuppressedReason: "fraternitees_no_usable_shipping_address",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }
      continue;
    }

    attempted += 1;
    const result = await geocodeAccountCandidate(toCandidate(row), plan);
    if (!result) {
      failed += 1;
      continue;
    }

    const sourcePayload = {
      ...row.source_payload,
      geocode: {
        provider: result.provider,
        address: result.geocodedAddress,
        geocodedAt: new Date().toISOString(),
      },
    };
    const { error: updateError } = await supabase
      .from("account")
      .update({
        latitude: result.latitude,
        longitude: result.longitude,
        source_payload: sourcePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      failed += 1;
      continue;
    }

    geocoded += 1;
  }

  return {
    organizationSlug: organization.slug,
    provider: plan.provider,
    limit,
    scanned: (data ?? []).length,
    attempted,
    geocoded,
    skippedNoAddress,
    failed,
  };
}
