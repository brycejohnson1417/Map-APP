import "server-only";

import { createHash } from "node:crypto";
import {
  classifyFraterniteesStatus,
  scoreFraterniteesLeads,
  type FraterniteesLeadOrder,
  type FraterniteesLeadScore,
} from "@/lib/application/fraternitees/lead-scoring";
import { hasUsableFraterniteesAddress, isFraterniteesHqAddress } from "@/lib/application/fraternitees/address-rules";
import { geocodeAccountCandidate, resolveGeocodingPlan } from "@/lib/infrastructure/adapters/geocoding/geocoding";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface IdentityRow {
  external_id: string;
  account_id: string;
}

interface AccountLocationRow {
  id: string;
  latitude: number | null;
  longitude: number | null;
}

interface ExistingContactRow {
  id: string;
  account_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  custom_fields: Record<string, unknown> | null;
}

interface ExistingOrderRow {
  account_id: string | null;
  external_order_id: string;
  source_payload: Record<string, unknown> | null;
}

interface AccountImportSummary {
  key: string;
  name: string;
  orders: FraterniteesLeadOrder[];
  score: FraterniteesLeadScore;
}

interface PendingNewAccount {
  key: string;
  firstOrder: FraterniteesLeadOrder;
  row: Record<string, unknown>;
}

function normalizeKey(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function customerKey(order: FraterniteesLeadOrder) {
  if (order.externalCustomerId?.trim()) {
    return `printavo_customer:${order.externalCustomerId.trim()}`;
  }

  return `customer_name:${stableHash(normalizeKey(order.customerName))}`;
}

function orderExternalId(order: FraterniteesLeadOrder) {
  if (order.externalOrderId?.trim()) {
    return order.externalOrderId.trim();
  }

  return stableHash([order.customerName, order.orderNumber, order.orderDate, order.status, order.total].join("|"));
}

function earliestDate(orders: FraterniteesLeadOrder[]) {
  const values = orders
    .map((order) => (order.orderDate ? new Date(order.orderDate) : null))
    .filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  return values[0]?.toISOString().slice(0, 10) ?? null;
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? null;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function booleanOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function sourcePayloadToLeadOrder(payload: Record<string, unknown> | null): FraterniteesLeadOrder | null {
  if (!payload) {
    return null;
  }

  const customerName = stringOrNull(payload.customerName);
  if (!customerName) {
    return null;
  }

  return {
    customerName,
    status: stringOrNull(payload.status),
    total: numberOrNull(payload.total),
    orderDate: stringOrNull(payload.orderDate),
    externalOrderId: stringOrNull(payload.externalOrderId),
    externalCustomerId: stringOrNull(payload.externalCustomerId),
    orderNumber: stringOrNull(payload.orderNumber),
    eventName: stringOrNull(payload.eventName),
    contactName: stringOrNull(payload.contactName),
    contactEmail: stringOrNull(payload.contactEmail),
    contactPhone: stringOrNull(payload.contactPhone),
    addressLine1: stringOrNull(payload.addressLine1),
    addressLine2: stringOrNull(payload.addressLine2),
    quantity: numberOrNull(payload.quantity),
    city: stringOrNull(payload.city),
    state: stringOrNull(payload.state),
    postalCode: stringOrNull(payload.postalCode),
    country: stringOrNull(payload.country),
    paidInFull: booleanOrNull(payload.paidInFull),
    amountPaid: numberOrNull(payload.amountPaid),
    amountOutstanding: numberOrNull(payload.amountOutstanding),
    createdAt: stringOrNull(payload.createdAt),
    updatedAt: stringOrNull(payload.updatedAt),
    source: "printavo",
  };
}

function isClosedPaidOrder(order: FraterniteesLeadOrder) {
  return classifyFraterniteesStatus(order.status) === "closed" && order.paidInFull === true;
}

function orderCacheState(order: FraterniteesLeadOrder) {
  return isClosedPaidOrder(order) ? "closed_paid" : "mutable";
}

function mergeOrdersByExternalId(orders: FraterniteesLeadOrder[]) {
  const merged = new Map<string, FraterniteesLeadOrder>();
  for (const order of orders) {
    merged.set(orderExternalId(order), order);
  }

  return [...merged.values()];
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function buildSummaries(orders: FraterniteesLeadOrder[]) {
  const grouped = new Map<string, FraterniteesLeadOrder[]>();

  for (const order of orders) {
    if (!order.customerName.trim()) {
      continue;
    }
    const key = customerKey(order);
    const group = grouped.get(key) ?? [];
    group.push(order);
    grouped.set(key, group);
  }

  return [...grouped.entries()]
    .map(([key, groupOrders]) => {
      const [score] = scoreFraterniteesLeads(groupOrders, { limit: 1 });
      return {
        key,
        name: score?.customerName ?? groupOrders[0].customerName,
        orders: groupOrders,
        score,
      };
    })
    .filter((summary): summary is AccountImportSummary => Boolean(summary.score));
}

async function fetchAccountIdsByKey(supabase: any, input: { organizationId: string; provider: "printavo"; keys: string[] }) {
  const accountIdsByKey = new Map<string, string>();
  if (!input.keys.length) {
    return accountIdsByKey;
  }

  for (const keyChunk of chunk(input.keys, 100)) {
    const { data, error } = await supabase
      .from("account_identity")
      .select("external_id,account_id")
      .eq("organization_id", input.organizationId)
      .eq("provider", input.provider)
      .eq("external_entity_type", "account")
      .in("external_id", keyChunk);

    if (error) {
      throw error;
    }

    for (const row of (data ?? []) as IdentityRow[]) {
      accountIdsByKey.set(row.external_id, row.account_id);
    }
  }

  return accountIdsByKey;
}

async function fetchAccountLocations(supabase: any, accountIds: string[]) {
  const locationsById = new Map<string, AccountLocationRow>();
  if (!accountIds.length) {
    return locationsById;
  }

  for (const accountIdChunk of chunk(accountIds, 100)) {
    const { data, error } = await supabase
      .from("account")
      .select("id,latitude,longitude")
      .in("id", accountIdChunk);

    if (error) {
      throw error;
    }

    for (const row of (data ?? []) as AccountLocationRow[]) {
      locationsById.set(row.id, row);
    }
  }

  return locationsById;
}

async function fetchExistingOrdersByAccount(supabase: any, input: { organizationId: string; provider: "printavo"; accountIds: string[] }) {
  const ordersByAccountId = new Map<string, FraterniteesLeadOrder[]>();
  const cachedClosedPaidOrderIds = new Set<string>();
  if (!input.accountIds.length) {
    return { ordersByAccountId, cachedClosedPaidOrderIds };
  }

  for (const accountIdChunk of chunk(input.accountIds, 100)) {
    const { data, error } = await supabase
      .from("order_record")
      .select("account_id,external_order_id,source_payload")
      .eq("organization_id", input.organizationId)
      .eq("provider", input.provider)
      .in("account_id", accountIdChunk);

    if (error) {
      throw error;
    }

    for (const row of (data ?? []) as ExistingOrderRow[]) {
      const order = sourcePayloadToLeadOrder(row.source_payload);
      if (order && row.account_id) {
        const group = ordersByAccountId.get(row.account_id) ?? [];
        group.push(order);
        ordersByAccountId.set(row.account_id, group);
      }
      if (row.source_payload?.printavoCacheState === "closed_paid") {
        cachedClosedPaidOrderIds.add(row.external_order_id);
      }
    }
  }

  return { ordersByAccountId, cachedClosedPaidOrderIds };
}

function normalizeContactIdentity(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function contactIdentityKey(accountId: string, input: { fullName: string; email: string | null }) {
  const email = input.email?.trim().toLowerCase();
  if (email) {
    return `${accountId}:email:${email}`;
  }

  return `${accountId}:name:${normalizeContactIdentity(input.fullName)}`;
}

function contactNameKey(accountId: string, fullName: string) {
  return `${accountId}:name:${normalizeContactIdentity(fullName)}`;
}

async function fetchExistingContactsByAccount(supabase: any, input: { organizationId: string; accountIds: string[] }) {
  const contactsByKey = new Map<string, ExistingContactRow>();
  if (!input.accountIds.length) {
    return contactsByKey;
  }

  for (const accountIdChunk of chunk(input.accountIds, 100)) {
    const { data, error } = await supabase
      .from("contact")
      .select("id,account_id,full_name,email,phone,custom_fields")
      .eq("organization_id", input.organizationId)
      .in("account_id", accountIdChunk);

    if (error) {
      throw error;
    }

    for (const row of (data ?? []) as ExistingContactRow[]) {
      contactsByKey.set(contactIdentityKey(row.account_id, { fullName: row.full_name, email: row.email }), row);
      contactsByKey.set(contactNameKey(row.account_id, row.full_name), row);
    }
  }

  return contactsByKey;
}

async function upsertFraterniteesContacts(
  supabase: any,
  input: {
    organizationId: string;
    provider: "printavo";
    orders: FraterniteesLeadOrder[];
    accountIdsByKey: Map<string, string>;
  },
) {
  const contactRowsByKey = new Map<string, Record<string, unknown>>();

  for (const order of input.orders) {
    const accountId = input.accountIdsByKey.get(customerKey(order));
    if (!accountId) {
      continue;
    }

    const fullName = firstNonEmpty([order.contactName, order.contactEmail, order.customerName]);
    const email = firstNonEmpty([order.contactEmail]);
    const phone = firstNonEmpty([order.contactPhone]);
    if (!fullName && !email && !phone) {
      continue;
    }

    const normalizedFullName = fullName ?? email ?? phone;
    if (!normalizedFullName) {
      continue;
    }

    const key = contactIdentityKey(accountId, { fullName: normalizedFullName, email });
    const existing = contactRowsByKey.get(key);
    contactRowsByKey.set(key, {
      organization_id: input.organizationId,
      account_id: accountId,
      full_name: existing?.full_name ?? normalizedFullName,
      title: null,
      email: existing?.email ?? email,
      phone: existing?.phone ?? phone,
      role: "Printavo contact",
      custom_fields: {
        ...(typeof existing?.custom_fields === "object" && existing.custom_fields !== null ? existing.custom_fields : {}),
        source: input.provider,
        printavoCustomerId: order.externalCustomerId ?? null,
        lastPrintavoOrderId: order.externalOrderId ?? null,
        lastPrintavoOrderNumber: order.orderNumber ?? null,
      },
      source_payload: {
        provider: input.provider,
        customerName: order.customerName,
        orderNumber: order.orderNumber ?? null,
        externalOrderId: order.externalOrderId ?? null,
      },
      updated_at: new Date().toISOString(),
    });
  }

  const contactRows = [...contactRowsByKey.values()];
  if (!contactRows.length) {
    return 0;
  }

  const existingContactsByKey = await fetchExistingContactsByAccount(supabase, {
    organizationId: input.organizationId,
    accountIds: [...new Set(contactRows.map((row) => String(row.account_id)))],
  });

  const now = new Date().toISOString();
  const existingContactRows: Array<Record<string, unknown>> = [];
  const newContactRows: Array<Record<string, unknown>> = [];

  for (const row of contactRows) {
    const key = contactIdentityKey(String(row.account_id), {
      fullName: String(row.full_name),
      email: typeof row.email === "string" ? row.email : null,
    });
    const existing = existingContactsByKey.get(key) ?? existingContactsByKey.get(contactNameKey(String(row.account_id), String(row.full_name)));
    if (existing) {
      existingContactRows.push({
        ...row,
        id: existing.id,
        email: existing.email ?? row.email,
        phone: existing.phone ?? row.phone,
        custom_fields: {
          ...existing.custom_fields,
          ...(row.custom_fields as Record<string, unknown>),
        },
        updated_at: now,
      });
      continue;
    }

    newContactRows.push({
      ...row,
      created_at: now,
      updated_at: now,
    });
  }

  for (const contactChunk of chunk(existingContactRows, 200)) {
    const { error } = await supabase.from("contact").upsert(contactChunk, {
      onConflict: "id",
    });

    if (error) {
      throw error;
    }
  }

  for (const contactChunk of chunk(newContactRows, 200)) {
    const { error } = await supabase.from("contact").insert(contactChunk);

    if (error) {
      throw error;
    }
  }

  return existingContactRows.length + newContactRows.length;
}

export async function importFraterniteesOrdersToRuntime(input: {
  organizationId: string;
  organizationSlug?: string;
  provider: "printavo";
  orders: FraterniteesLeadOrder[];
  geocodeAccounts?: boolean;
}) {
  const supabase = getSupabaseAdminClient() as any;
  const inputSummaries = buildSummaries(input.orders);
  const keys = inputSummaries.map((summary) => summary.key);
  const accountIdsByKey = await fetchAccountIdsByKey(supabase, {
    organizationId: input.organizationId,
    provider: input.provider,
    keys,
  });
  const existingAccountIds = [...new Set(accountIdsByKey.values())];
  const [accountLocationsById, existingOrders] = await Promise.all([
    fetchAccountLocations(supabase, existingAccountIds),
    fetchExistingOrdersByAccount(supabase, {
      organizationId: input.organizationId,
      provider: input.provider,
      accountIds: existingAccountIds,
    }),
  ]);
  const summaries = inputSummaries.map((summary) => {
    const accountId = accountIdsByKey.get(summary.key);
    const existingAccountOrders = accountId ? existingOrders.ordersByAccountId.get(accountId) ?? [] : [];
    const combinedOrders = mergeOrdersByExternalId([...existingAccountOrders, ...summary.orders]);
    const [score] = scoreFraterniteesLeads(combinedOrders, { limit: 1 });
    return {
      ...summary,
      name: score?.customerName ?? summary.name,
      orders: combinedOrders,
      score,
    };
  }).filter((summary): summary is AccountImportSummary => Boolean(summary.score));
  const geocodingPlan = await resolveGeocodingPlan({
    organizationId: input.organizationId,
    organizationSlug: input.organizationSlug,
  });

  let createdAccounts = 0;
  let updatedAccounts = 0;
  let geocodedAccounts = 0;
  let geocodeAttempts = 0;
  let geocodeLimitReachedAccounts = 0;
  const existingAccountRows: Array<Record<string, unknown>> = [];
  const newAccountRows: PendingNewAccount[] = [];

  for (const summary of summaries) {
    const firstOrder = summary.orders[0];
    const lastOrderDate = summary.score.lastOrderDate;
    const addressLine1 = firstNonEmpty(summary.orders.map((order) => order.addressLine1));
    const addressLine2 = firstNonEmpty(summary.orders.map((order) => order.addressLine2));
    const city = firstNonEmpty(summary.orders.map((order) => order.city));
    const state = firstNonEmpty(summary.orders.map((order) => order.state));
    const postalCode = firstNonEmpty(summary.orders.map((order) => order.postalCode));
    const country = firstNonEmpty(summary.orders.map((order) => order.country));
    const usesFraterniteesHqAddress =
      input.organizationSlug === "fraternitees" &&
      isFraterniteesHqAddress({ addressLine1, addressLine2, city, state, postalCode });
    const noAddressAvailable =
      usesFraterniteesHqAddress ||
      !hasUsableFraterniteesAddress({ addressLine1, city, state, postalCode });
    const effectiveAddressLine1 = usesFraterniteesHqAddress ? null : addressLine1;
    const effectiveAddressLine2 = usesFraterniteesHqAddress ? null : addressLine2;
    const effectiveCity = usesFraterniteesHqAddress ? null : city;
    const effectiveState = usesFraterniteesHqAddress ? null : state;
    const effectivePostalCode = usesFraterniteesHqAddress ? null : postalCode;
    const existingAccountId = accountIdsByKey.get(summary.key);
    const existingLocation = existingAccountId ? accountLocationsById.get(existingAccountId) : null;
    const hasExistingCoordinates = existingLocation?.latitude !== null && existingLocation?.latitude !== undefined && existingLocation.longitude !== null && existingLocation.longitude !== undefined;
    const needsGeocode = input.geocodeAccounts !== false && !hasExistingCoordinates && !noAddressAvailable;
    const shouldGeocode = needsGeocode && geocodeAttempts < geocodingPlan.maxPerSync;
    if (needsGeocode && !shouldGeocode) {
      geocodeLimitReachedAccounts += 1;
    }
    const geocodeResult = shouldGeocode
      ? (geocodeAttempts += 1,
        await geocodeAccountCandidate(
          {
            name: summary.name,
            addressLine1: effectiveAddressLine1,
            addressLine2: effectiveAddressLine2,
            city: effectiveCity,
            state: effectiveState,
            postalCode: effectivePostalCode,
            country,
          },
          geocodingPlan,
        ))
      : null;
    if (geocodeResult) {
      geocodedAccounts += 1;
    }
    const customFields = {
      fraterniteesKey: summary.key,
      leadScore: summary.score.score,
      leadGrade: summary.score.grade,
      leadPriority: summary.score.priority,
      closeRate: summary.score.closeRate,
      closedOrders: summary.score.closedOrders,
      lostOrders: summary.score.lostOrders,
      openOrders: summary.score.openOrders,
      totalOrders: summary.score.totalOrders,
      totalOpportunities: summary.score.totalOpportunities,
      closedRevenue: summary.score.closedRevenue,
      medianClosedOrderValue: summary.score.medianClosedOrderValue,
      averageClosedOrderValue: summary.score.averageClosedOrderValue,
      monthsWithClosedOrdersLast12: summary.score.monthsWithClosedOrdersLast12,
      averageMonthlyClosedRevenueLast12: summary.score.averageMonthlyClosedRevenueLast12,
      maxOrderValue: summary.score.maxOrderValue,
      ghostOrHardLosses: summary.score.ghostOrHardLosses,
      highTicketVolatility: summary.score.highTicketVolatility,
      dncRecommendedUntil: summary.score.dncRecommendedUntil,
      noAddressAvailable,
      addressSuppressedReason: usesFraterniteesHqAddress ? "fraternitees_hq_individual_shipments" : null,
      primaryContactName: firstNonEmpty(summary.orders.map((order) => order.contactName)),
      primaryContactEmail: firstNonEmpty(summary.orders.map((order) => order.contactEmail)),
    };
    const accountPayload = {
      organization_id: input.organizationId,
      name: summary.name,
      display_name: summary.name,
      account_status: summary.score.priority,
      lead_status: `${summary.score.grade} / ${summary.score.score} score / ${summary.score.closedOrders}-${summary.score.lostOrders} closed-lost`,
      address_line_1: effectiveAddressLine1,
      address_line_2: effectiveAddressLine2,
      city: effectiveCity,
      state: effectiveState,
      postal_code: effectivePostalCode,
      country,
      ...(usesFraterniteesHqAddress ? { latitude: null, longitude: null } : {}),
      ...(geocodeResult ? { latitude: geocodeResult.latitude, longitude: geocodeResult.longitude } : {}),
      last_order_date: lastOrderDate,
      customer_since_date: earliestDate(summary.orders),
      external_updated_at: new Date().toISOString(),
      custom_fields: customFields,
      source_payload: {
        provider: input.provider,
        scoreReasons: summary.score.reasons,
        statusMix: summary.score.statusMix,
        geocode: geocodeResult
          ? {
              provider: geocodeResult.provider,
              address: geocodeResult.geocodedAddress,
              tenantScopedKey:
                geocodeResult.provider === "google_maps" && input.organizationSlug
                  ? `${input.organizationSlug.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_GOOGLE_MAPS_SERVER_API_KEY`
                  : null,
              geocodedAt: new Date().toISOString(),
            }
          : null,
        addressSuppressedReason: usesFraterniteesHqAddress ? "fraternitees_hq_individual_shipments" : null,
      },
      updated_at: new Date().toISOString(),
    };

    if (existingAccountId) {
      existingAccountRows.push({ id: existingAccountId, ...accountPayload });
      updatedAccounts += 1;
      continue;
    }

    newAccountRows.push({
      key: summary.key,
      firstOrder,
      row: accountPayload,
    });
  }

  for (const accountChunk of chunk(existingAccountRows, 200)) {
    const { error } = await supabase.from("account").upsert(accountChunk, {
      onConflict: "id",
    });

    if (error) {
      throw error;
    }
  }

  const identityRows: Array<Record<string, unknown>> = [];
  for (const accountChunk of chunk(newAccountRows, 200)) {
    const { data: insertedAccounts, error: insertError } = await supabase
      .from("account")
      .insert(accountChunk.map((entry) => entry.row))
      .select("id,custom_fields");

    if (insertError) {
      throw insertError;
    }

    for (const row of (insertedAccounts ?? []) as Array<{ id: string; custom_fields: Record<string, unknown> | null }>) {
      const key = typeof row.custom_fields?.fraterniteesKey === "string" ? row.custom_fields.fraterniteesKey : null;
      if (key) {
        accountIdsByKey.set(key, String(row.id));
      }
    }

    for (const entry of accountChunk) {
      const accountId = accountIdsByKey.get(entry.key);
      if (!accountId) {
        continue;
      }
      identityRows.push({
        organization_id: input.organizationId,
        account_id: accountId,
        provider: input.provider,
        external_entity_type: "account",
        external_id: entry.key,
        match_method: entry.firstOrder.externalCustomerId ? "printavo_customer_id" : "normalized_customer_name",
        match_confidence: entry.firstOrder.externalCustomerId ? 1 : 0.82,
        metadata: {
          customerName: entry.firstOrder.customerName,
        },
      });
      createdAccounts += 1;
    }
  }

  for (const identityChunk of chunk(identityRows, 200)) {
    const { error } = await supabase.from("account_identity").insert(identityChunk);

    if (error) {
      throw error;
    }
  }

  const upsertedContacts = await upsertFraterniteesContacts(supabase, {
    organizationId: input.organizationId,
    provider: input.provider,
    orders: input.orders,
    accountIdsByKey,
  });

  let skippedClosedPaidOrders = 0;
  const orderRows = input.orders.filter((order) => {
    const externalOrderId = orderExternalId(order);
    const shouldSkip = existingOrders.cachedClosedPaidOrderIds.has(externalOrderId);
    if (shouldSkip) {
      skippedClosedPaidOrders += 1;
    }
    return !shouldSkip;
  }).map((order) => {
    const key = customerKey(order);
    const cacheState = orderCacheState(order);
    return {
      organization_id: input.organizationId,
      account_id: accountIdsByKey.get(key) ?? null,
      provider: input.provider,
      external_order_id: orderExternalId(order),
      order_number: order.orderNumber ?? null,
      licensed_location_name: order.customerName,
      status: order.status ?? null,
      payment_status: order.paidInFull === true ? "PAID" : order.amountPaid && order.amountPaid > 0 ? "PARTIAL_PAYMENT" : "UNPAID",
      order_total: order.total ?? null,
      order_created_at: order.orderDate ? new Date(order.orderDate).toISOString() : null,
      delivery_date: null,
      sales_rep_name: null,
      is_internal_transfer: false,
      source_payload: {
        ...order,
        printavoCacheState: cacheState,
        importedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    };
  });

  let upsertedOrders = 0;
  for (const orderChunk of chunk(orderRows, 200)) {
    const { error } = await supabase.from("order_record").upsert(orderChunk, {
      onConflict: "organization_id,provider,external_order_id",
    });

    if (error) {
      throw error;
    }
    upsertedOrders += orderChunk.length;
  }

  await supabase.from("sync_cursor").upsert(
    {
      organization_id: input.organizationId,
      provider: input.provider,
      scope: "orders_accounts",
      cursor_payload: {
        importedOrders: upsertedOrders,
        importedAccounts: summaries.length,
        importedAt: new Date().toISOString(),
      },
      status: "success",
      last_successful_sync_at: new Date().toISOString(),
      last_attempted_sync_at: new Date().toISOString(),
      last_error: null,
    },
    {
      onConflict: "organization_id,provider,scope",
    },
  );

  return {
    accountsSeen: summaries.length,
    createdAccounts,
    updatedAccounts,
    geocodedAccounts,
    geocodingProvider: geocodingPlan.provider,
    geocodeAttempts,
    geocodeLimitReachedAccounts,
    upsertedContacts,
    upsertedOrders,
    skippedClosedPaidOrders,
  };
}
