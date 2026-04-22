import "server-only";

import type { Organization, TerritoryAccountPin, TerritoryFilterFlag, TerritoryRuntimeDashboard } from "@/lib/domain/runtime";
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/config";

const MAX_PIN_ROWS = 500;
const DISPLAY_PIN_ROWS = 120;

interface AccountRow {
  id: string;
  name: string;
  display_name: string | null;
  account_status: string | null;
  lead_status: string | null;
  referral_source: string | null;
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

function getRestConfig() {
  const baseUrl = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey() || getSupabaseAnonKey();

  if (!baseUrl || !key) {
    throw new Error("Supabase is not configured");
  }

  return {
    restUrl: `${baseUrl.replace(/\/$/, "")}/rest/v1`,
    key,
  };
}

async function restRequest<T>(table: string, params: URLSearchParams, init?: RequestInit) {
  const { restUrl, key } = getRestConfig();
  const response = await fetch(`${restUrl}/${table}?${params.toString()}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase REST ${table} failed with ${response.status}: ${body.slice(0, 300)}`);
  }

  if (init?.method === "HEAD") {
    return {
      data: null as T,
      count: parseContentRangeCount(response.headers.get("content-range")),
    };
  }

  return {
    data: (await response.json()) as T,
    count: parseContentRangeCount(response.headers.get("content-range")),
  };
}

function parseContentRangeCount(value: string | null) {
  if (!value) {
    return 0;
  }

  const [, count] = value.split("/");
  return count && count !== "*" ? Number(count) : 0;
}

async function exactCount(table: string, organizationId: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({
    select: "id",
    organization_id: `eq.${organizationId}`,
    limit: "1",
    ...extra,
  });
  const result = await restRequest<null>(table, params, {
    method: "HEAD",
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  return result.count;
}

function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    status: String(row.status),
    settings: (row.settings ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function findOrganization(slug: string) {
  const params = new URLSearchParams({
    slug: `eq.${slug}`,
    select: "id,slug,name,status,settings,created_at,updated_at",
    limit: "1",
  });
  const { data } = await restRequest<Array<Record<string, unknown>>>("organization", params);
  return data[0] ? mapOrganization(data[0]) : null;
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

function mapPinRow(row: AccountRow): TerritoryAccountPin {
  const daysOverdue = row.custom_fields?.daysOverdue;

  return {
    id: row.id,
    name: row.display_name ?? row.name,
    status: row.account_status,
    leadStatus: row.lead_status,
    referralSource: row.referral_source,
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

async function fetchGeocodedAccounts(organizationId: string, flag: TerritoryFilterFlag | null) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    latitude: "not.is.null",
    longitude: "not.is.null",
    select:
      "id,name,display_name,account_status,lead_status,referral_source,city,state,latitude,longitude,sales_rep_names,last_contacted_at,last_order_date,last_sample_delivery_date,custom_fields",
    order: "external_updated_at.desc.nullslast",
    limit: String(MAX_PIN_ROWS),
  });

  if (flag === "missing_referral_source") {
    params.set("referral_source", "is.null");
  }

  if (flag === "missing_sample_delivery") {
    params.set("last_sample_delivery_date", "is.null");
  }

  const { data } = await restRequest<AccountRow[]>("account", params);
  return data;
}

export async function getTerritoryRuntimeDashboard(
  slug: string,
  params: Record<string, string | string[] | undefined>,
): Promise<TerritoryRuntimeDashboard | null> {
  const organization = await findOrganization(slug);
  if (!organization) {
    return null;
  }

  const appliedFilters = {
    search: normalizeSearch(params.q),
    flag: normalizeFlag(params.flag),
    rep: normalizeSearch(params.rep),
  };

  const [accounts, geocodedPins, orders, contacts, territoryBoundaries, territoryMarkers, noReferralSource, noLastSampleDeliveryDate] =
    await Promise.all([
      exactCount("account", organization.id),
      exactCount("account", organization.id, { latitude: "not.is.null", longitude: "not.is.null" }),
      exactCount("order_record", organization.id),
      exactCount("contact", organization.id),
      exactCount("territory_boundary", organization.id),
      exactCount("territory_marker", organization.id),
      exactCount("account", organization.id, { referral_source: "is.null" }),
      exactCount("account", organization.id, { last_sample_delivery_date: "is.null" }),
    ]);

  const geocodedRows = await fetchGeocodedAccounts(organization.id, appliedFilters.flag);
  const visibleRows = geocodedRows
    .filter((row) => rowMatchesSearch(row, appliedFilters.search))
    .filter((row) => rowMatchesRep(row, appliedFilters.rep));

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
    pins: visibleRows.slice(0, DISPLAY_PIN_ROWS).map(mapPinRow),
    appliedFilters,
  };
}
