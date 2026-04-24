import "server-only";

import type { AccountRuntimeDetail } from "@/lib/domain/runtime";
import { getAccountRuntimeDetail } from "@/lib/application/runtime/account-service";
import { findRuntimeOrganization } from "@/lib/application/runtime/runtime-rest";
import { resolveTenantNabisConfig } from "@/lib/application/runtime/provider-credentials";

const DEFAULT_NABIS_API_BASE_URL = "https://platform-api.nabis.pro/v2";
const DEFAULT_NABIS_INVENTORY_PATH = "/ny/inventory";
const DEFAULT_NABIS_PAGE_SIZE = 500;
const NABIS_FETCH_ATTEMPTS = 4;

interface InventoryWarehouseCount {
  available?: number | string | null;
  updatedAt?: string | null;
  warehouseId?: string | null;
}

interface InventoryRow {
  skuCode?: string | null;
  skuName?: string | null;
  skuDisplayName?: string | null;
  skuBrandName?: string | null;
  skuInventoryCategory?: string | null;
  skuInventoryClass?: string | null;
  skuInventoryType?: string | null;
  skuStrainType?: string | null;
  skuCasePackSize?: number | string | null;
  skuPricePerUnit?: number | string | null;
  skuTotalPrice?: number | string | null;
  skuIsSample?: boolean | string | null;
  batchCode?: string | null;
  batchExpirationDate?: string | null;
  batchManufacturingDate?: string | null;
  batchThcPercentage?: number | string | null;
  warehouseCounts?: InventoryWarehouseCount[] | null;
}

export interface MockOrderProposalItem {
  skuCode: string;
  skuName: string;
  brand: string;
  product: string;
  category: string;
  strainType: string;
  batchCode: string | null;
  expirationDate: string | null;
  casePackSize: number;
  availableUnits: number;
  proposedCases: number;
  proposedUnits: number;
  unitPrice: number;
  casePrice: number;
  lineTotal: number;
  lastInventoryUpdate: string | null;
}

export interface MockOrderProposalReport {
  accountId: string;
  accountName: string;
  generatedAt: string;
  items: MockOrderProposalItem[];
  totals: {
    cases: number;
    units: number;
    subtotal: number;
  };
  diagnostics: {
    source: string;
    pagesScanned: number;
    rowsScanned: number;
    rowsWithAvailableInventory: number;
    rowsExcludedAsDisplayOrSample: number;
    rowsExcludedBelowCasePack: number;
    warnings: string[];
  };
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

function normalizeSearchText(value: unknown) {
  return compactString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function cents(value: number) {
  return Math.round(value * 100) / 100;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readRows(payload: unknown) {
  const record = payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : null;
  const data = record?.data;
  return {
    rows: Array.isArray(data) ? (data as InventoryRow[]) : Array.isArray(payload) ? (payload as InventoryRow[]) : [],
    nextPage: typeof record?.nextPage === "number" ? record.nextPage : null,
  };
}

async function fetchNabisPage(url: URL, apiKey: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= NABIS_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "map-app-mock-order-proposal/0.1",
          "x-nabis-access-token": apiKey,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(45_000),
      });

      if (response.status !== 429 && (response.status < 500 || attempt === NABIS_FETCH_ATTEMPTS)) {
        return response;
      }

      const retryAfter = Number(response.headers.get("retry-after"));
      await delay(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * attempt * 1500);
    } catch (error) {
      lastError = error;
      if (attempt === NABIS_FETCH_ATTEMPTS) {
        throw error;
      }
      await delay(attempt * attempt * 1500);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Nabis inventory scan failed.");
}

async function fetchLiveInventory(input: { organizationId: string; organizationSlug: string }) {
  const nabis = await resolveTenantNabisConfig(input);
  const apiKey = nabis.apiKey;
  if (!apiKey) {
    return {
      rows: [] as InventoryRow[],
      pagesScanned: 0,
      warning: `Nabis credentials are not configured for "${input.organizationSlug}"; unable to generate live inventory proposal.`,
    };
  }

  const baseUrl = (nabis.apiBaseUrl || DEFAULT_NABIS_API_BASE_URL).replace(/\/$/, "");
  const inventoryPath = nabis.inventoryPath || DEFAULT_NABIS_INVENTORY_PATH;
  const path = inventoryPath.startsWith("/") ? inventoryPath : `/${inventoryPath}`;
  const pageSize = Number.parseInt(process.env.NABIS_INVENTORY_PAGE_SIZE ?? "", 10);
  const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_NABIS_PAGE_SIZE;
  const rows: InventoryRow[] = [];
  let pagesScanned = 0;

  for (let page = 0; ; page += 1) {
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    const response = await fetchNabisPage(url, apiKey);
    pagesScanned += 1;

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Nabis inventory scan failed with ${response.status}: ${body.slice(0, 240)}`);
    }

    const payload = (await response.json()) as unknown;
    const pageData = readRows(payload);
    rows.push(...pageData.rows);
    if (!pageData.rows.length || pageData.nextPage === null || pageData.nextPage <= page) {
      break;
    }
  }

  return {
    rows,
    pagesScanned,
    warning: null,
  };
}

function availableUnits(row: InventoryRow) {
  return (row.warehouseCounts ?? []).reduce((sum, count) => sum + (parseNumber(count.available) ?? 0), 0);
}

function lastInventoryUpdate(row: InventoryRow) {
  const dates = (row.warehouseCounts ?? [])
    .map((count) => compactString(count.updatedAt))
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates.at(-1) ?? null;
}

function isDisplayOrSample(row: InventoryRow) {
  const text = normalizeSearchText([row.skuCode, row.skuName, row.skuDisplayName, row.batchCode].filter(Boolean).join(" "));
  const sampleFlag = String(row.skuIsSample ?? "").toLowerCase() === "true";
  return sampleFlag || ["dummy", "display", "sample", "packaging", "empty", "tube", "tin", "pos", "screen", "sign", "signage", "poster"].some((token) => text.includes(token));
}

function labelParts(row: InventoryRow) {
  const name = compactString(row.skuName) ?? compactString(row.skuDisplayName) ?? compactString(row.skuCode) ?? "Unknown item";
  const parts = name.split("|").map((part) => part.trim()).filter(Boolean);
  return {
    brand: compactString(row.skuBrandName) ?? parts[0] ?? "PICC",
    product: parts.length > 1 ? parts.slice(1).join(" | ") : name,
    name,
  };
}

function buildProposalItems(rows: InventoryRow[]) {
  const deduped = new Map<string, InventoryRow>();
  for (const row of rows) {
    const skuCode = compactString(row.skuCode);
    if (!skuCode) {
      continue;
    }
    const current = deduped.get(skuCode);
    if (!current || availableUnits(row) > availableUnits(current)) {
      deduped.set(skuCode, row);
    }
  }

  const items: MockOrderProposalItem[] = [];
  let rowsWithAvailableInventory = 0;
  let rowsExcludedAsDisplayOrSample = 0;
  let rowsExcludedBelowCasePack = 0;

  for (const row of deduped.values()) {
    const available = Math.floor(availableUnits(row));
    if (available <= 0) {
      continue;
    }
    rowsWithAvailableInventory += 1;

    if (isDisplayOrSample(row)) {
      rowsExcludedAsDisplayOrSample += 1;
      continue;
    }

    const casePackSize = Math.floor(parseNumber(row.skuCasePackSize) ?? 1);
    if (casePackSize <= 0 || available < casePackSize) {
      rowsExcludedBelowCasePack += 1;
      continue;
    }

    const labels = labelParts(row);
    const unitPrice = cents(parseNumber(row.skuPricePerUnit) ?? 0);
    const casePrice = cents(parseNumber(row.skuTotalPrice) ?? unitPrice * casePackSize);
    items.push({
      skuCode: compactString(row.skuCode) ?? "",
      skuName: labels.name,
      brand: labels.brand,
      product: labels.product,
      category: compactString(row.skuInventoryCategory) ?? compactString(row.skuInventoryClass) ?? "Inventory",
      strainType: compactString(row.skuStrainType) ?? "",
      batchCode: compactString(row.batchCode),
      expirationDate: compactString(row.batchExpirationDate),
      casePackSize,
      availableUnits: available,
      proposedCases: 1,
      proposedUnits: casePackSize,
      unitPrice,
      casePrice,
      lineTotal: casePrice,
      lastInventoryUpdate: lastInventoryUpdate(row),
    });
  }

  return {
    items: items.sort((left, right) => `${left.brand} ${left.product}`.localeCompare(`${right.brand} ${right.product}`)),
    rowsWithAvailableInventory,
    rowsExcludedAsDisplayOrSample,
    rowsExcludedBelowCasePack,
  };
}

export async function buildMockOrderProposalReport(slug: string, accountId: string) {
  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }

  const detail: AccountRuntimeDetail | null = await getAccountRuntimeDetail(slug, accountId);
  if (!detail) {
    return null;
  }

  const warnings: string[] = [];
  let inventoryRows: InventoryRow[] = [];
  let pagesScanned = 0;

  try {
    const inventory = await fetchLiveInventory({
      organizationId: organization.id,
      organizationSlug: organization.slug,
    });
    inventoryRows = inventory.rows;
    pagesScanned = inventory.pagesScanned;
    if (inventory.warning) {
      warnings.push(inventory.warning);
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Nabis inventory scan failed.");
  }

  const proposal = buildProposalItems(inventoryRows);
  const totals = proposal.items.reduce(
    (sum, item) => ({
      cases: sum.cases + item.proposedCases,
      units: sum.units + item.proposedUnits,
      subtotal: cents(sum.subtotal + item.lineTotal),
    }),
    { cases: 0, units: 0, subtotal: 0 },
  );

  return {
    accountId,
    accountName: detail.account.name,
    generatedAt: new Date().toISOString(),
    items: proposal.items,
    totals,
    diagnostics: {
      source: "live_nabis_inventory",
      pagesScanned,
      rowsScanned: inventoryRows.length,
      rowsWithAvailableInventory: proposal.rowsWithAvailableInventory,
      rowsExcludedAsDisplayOrSample: proposal.rowsExcludedAsDisplayOrSample,
      rowsExcludedBelowCasePack: proposal.rowsExcludedBelowCasePack,
      warnings,
    },
  } satisfies MockOrderProposalReport;
}
