import "server-only";

import type {
  TerritoryAccountPin,
  TerritoryBoundaryRuntime,
  TerritoryFilterFlag,
  TerritoryMarkerRuntime,
  TerritoryOverlayRuntime,
  TerritoryRuntimeDashboard,
} from "@/lib/domain/runtime";
import { findRuntimeOrganization, runtimeExactCount, runtimeRestRequest } from "@/lib/application/runtime/runtime-rest";

const MAX_PIN_ROWS = 2_000;
const DISPLAY_PIN_ROWS = 1_000;

interface AccountRow {
  id: string;
  name: string;
  display_name: string | null;
  account_status: string | null;
  lead_status: string | null;
  referral_source: string | null;
  vendor_day_status: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  sales_rep_names: string[] | null;
  last_contacted_at: string | null;
  last_order_date: string | null;
  last_sample_delivery_date: string | null;
  custom_fields: Record<string, unknown> | null;
}

interface BoundaryRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  border_width: number | null;
  is_visible_by_default: boolean | null;
  geojson: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface MarkerRow {
  id: string;
  name: string;
  description: string | null;
  marker_type: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  color: string | null;
  icon: string | null;
  is_visible_by_default: boolean | null;
  created_at: string;
  updated_at: string;
}

function normalizeSearch(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = raw?.trim();
  return normalized ? normalized.slice(0, 80) : null;
}

function normalizeFlag(value: string | string[] | undefined): TerritoryFilterFlag | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "missing_referral_source" || raw === "missing_sample_delivery") {
    return raw;
  }

  return null;
}

function normalizeFacet(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = raw?.trim();
  return normalized ? normalized.slice(0, 120) : null;
}

function rowMatchesSearch(row: AccountRow, search: string | null) {
  if (!search) {
    return true;
  }

  const needle = search.toLowerCase();
  return [row.name, row.display_name, row.city, row.state]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

function rowMatchesRep(row: AccountRow, rep: string | null) {
  if (!rep) {
    return true;
  }

  return (row.sales_rep_names ?? []).includes(rep);
}

function rowMatchesFacet(value: string | null, selected: string | null) {
  if (!selected) {
    return true;
  }

  return (value ?? "").toLowerCase() === selected.toLowerCase();
}

function mapPinRow(row: AccountRow): TerritoryAccountPin {
  const daysOverdue = row.custom_fields?.daysOverdue;

  return {
    id: row.id,
    name: row.display_name ?? row.name,
    status: row.account_status,
    leadStatus: row.lead_status,
    referralSource: row.referral_source,
    vendorDayStatus: row.vendor_day_status,
    city: row.city,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    salesRepNames: row.sales_rep_names ?? [],
    lastContactedAt: row.last_contacted_at,
    lastOrderDate: row.last_order_date,
    lastSampleDeliveryDate: row.last_sample_delivery_date,
    daysOverdue: typeof daysOverdue === "number" ? daysOverdue : null,
  };
}

function buildRepFacets(rows: AccountRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const name of row.sales_rep_names ?? []) {
      if (name) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 12);
}

function buildSingleValueFacets(rows: AccountRow[], getValue: (row: AccountRow) => string | null) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const value = getValue(row)?.trim();
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 18);
}

async function fetchGeocodedAccounts(organizationId: string, flag: TerritoryFilterFlag | null) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    latitude: "not.is.null",
    longitude: "not.is.null",
    select:
      "id,name,display_name,account_status,lead_status,referral_source,vendor_day_status,city,state,latitude,longitude,sales_rep_names,last_contacted_at,last_order_date,last_sample_delivery_date,custom_fields",
    order: "external_updated_at.desc.nullslast",
    limit: String(MAX_PIN_ROWS),
  });

  if (flag === "missing_referral_source") {
    params.set("referral_source", "is.null");
  }

  if (flag === "missing_sample_delivery") {
    params.set("last_sample_delivery_date", "is.null");
  }

  const { data } = await runtimeRestRequest<AccountRow[]>("account", params);
  return data;
}

export async function getTerritoryRuntimeDashboard(
  slug: string,
  params: Record<string, string | string[] | undefined>,
): Promise<TerritoryRuntimeDashboard | null> {
  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }

  const appliedFilters = {
    search: normalizeSearch(params.q),
    flag: normalizeFlag(params.flag),
    rep: normalizeFacet(params.rep),
    status: normalizeFacet(params.status),
    referralSource: normalizeFacet(params.referralSource),
    vendorDayStatus: normalizeFacet(params.vendorDayStatus),
  };

  const [accounts, geocodedPins, orders, contacts, territoryBoundaries, territoryMarkers, noReferralSource, noLastSampleDeliveryDate] =
    await Promise.all([
      runtimeExactCount("account", organization.id),
      runtimeExactCount("account", organization.id, { latitude: "not.is.null", longitude: "not.is.null" }),
      runtimeExactCount("order_record", organization.id),
      runtimeExactCount("contact", organization.id),
      runtimeExactCount("territory_boundary", organization.id),
      runtimeExactCount("territory_marker", organization.id),
      runtimeExactCount("account", organization.id, { referral_source: "is.null" }),
      runtimeExactCount("account", organization.id, { last_sample_delivery_date: "is.null" }),
    ]);

  const geocodedRows = await fetchGeocodedAccounts(organization.id, appliedFilters.flag);
  const visibleRows = geocodedRows
    .filter((row) => rowMatchesSearch(row, appliedFilters.search))
    .filter((row) => rowMatchesRep(row, appliedFilters.rep))
    .filter((row) => rowMatchesFacet(row.account_status, appliedFilters.status))
    .filter((row) => rowMatchesFacet(row.referral_source, appliedFilters.referralSource))
    .filter((row) => rowMatchesFacet(row.vendor_day_status, appliedFilters.vendorDayStatus));

  return {
    organization,
    counts: {
      accounts,
      geocodedPins,
      orders,
      contacts,
      territoryBoundaries,
      territoryMarkers,
      noReferralSource,
      noLastSampleDeliveryDate,
    },
    repFacets: buildRepFacets(geocodedRows),
    statusFacets: buildSingleValueFacets(geocodedRows, (row) => row.account_status),
    referralSourceFacets: buildSingleValueFacets(geocodedRows, (row) => row.referral_source),
    vendorDayFacets: buildSingleValueFacets(geocodedRows, (row) => row.vendor_day_status),
    pins: visibleRows.slice(0, DISPLAY_PIN_ROWS).map(mapPinRow),
    appliedFilters,
  };
}

function readBoundaryCoordinates(geojson: Record<string, unknown> | null): Array<[number, number]> {
  const coordinates = geojson?.coordinates;

  if (!Array.isArray(coordinates)) {
    return [];
  }

  const ring =
    geojson?.type === "MultiPolygon"
      ? coordinates[0]?.[0]
      : geojson?.type === "Polygon"
        ? coordinates[0]
        : coordinates;

  if (!Array.isArray(ring)) {
    return [];
  }

  return ring
    .map((point): [number, number] | null => {
      if (!Array.isArray(point) || point.length < 2) {
        return null;
      }

      const longitude = Number(point[0]);
      const latitude = Number(point[1]);
      return Number.isFinite(latitude) && Number.isFinite(longitude) ? [longitude, latitude] : null;
    })
    .filter((point): point is [number, number] => Boolean(point));
}

function mapBoundary(row: BoundaryRow): TerritoryBoundaryRuntime {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color ?? "#d74314",
    borderWidth: row.border_width ?? 2,
    isVisibleByDefault: row.is_visible_by_default ?? true,
    coordinates: readBoundaryCoordinates(row.geojson),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMarker(row: MarkerRow): TerritoryMarkerRuntime {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    markerType: row.marker_type ?? "custom",
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    color: row.color ?? "#0f172a",
    icon: row.icon ?? "marker",
    isVisibleByDefault: row.is_visible_by_default ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTerritoryOverlays(slug: string): Promise<TerritoryOverlayRuntime | null> {
  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }

  const [boundaries, markers] = await Promise.all([
    runtimeRestRequest<BoundaryRow[]>(
      "territory_boundary",
      new URLSearchParams({
        organization_id: `eq.${organization.id}`,
        select: "id,name,description,color,border_width,is_visible_by_default,geojson,created_at,updated_at",
        order: "name.asc",
      }),
    ),
    runtimeRestRequest<MarkerRow[]>(
      "territory_marker",
      new URLSearchParams({
        organization_id: `eq.${organization.id}`,
        select: "id,name,description,marker_type,address,latitude,longitude,color,icon,is_visible_by_default,created_at,updated_at",
        order: "name.asc",
      }),
    ),
  ]);

  return {
    organization,
    boundaries: boundaries.data.map(mapBoundary),
    markers: markers.data.map(mapMarker),
  };
}
