import "server-only";

import pricingGuide from "@/tenants/picc/preferred-partner-pricing.json";
import type { AccountContact, AccountRuntimeDetail } from "@/lib/domain/runtime";
import { findRuntimeOrganization, runtimeRestRequest } from "@/lib/application/runtime/runtime-rest";
import { getAccountRuntimeDetail } from "@/lib/application/runtime/account-service";

const DEFAULT_NABIS_API_BASE_URL = "https://platform-api.nabis.pro/v2";
const DEFAULT_NABIS_ORDERS_PATH = "/ny/order";
const DEFAULT_NABIS_PAGE_SIZE = 500;
const DEFAULT_LIVE_SCAN_PAGES = 100;
const NABIS_FETCH_ATTEMPTS = 4;
const CURRENT_YEAR = new Date().getFullYear();
const CANCELLED_STATUSES = new Set(["CANCELED", "CANCELLED", "VOID", "VOIDED", "REJECTED", "REFUNDED"]);
const PRICING_ITEMS = pricingGuide.items as PricingItem[];
const INTERNAL_TRANSFER_ACTIONS = new Set([
  "DROPOFF_TO_NABIS",
  "INTERNAL_TRANSFER",
  "PICKUP_FROM_BRAND",
  "PICKUP_FROM_NABIS",
  "TRANSFER",
]);

interface LocalOrderRow {
  id: string;
  external_order_id: string;
  order_number: string | null;
  licensed_location_id: string | null;
  nabis_retailer_id: string | null;
  status: string | null;
  order_total: number | string | null;
  order_created_at: string | null;
  delivery_date: string | null;
  is_internal_transfer: boolean | null;
  source_payload: Record<string, unknown> | null;
}

interface PricingItem {
  brand: string;
  size: string;
  weight: string;
  standardWholesale: number;
  preferredWholesale: number;
}

interface NabisLine {
  source: "local" | "live";
  externalOrderId: string;
  orderNumber: string | null;
  orderDate: string | null;
  retailerId: string | null;
  licensedLocationId: string | null;
  licenseNumber: string | null;
  status: string | null;
  orderAction: string | null;
  isInternalTransfer: boolean;
  isSample: boolean;
  lineItemId: string | null;
  skuCode: string | null;
  skuName: string | null;
  brandName: string | null;
  strain: string | null;
  units: number;
  paidUnitPrice: number | null;
  paidSubtotal: number | null;
  orderTotal: number | null;
}

export interface PppSavingsLine {
  skuCode: string | null;
  skuName: string | null;
  brand: string;
  size: string;
  units: number;
  paidUnitPrice: number | null;
  paidSubtotal: number;
  standardUnitPrice: number;
  standardSubtotal: number;
  preferredUnitPrice: number;
  preferredSubtotal: number;
  savings: number;
  discountFromPromo: number;
  discountFromStandard: number;
  pricingLabel: string;
}

export interface PppDiscountBreakdownRow {
  brand: string;
  size: string;
  quantity: number | null;
  standardWholesale: number;
  currentPromoPrice: number | null;
  pppPrice: number;
  standardWholesaleTotal: number | null;
  currentPromoTotal: number | null;
  pppPricingTotal: number | null;
}

export interface PppSavingsOrder {
  externalOrderId: string;
  orderNumber: string;
  orderDate: string | null;
  invoiceTotal: number;
  paidTotal: number;
  standardTotal: number;
  preferredTotal: number;
  savings: number;
  discountFromPromo: number;
  discountFromStandard: number;
  lines: PppSavingsLine[];
  breakdownRows: PppDiscountBreakdownRow[];
  unmatchedLineItems: number;
}

export interface PppSavingsReport {
  accountId: string;
  accountName: string;
  year: number;
  recipientName: string;
  recipientEmail: string | null;
  totalSavings: number;
  paidTotal: number;
  standardTotal: number;
  preferredTotal: number;
  discountFromStandard: number;
  orders: PppSavingsOrder[];
  email: {
    subject: string;
    body: string;
    html: string;
  };
  diagnostics: {
    source: string;
    localOrdersScanned: number;
    livePagesScanned: number;
    liveRowsMatched: number;
    unmatchedLineItems: number;
    skippedLineItems: number;
    localCurrentYearOrders: number;
    missingLineItemOrders: number;
    pricingSource: string;
    warnings: string[];
  };
}

interface AccountIdentifiers {
  nabisRetailerIds: Set<string>;
  licensedLocationIds: Set<string>;
  licenseNumbers: Set<string>;
  normalizedAccountNames: Set<string>;
}

function compactString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function normalizeIdentity(value: unknown) {
  return compactString(value)?.toUpperCase() ?? null;
}

function normalizeSearchText(value: unknown) {
  return compactString(value)
    ?.toLowerCase()
    .replace(/&/g, " and ")
    .replace(/#/g, " number ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";
}

function cents(value: number) {
  return Math.round(value * 100) / 100;
}

function pricingDisplayName(pricing: PricingItem) {
  if (pricing.brand === "Chopsticks") {
    return "Chopsticks 2-Pk";
  }
  if (pricing.brand === "Ichi-Roll") {
    return pricing.size === "4-Pack" ? "Ichi Pack" : "Ichi Single";
  }
  if (pricing.brand === "#Juan-Roll") {
    return pricing.size === "4-Pack" ? "#Juan Pack" : "#Juan Single";
  }
  if (pricing.brand === "Smack.") {
    return pricing.size === "Mini" ? "SMACK Mini Single" : "SMACK Single";
  }
  if (pricing.brand === "O-Yeah") {
    return pricing.size === "5-Pack" ? "O-Yeah Pack" : "O-Yeah Single";
  }
  if (pricing.brand === "State of Mind") {
    return pricing.size === "5-Pack" ? "State of Mind Pack" : "State of Mind Single";
  }
  if (pricing.brand === "Sushi Hash") {
    return pricing.size === "5-Pack" ? "Sushi Hash Pack" : "Sushi Hash Single";
  }
  return `${pricing.brand} ${pricing.size}`;
}

function pricingKey(value: Pick<PricingItem, "brand" | "weight">) {
  return `${value.brand}:${value.weight}`;
}

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseDate(value: unknown) {
  const text = compactString(value);
  if (!text) {
    return null;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function recordDate(value: Record<string, unknown>) {
  const parsed = parseDate(value.createdTimestamp ?? value.createdDate ?? value.orderCreatedAt ?? value.deliveryDate);
  return parsed ? new Date(parsed) : null;
}

function pageReachedBeforeYear(records: Record<string, unknown>[], year: number) {
  const yearStart = Date.UTC(year, 0, 1);
  return records.some((record) => {
    const date = recordDate(record);
    return date ? date.getTime() < yearStart : false;
  });
}

function getRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function getString(record: Record<string, unknown> | null, key: string) {
  return record ? compactString(record[key]) : null;
}

function getNumber(record: Record<string, unknown> | null, key: string) {
  return record ? parseMoney(record[key]) : null;
}

function getBoolean(record: Record<string, unknown> | null, key: string) {
  return record ? record[key] === true || String(record[key]).toLowerCase() === "true" : false;
}

function firstString(record: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = getString(record, key);
    if (value) {
      return value;
    }
  }
  return null;
}

function firstNumber(record: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = getNumber(record, key);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function extractArray(value: unknown) {
  return Array.isArray(value) ? value.map(getRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry)) : [];
}

function orderKey(line: NabisLine) {
  return line.externalOrderId || line.orderNumber || "unknown-order";
}

function lineKey(line: NabisLine) {
  return [
    orderKey(line),
    line.lineItemId ?? line.skuCode ?? line.skuName ?? "unknown-sku",
    line.units,
  ].join(":");
}

function isCancelledStatus(status: string | null) {
  return CANCELLED_STATUSES.has(String(status ?? "").trim().toUpperCase());
}

function isInternalTransferAction(action: string | null) {
  return INTERNAL_TRANSFER_ACTIONS.has(String(action ?? "").trim().toUpperCase());
}

function isInYear(value: string | null, year: number) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getUTCFullYear() === year;
}

function lineIsInYear(line: NabisLine, year: number) {
  return isInYear(line.orderDate, year);
}

function derivePaidSubtotal(lineRecord: Record<string, unknown> | null, units: number, source: NabisLine["source"]) {
  const subtotalKeys =
    source === "local"
      ? ["taxInclusiveLineItemSubtotal", "lineItemSubtotalAfterDiscount"]
      : ["taxInclusiveLineItemSubtotal", "lineItemSubtotalAfterDiscount", "lineItemSubtotal", "skuTotalPrice", "wholesaleValue"];
  const subtotal = firstNumber(lineRecord, subtotalKeys);
  if (subtotal !== null) {
    return subtotal;
  }

  if (source === "local") {
    return null;
  }

  const unitPrice = firstNumber(lineRecord, [
    "lineItemPricePerUnitAfterDiscount",
    "pricePerUnit",
    "skuPricePerUnit",
    "standardPricePerUnit",
  ]);
  return unitPrice !== null ? unitPrice * units : null;
}

function derivePaidUnitPrice(lineRecord: Record<string, unknown> | null, paidSubtotal: number | null, units: number) {
  if (paidSubtotal !== null && units > 0) {
    return paidSubtotal / units;
  }

  const explicit = firstNumber(lineRecord, [
    "lineItemPricePerUnitAfterDiscount",
    "pricePerUnit",
    "skuPricePerUnit",
    "standardPricePerUnit",
  ]);
  if (explicit !== null) {
    return explicit;
  }
  return null;
}

function isSampleLineRecord(record: Record<string, unknown>) {
  const text = normalizeSearchText([record.skuCode, record.skuName, record.skuDisplayName, record.product, record.title].filter(Boolean).join(" "));
  return (
    getBoolean(record, "sample") ||
    getBoolean(record, "isSampleDemo") ||
    getBoolean(record, "lineItemIsSample") ||
    text.includes("sample") ||
    text.includes("demo") ||
    text.includes("dummy") ||
    text.includes("display")
  );
}

function buildIdentifiers(detail: AccountRuntimeDetail): AccountIdentifiers {
  const identifiers: AccountIdentifiers = {
    nabisRetailerIds: new Set<string>(),
    licensedLocationIds: new Set<string>(),
    licenseNumbers: new Set<string>(),
    normalizedAccountNames: new Set<string>(),
  };

  const addIdentity = (set: Set<string>, value: unknown) => {
    const normalized = normalizeIdentity(value);
    if (normalized) {
      set.add(normalized);
    }
  };

  addIdentity(identifiers.licensedLocationIds, detail.account.licensedLocationId);
  addIdentity(identifiers.licenseNumbers, detail.account.licenseNumber);
  addIdentity(identifiers.nabisRetailerIds, detail.account.customFields.nabisRetailerId);

  for (const identity of detail.identities) {
    if (identity.provider === "nabis") {
      addIdentity(identifiers.nabisRetailerIds, identity.externalId);
    }
    const identityType = normalizeSearchText(identity.metadata.identityType ?? identity.externalEntityType);
    if (identityType.includes("licensed location")) {
      addIdentity(identifiers.licensedLocationIds, identity.externalId);
    }
  }

  const accountName = normalizeSearchText(detail.account.name);
  if (accountName) {
    identifiers.normalizedAccountNames.add(accountName);
  }

  return identifiers;
}

function accountMatchesNabisRecord(record: Record<string, unknown>, identifiers: AccountIdentifiers) {
  const retailerId = normalizeIdentity(record.retailerId ?? record.externalRetailerId);
  const licensedLocationId = normalizeIdentity(record.licensedLocationId);
  const licenseNumber = normalizeIdentity(record.siteLicenseNumber);
  const retailerName = normalizeSearchText(record.retailer ?? record.licensedLocationName ?? record.retailerParentOrganization);

  return Boolean(
    (retailerId && identifiers.nabisRetailerIds.has(retailerId)) ||
      (licensedLocationId && identifiers.licensedLocationIds.has(licensedLocationId)) ||
      (licenseNumber && identifiers.licenseNumbers.has(licenseNumber)) ||
      (retailerName && identifiers.normalizedAccountNames.has(retailerName)),
  );
}

function lineFromNabisRecord(record: Record<string, unknown>, source: NabisLine["source"]): NabisLine | null {
  const externalOrderId = firstString(record, ["id", "orderId", "order", "orderNumber"]);
  if (!externalOrderId) {
    return null;
  }

  const units = firstNumber(record, ["units", "quantity", "qty"]) ?? 0;
  const paidSubtotal = derivePaidSubtotal(record, units, source);
  const paidUnitPrice = derivePaidUnitPrice(record, paidSubtotal, units);
  const orderDate = parseDate(record.createdTimestamp ?? record.createdDate ?? record.orderCreatedAt ?? record.deliveryDate);
  const orderAction = firstString(record, ["orderAction", "action"]);

  return {
    source,
    externalOrderId,
    orderNumber: firstString(record, ["orderNumber", "order", "orderName", "posoNumber"]),
    orderDate,
    retailerId: firstString(record, ["retailerId", "externalRetailerId"]),
    licensedLocationId: firstString(record, ["licensedLocationId"]),
    licenseNumber: firstString(record, ["siteLicenseNumber"]),
    status: firstString(record, ["status", "paymentStatus"]),
    orderAction,
    isInternalTransfer: isInternalTransferAction(orderAction),
    isSample: isSampleLineRecord(record),
    lineItemId: firstString(record, ["lineItemId", "skuBatchId"]),
    skuCode: firstString(record, ["skuCode"]),
    skuName: firstString(record, ["skuName", "skuDisplayName", "product", "title"]),
    brandName: firstString(record, ["brandName", "brand"]),
    strain: firstString(record, ["strain"]),
    units,
    paidUnitPrice,
    paidSubtotal,
    orderTotal: firstNumber(record, ["orderTotal"]),
  };
}

function linesFromLocalOrder(row: LocalOrderRow): NabisLine[] {
  const payload = getRecord(row.source_payload);
  const nabis = getRecord(payload?.nabis);
  const order = getRecord(nabis?.order) ?? {};
  const lineItems = extractArray(nabis?.lineItems);
  const sourceLines = lineItems.length ? lineItems : [order];

  return sourceLines
    .map((lineItem) => {
      const lineSampleFlag = lineItem.sample ?? lineItem.isSampleDemo ?? lineItem.lineItemIsSample ?? false;
      const merged: Record<string, unknown> = {
        id: row.external_order_id,
        order: row.order_number ?? order.order ?? row.external_order_id,
        orderNumber: row.order_number ?? order.orderNumber,
        createdTimestamp: row.order_created_at ?? order.createdTimestamp,
        createdDate: order.createdDate,
        deliveryDate: row.delivery_date ?? order.deliveryDate,
        retailerId: row.nabis_retailer_id ?? order.retailerId,
        externalRetailerId: order.externalRetailerId,
        licensedLocationId: row.licensed_location_id ?? order.licensedLocationId,
        siteLicenseNumber: order.siteLicenseNumber,
        status: row.status ?? order.status,
        paymentStatus: order.paymentStatus,
        orderAction: order.orderAction,
        action: order.action,
        orderTotal: row.order_total ?? order.orderTotal,
        lineItemId: lineItem.lineItemId,
        skuBatchId: lineItem.skuBatchId,
        skuCode: lineItem.skuCode,
        skuName: lineItem.skuName,
        skuDisplayName: lineItem.skuDisplayName,
        product: lineItem.product,
        title: lineItem.title,
        brandName: lineItem.brandName,
        brand: lineItem.brand,
        strain: lineItem.strain,
        units: lineItem.units,
        quantity: lineItem.quantity,
        qty: lineItem.qty,
        lineItemSubtotalAfterDiscount: lineItem.lineItemSubtotalAfterDiscount,
        lineItemSubtotal: lineItem.lineItemSubtotal,
        taxInclusiveLineItemSubtotal: lineItem.taxInclusiveLineItemSubtotal,
        skuTotalPrice: lineItem.skuTotalPrice,
        wholesaleValue: lineItem.wholesaleValue,
        lineItemPricePerUnitAfterDiscount: lineItem.lineItemPricePerUnitAfterDiscount,
        pricePerUnit: lineItem.pricePerUnit,
        skuPricePerUnit: lineItem.skuPricePerUnit,
        standardPricePerUnit: lineItem.standardPricePerUnit,
        isSampleDemo: lineSampleFlag,
        lineItemIsSample: lineSampleFlag,
        sample: lineSampleFlag,
      };
      const line = lineFromNabisRecord(merged, "local");
      return line
        ? {
            ...line,
            isInternalTransfer: Boolean(row.is_internal_transfer) || line.isInternalTransfer,
          }
        : null;
    })
    .filter((line): line is NabisLine => Boolean(line));
}

async function fetchLocalOrders(organizationId: string, accountId: string) {
  const params = new URLSearchParams({
    organization_id: `eq.${organizationId}`,
    account_id: `eq.${accountId}`,
    select:
      "id,external_order_id,order_number,licensed_location_id,nabis_retailer_id,status,order_total,order_created_at,delivery_date,is_internal_transfer,source_payload",
    order: "order_created_at.desc.nullslast",
    limit: "1000",
  });
  const { data } = await runtimeRestRequest<LocalOrderRow[]>("order_record", params);
  return data;
}

async function fetchNabisPage(url: URL, apiKey: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= NABIS_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "map-app-ppp-savings/0.1",
          "x-nabis-access-token": apiKey,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(45_000),
      });

      if (response.status !== 429 && (response.status < 500 || attempt === NABIS_FETCH_ATTEMPTS)) {
        return response;
      }

      const retryAfter = Number(response.headers.get("retry-after"));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * attempt * 1500;
      await delay(backoff);
    } catch (error) {
      lastError = error;
      if (attempt === NABIS_FETCH_ATTEMPTS) {
        throw error;
      }
      await delay(attempt * attempt * 1500);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Nabis order scan failed.");
}

async function fetchLiveNabisRows(identifiers: AccountIdentifiers, year: number, targetOrderKeyGroups: string[][]) {
  const apiKey = process.env.NABIS_API_KEY?.trim();
  if (!apiKey) {
    return {
      rows: [] as Record<string, unknown>[],
      pagesScanned: 0,
      warning: "NABIS_API_KEY is not configured; used stored Nabis payloads only.",
    };
  }

  const pageLimit = Number.parseInt(process.env.NABIS_PPP_LIVE_SCAN_PAGES ?? "", 10);
  const maxPages = Number.isFinite(pageLimit) && pageLimit >= 0 ? pageLimit : DEFAULT_LIVE_SCAN_PAGES;
  if (maxPages === 0) {
    return {
      rows: [] as Record<string, unknown>[],
      pagesScanned: 0,
      warning: "Live Nabis scan disabled by NABIS_PPP_LIVE_SCAN_PAGES=0.",
    };
  }

  const baseUrl = (process.env.NABIS_API_BASE_URL?.trim() || DEFAULT_NABIS_API_BASE_URL).replace(/\/$/, "");
  const ordersPath = process.env.NABIS_ORDERS_PATH?.trim() || DEFAULT_NABIS_ORDERS_PATH;
  const path = ordersPath.startsWith("/") ? ordersPath : `/${ordersPath}`;
  const pageSize = Number.parseInt(process.env.NABIS_PPP_PAGE_SIZE ?? "", 10);
  const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_NABIS_PAGE_SIZE;
  const rows: Record<string, unknown>[] = [];
  const matchedTargetOrderKeys = new Set<string>();
  let pagesScanned = 0;
  let stoppedAtYearBoundary = false;

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    const response = await fetchNabisPage(url, apiKey);
    pagesScanned += 1;

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Nabis order scan failed with ${response.status}: ${body.slice(0, 240)}`);
    }

    const payload = (await response.json()) as unknown;
    const payloadRecord = getRecord(payload);
    const pageRows = Array.isArray(payloadRecord?.data) ? payloadRecord.data : Array.isArray(payload) ? payload : [];
    const records = pageRows.map(getRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));
    const matchedRecords = records.filter((record) => accountMatchesNabisRecord(record, identifiers));
    rows.push(...matchedRecords);
    for (const record of matchedRecords) {
      for (const key of normalizedNabisRecordOrderKeys(record)) {
        if (targetOrderKeyGroups.some((group) => group.includes(key))) {
          matchedTargetOrderKeys.add(key);
        }
      }
    }

    const nextPage = typeof payloadRecord?.nextPage === "number" ? payloadRecord.nextPage : null;
    stoppedAtYearBoundary = pageReachedBeforeYear(records, year);
    if (!records.length || nextPage === null || nextPage <= page) {
      break;
    }
    if (stoppedAtYearBoundary) {
      break;
    }
    if (targetOrderKeyGroups.length > 0 && targetOrderKeyGroups.every((group) => group.some((key) => matchedTargetOrderKeys.has(key)))) {
      break;
    }
  }

  const hitPageCap = pagesScanned >= maxPages && !stoppedAtYearBoundary;
  return {
    rows,
    pagesScanned,
    warning: hitPageCap
      ? `Live Nabis scan reached ${maxPages} pages before passing ${year} order data. Increase NABIS_PPP_LIVE_SCAN_PAGES if this retailer has older ${year} orders beyond that window.`
      : null,
  };
}

function matchPricing(line: NabisLine) {
  const skuCode = normalizeSearchText(line.skuCode);
  const skuName = normalizeSearchText(line.skuName);
  const combined = `${skuCode} ${skuName}`;

  const hasAny = (values: string[]) => values.some((value) => combined.includes(value));
  const item = (brand: string, size: string) => PRICING_ITEMS.find((entry) => entry.brand === brand && entry.size === size) ?? null;

  if (hasAny(["chopsticks", "c 2pk", "c 2 pk"])) {
    return item("Chopsticks", "2 (.5g)");
  }
  if (hasAny(["ichi roll", "ichiroll", "ir 4pk", "ir 4 pk"])) {
    return hasAny(["4 pack", "4pack", "4 pk", "4pk"]) ? item("Ichi-Roll", "4-Pack") : item("Ichi-Roll", "Single");
  }
  if (hasAny(["juan roll", "juanroll", "jr 4pk", "jr 4 pk", "njr 1g", "njr 4pk", "njr 4 pk", "number juan"])) {
    return hasAny(["4 pack", "4pack", "4 pk", "4pk"]) ? item("#Juan-Roll", "4-Pack") : item("#Juan-Roll", "Single");
  }
  if (hasAny(["smack", "s 5g", "s 1g"])) {
    return hasAny([" 5g ", " 0 5g ", "mini", "s 5g", "s 5 g", " 5g single"]) ? item("Smack.", "Mini") : item("Smack.", "Single");
  }
  if (hasAny(["o yeah", "oy 5pk", "oy 5 pk", "oy 1g"])) {
    return hasAny(["5 pack", "5pack", "5 pk", "5pk"]) ? item("O-Yeah", "5-Pack") : item("O-Yeah", "Single");
  }
  if (hasAny(["state of mind", "som 5pk", "som 5 pk", "som 1g"])) {
    return hasAny(["5 pack", "5pack", "5 pk", "5pk"]) ? item("State of Mind", "5-Pack") : item("State of Mind", "Single");
  }
  if (hasAny(["sushi hash", "hash hole", "sh 5pk", "sh 5 pk", "sh 1g"])) {
    return hasAny(["5 pack", "5pack", "5 pk", "5pk"]) ? item("Sushi Hash", "5-Pack") : item("Sushi Hash", "Single");
  }

  return null;
}

function buildBreakdownRows(calculatedLines: PppSavingsLine[]) {
  const lineTotalsByPricing = new Map<string, { quantity: number; currentPromoTotal: number }>();

  for (const line of calculatedLines) {
    const key = pricingKey({ brand: line.brand, weight: line.size });
    const current = lineTotalsByPricing.get(key) ?? { quantity: 0, currentPromoTotal: 0 };
    current.quantity += line.units;
    current.currentPromoTotal += line.paidSubtotal;
    lineTotalsByPricing.set(key, current);
  }

  return PRICING_ITEMS.map((pricing) => {
    const brand = pricingDisplayName(pricing);
    const size = pricing.weight;
    const current = lineTotalsByPricing.get(pricingKey({ brand, weight: size })) ?? { quantity: 0, currentPromoTotal: 0 };
    const quantity = current.quantity;
    const currentPromoTotal = cents(current.currentPromoTotal);
    const standardWholesaleTotal = cents(pricing.standardWholesale * quantity);
    const pppPricingTotal = cents(pricing.preferredWholesale * quantity);

    return {
      brand,
      size,
      quantity: quantity > 0 ? quantity : null,
      standardWholesale: pricing.standardWholesale,
      currentPromoPrice: quantity > 0 ? cents(currentPromoTotal / quantity) : null,
      pppPrice: pricing.preferredWholesale,
      standardWholesaleTotal: quantity > 0 ? standardWholesaleTotal : null,
      currentPromoTotal: quantity > 0 ? currentPromoTotal : null,
      pppPricingTotal: quantity > 0 ? pppPricingTotal : null,
    } satisfies PppDiscountBreakdownRow;
  });
}

function buildSavingsLine(line: NabisLine): PppSavingsLine | null {
  if (line.isSample || line.units <= 0 || line.paidSubtotal === null || line.paidSubtotal <= 0) {
    return null;
  }

  const pricing = matchPricing(line);
  if (!pricing) {
    return null;
  }

  const preferredSubtotal = cents(pricing.preferredWholesale * line.units);
  const paidSubtotal = cents(line.paidSubtotal);
  const standardSubtotal = cents(pricing.standardWholesale * line.units);
  const paidUnitPrice = cents(paidSubtotal / line.units);
  const discountFromPromo = cents(Math.max(0, paidSubtotal - preferredSubtotal));
  const discountFromStandard = cents(Math.max(0, standardSubtotal - preferredSubtotal));
  const brand = pricingDisplayName(pricing);
  return {
    skuCode: line.skuCode,
    skuName: line.skuName,
    brand,
    size: pricing.weight,
    units: line.units,
    paidUnitPrice,
    paidSubtotal,
    standardUnitPrice: pricing.standardWholesale,
    standardSubtotal,
    preferredUnitPrice: pricing.preferredWholesale,
    preferredSubtotal,
    savings: discountFromPromo,
    discountFromPromo,
    discountFromStandard,
    pricingLabel: `${brand} ${pricing.weight}`,
  };
}

function selectPrimaryContact(contacts: AccountContact[]) {
  const preferred =
    contacts.find((contact) => /primary|buyer|owner|manager/i.test([contact.role, contact.title].filter(Boolean).join(" "))) ??
    contacts.find((contact) => contact.email) ??
    contacts[0] ??
    null;

  return {
    name: preferred?.fullName ?? "there",
    email: preferred?.email ?? null,
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailBody(input: {
  recipientName: string;
  year: number;
  totalSavings: number;
  orders: PppSavingsOrder[];
  isPartial: boolean;
}) {
  const plainOrderBreakdown = input.orders
    .map(
      (order) => `Order #${order.orderNumber} | Order Total = ${formatMoney(order.invoiceTotal)}
Estimated Total with PPP Pricing: ${formatMoney(order.preferredTotal)}
Missed Savings (Discount Eligible with PPP Pricing) = ${formatMoney(order.discountFromPromo)}
PPP Discount Amount (Based on Standard Wholesale Pricing) = ${formatMoney(order.discountFromStandard)}`,
    )
    .join("\n\n");
  const htmlOrderBreakdown = input.orders
    .map(
      (order) => `<p style="margin:22px 0 0 0; line-height:1.35;"><strong>Order #${escapeHtml(order.orderNumber)}</strong> | <strong>Order Total</strong> = ${formatMoney(order.invoiceTotal)}<br />
<strong>Estimated Total with PPP Pricing:</strong> ${formatMoney(order.preferredTotal)}<br />
<span style="background:#20ff00; font-weight:700;">Missed Savings <em>(Discount Eligible with PPP Pricing)</em> = ${formatMoney(order.discountFromPromo)}</span><br />
<span style="background:#20ff00; font-weight:700;">PPP Discount Amount <em>(Based on Standard Wholesale Pricing)</em> = ${formatMoney(order.discountFromStandard)}</span></p>`,
    )
    .join("");

  const senderName = process.env.PPP_EMAIL_SENDER_NAME?.trim() || "{Your Name}";
  const senderTitle = process.env.PPP_EMAIL_SENDER_TITLE?.trim() || "{Title}";
  const senderPhone = process.env.PPP_EMAIL_SENDER_PHONE?.trim() || "{Phone}";

  const scopeLine = input.isPartial
    ? `I ran a quick report on the ${input.year} orders I could match to invoice line items, and you've missed out on roughly ${formatMoney(input.totalSavings)} in savings so far this year by not being on our PICC Preferred Partners Program (PPP).`
    : `I ran a quick report on your ${input.year} orders, and you've missed out on roughly ${formatMoney(input.totalSavings)} in savings so far this year by not being on our PICC Preferred Partners Program (PPP).`;
  const breakdownHeader = input.isPartial
    ? `Your ${input.year} missed PICC Preferred Partner savings from matched invoices:`
    : `Your ${input.year} missed PICC Preferred Partner savings (examples):`;

  const note =
    "Note: These figures are estimates based on recent order data from your Orders via Nabis Marketplace, and may be subject to slight inaccuracies or edge cases. Happy to provide a detailed breakdown on request.";

  const body = `Hi ${input.recipientName},

${scopeLine}

Here's the breakdown:

${breakdownHeader}
${note}

${plainOrderBreakdown || "No eligible paid PICC orders were found for this year."}

Every additional order without becoming a PICC Preferred Partner means more money left on the table. PPP is completely free and built to make reorders easier and reduce risk:
 - No Overstock Guarantee (you won't get stuck with product that doesn't move)
 - Personalized reorder proposals based on your sales data via Headset
 - 20% off standard wholesale pricing on every order

One Important Note: Our temporary promotional pricing on Nabis Marketplace is ending soon and prices will return to standard wholesale. Preferred Partners will continue receiving 20% off our standard wholesale - non-PPP accounts will not.

If you want, I can get you set up in 5-10 minutes and apply PPP pricing to your next reorder so the missed savings stop here.

Best next step: Reply "YES" + the best number to reach you. Also tell me the best time to reach out, and we'll get you onboarded in 5-10 minutes.

Best,
${senderName}
${senderTitle} | PICC Platform
${senderPhone}`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; color:#111; font-size:14px; line-height:1.45;">
<p style="margin:0 0 18px 0;">Hi ${escapeHtml(input.recipientName)},</p>
<p style="margin:0 0 18px 0;">I ran a quick report on your ${input.year} orders, and <strong><u>you've missed out on roughly ${formatMoney(input.totalSavings)} in savings so far this year</u></strong> by not being on our PICC Preferred Partners Program (PPP).</p>
<p style="margin:0 0 20px 0; font-size:18px; font-weight:700;">Here's the breakdown:</p>
<p style="margin:0 0 4px 0;"><strong><u>${escapeHtml(breakdownHeader)}</u></strong></p>
<p style="margin:0 0 18px 0; font-size:11px; font-style:italic;">${escapeHtml(note)}</p>
${htmlOrderBreakdown || `<p style="margin:22px 0 0 0;">No eligible paid PICC orders were found for this year.</p>`}
<p style="margin:24px 0 10px 0;">Every additional order without becoming a PICC Preferred Partner means more money left on the table. PPP is completely free and built to make reorders easier and reduce risk:</p>
<p style="margin:0 0 3px 24px;">&bull; <strong>No Overstock Guarantee</strong> (you won't get stuck with product that doesn't move)</p>
<p style="margin:0 0 3px 24px;">&bull; <strong>Personalized reorder proposals</strong> based on your sales data via Headset</p>
<p style="margin:0 0 16px 24px;">&bull; <strong>20% off standard wholesale pricing</strong> on <u>every order</u></p>
<p style="margin:0 0 18px 0;"><strong>One Important Note:</strong> <em>Our temporary promotional pricing on Nabis Marketplace is ending soon and prices will return to standard wholesale. Preferred Partners will continue receiving 20% off our standard wholesale - non-PPP accounts will not.</em></p>
<p style="margin:0 0 18px 0;"><strong>If you want, I can get you set up in 5-10 minutes and apply PPP pricing to your next reorder so the missed savings stop here.</strong></p>
<p style="margin:0 0 18px 0;"><strong>Best next step:</strong> Reply "YES" + the best number to reach you. Also tell me the best time to reach out, and we'll get you onboarded in 5-10 minutes.</p>
<p style="margin:0;">Best,</p>
<p style="margin:16px 0 0 0;">${escapeHtml(senderName)}<br />${escapeHtml(senderTitle)} | PICC Platform<br />${escapeHtml(senderPhone)}</p>
</div>`;

  return { body, html };
}

function buildOrders(lines: NabisLine[], year: number) {
  const reportableLineMap = new Map<string, NabisLine>();
  let skippedLineItems = 0;
  for (const line of lines) {
    if (
      !lineIsInYear(line, year) ||
      line.isInternalTransfer ||
      isInternalTransferAction(line.orderAction) ||
      isCancelledStatus(line.status)
    ) {
      continue;
    }
    reportableLineMap.set(lineKey(line), line);
  }

  const lineMap = new Map<string, NabisLine>();
  for (const line of reportableLineMap.values()) {
    if (line.isSample || line.units <= 0 || line.paidSubtotal === null || line.paidSubtotal <= 0) {
      skippedLineItems += 1;
      continue;
    }
    lineMap.set(lineKey(line), line);
  }

  const grouped = new Map<string, NabisLine[]>();
  for (const line of lineMap.values()) {
    const key = orderKey(line);
    const group = grouped.get(key) ?? [];
    group.push(line);
    grouped.set(key, group);
  }

  let unmatchedLineItems = 0;
  const orders = [...grouped.entries()].map(([externalOrderId, orderLines]) => {
    const calculatedLines: PppSavingsLine[] = [];
    for (const line of orderLines) {
      const calculated = buildSavingsLine(line);
      if (calculated) {
        calculatedLines.push(calculated);
      } else if (line.units <= 0 || line.paidSubtotal === null || line.paidSubtotal <= 0) {
        skippedLineItems += 1;
      } else {
        unmatchedLineItems += 1;
      }
    }

    const first = orderLines[0];
    const paidTotal = cents(calculatedLines.reduce((sum, line) => sum + line.paidSubtotal, 0));
    const standardTotal = cents(calculatedLines.reduce((sum, line) => sum + line.standardSubtotal, 0));
    const preferredTotal = cents(calculatedLines.reduce((sum, line) => sum + line.preferredSubtotal, 0));
    const discountFromPromo = cents(Math.max(0, paidTotal - preferredTotal));
    const discountFromStandard = cents(Math.max(0, standardTotal - preferredTotal));
    const invoiceTotal = first?.orderTotal !== null && first?.orderTotal !== undefined ? cents(first.orderTotal) : paidTotal;

    return {
      externalOrderId,
      orderNumber: first?.orderNumber ?? externalOrderId,
      orderDate: first?.orderDate ?? null,
      invoiceTotal,
      paidTotal,
      standardTotal,
      preferredTotal,
      savings: discountFromPromo,
      discountFromPromo,
      discountFromStandard,
      lines: calculatedLines,
      breakdownRows: buildBreakdownRows(calculatedLines),
      unmatchedLineItems: Math.max(0, orderLines.length - calculatedLines.length),
    } satisfies PppSavingsOrder;
  });

  return {
    orders: orders
      .filter((order) => order.lines.length > 0 && order.paidTotal > 0)
      .sort((left, right) => String(left.orderDate ?? "").localeCompare(String(right.orderDate ?? ""))),
    unmatchedLineItems,
    skippedLineItems,
  };
}

function isReportableLocalOrder(row: LocalOrderRow, year: number) {
  return Boolean(
    isInYear(row.order_created_at, year) &&
      !row.is_internal_transfer &&
      !isCancelledStatus(row.status) &&
      (row.order_total === null || (parseMoney(row.order_total) ?? 0) > 0),
  );
}

function isCurrentYearLocalOrder(row: LocalOrderRow, year: number) {
  return Boolean(isInYear(row.order_created_at, year) && !row.is_internal_transfer && !isCancelledStatus(row.status));
}

function normalizedOrderKeys(order: { externalOrderId?: string | null; orderNumber?: string | null }) {
  return [normalizeIdentity(order.externalOrderId), normalizeIdentity(order.orderNumber)].filter((value): value is string => Boolean(value));
}

function normalizedNabisRecordOrderKeys(record: Record<string, unknown>) {
  return [
    normalizeIdentity(record.id),
    normalizeIdentity(record.orderId),
    normalizeIdentity(record.order),
    normalizeIdentity(record.orderNumber),
    normalizeIdentity(record.orderName),
    normalizeIdentity(record.posoNumber),
  ].filter((value): value is string => Boolean(value));
}

export async function calculatePppSavingsReport(slug: string, accountId: string, year = CURRENT_YEAR) {
  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }

  const detail = await getAccountRuntimeDetail(slug, accountId);
  if (!detail) {
    return null;
  }

  const identifiers = buildIdentifiers(detail);
  const localOrders = await fetchLocalOrders(organization.id, accountId);
  const localCurrentYearNabisOrders = localOrders.filter((row) => isCurrentYearLocalOrder(row, year));
  const localCurrentYearOrderKeyGroups = localCurrentYearNabisOrders
    .map((row) =>
      normalizedOrderKeys({
        externalOrderId: row.external_order_id,
        orderNumber: row.order_number,
      }),
    )
    .filter((keys) => keys.length > 0);
  const warnings: string[] = [];
  let liveRows: Record<string, unknown>[] = [];
  let livePagesScanned = 0;

  try {
    const liveResult = await fetchLiveNabisRows(identifiers, year, localCurrentYearOrderKeyGroups);
    liveRows = liveResult.rows;
    livePagesScanned = liveResult.pagesScanned;
    if (liveResult.warning) {
      warnings.push(liveResult.warning);
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Live Nabis order scan failed.");
  }

  const localLines = localOrders.flatMap(linesFromLocalOrder);
  const liveLines = liveRows
    .map((row) => lineFromNabisRecord(row, "live"))
    .filter((line): line is NabisLine => Boolean(line));
  const mergedLines = [...localLines, ...liveLines];
  const { orders, unmatchedLineItems, skippedLineItems } = buildOrders(mergedLines, year);
  const reportedOrderKeys = new Set(orders.flatMap(normalizedOrderKeys));
  const localCurrentYearOrders = localOrders.filter((row) => isReportableLocalOrder(row, year));
  const missingLineItemOrders = localCurrentYearOrders.filter((row) => {
    const keys = normalizedOrderKeys({
      externalOrderId: row.external_order_id,
      orderNumber: row.order_number,
    });
    return keys.length > 0 && !keys.some((key) => reportedOrderKeys.has(key));
  });
  if (missingLineItemOrders.length) {
    warnings.push(
      `${missingLineItemOrders.length} local ${year} Nabis order${missingLineItemOrders.length === 1 ? " is" : "s are"} not included yet because item-level invoice detail is not available in the current scan. Resync Nabis before sending if you need that invoice included.`,
    );
  }
  const primaryContact = selectPrimaryContact(detail.contacts);
  const totalSavings = cents(orders.reduce((sum, order) => sum + order.discountFromPromo, 0));
  const paidTotal = cents(orders.reduce((sum, order) => sum + order.paidTotal, 0));
  const standardTotal = cents(orders.reduce((sum, order) => sum + order.standardTotal, 0));
  const preferredTotal = cents(orders.reduce((sum, order) => sum + order.preferredTotal, 0));
  const discountFromStandard = cents(orders.reduce((sum, order) => sum + order.discountFromStandard, 0));
  const email = buildEmailBody({
    recipientName: primaryContact.name,
    year,
    totalSavings,
    orders,
    isPartial: missingLineItemOrders.length > 0,
  });

  return {
    accountId,
    accountName: detail.account.name,
    year,
    recipientName: primaryContact.name,
    recipientEmail: primaryContact.email,
    totalSavings,
    paidTotal,
    standardTotal,
    preferredTotal,
    discountFromStandard,
    orders,
    email: {
      subject: `PICC PPP savings for ${detail.account.name}`,
      body: email.body,
      html: email.html,
    },
    diagnostics: {
      source: liveRows.length ? "stored_nabis_payload_plus_live_nabis_scan" : "stored_nabis_payload",
      localOrdersScanned: localOrders.length,
      livePagesScanned,
      liveRowsMatched: liveRows.length,
      unmatchedLineItems,
      skippedLineItems,
      localCurrentYearOrders: localCurrentYearOrders.length,
      missingLineItemOrders: missingLineItemOrders.length,
      pricingSource: pricingGuide.source,
      warnings,
    },
  } satisfies PppSavingsReport;
}
