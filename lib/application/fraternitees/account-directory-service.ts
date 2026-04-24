import "server-only";

import type {
  FraterniteesAccountDirectoryItem,
  FraterniteesAccountDirectoryPage,
  FraterniteesAccountDirectorySummary,
  FraterniteesLeadGrade,
  Organization,
} from "@/lib/domain/runtime";
import { gradeFraterniteesLead } from "@/lib/application/fraternitees/lead-scoring";
import { findRuntimeOrganization, runtimeExactCount, runtimeRestRequest } from "@/lib/application/runtime/runtime-rest";

const PAGE_SIZE = 50;
const SUMMARY_BATCH_SIZE = 1000;

type FraterniteesDirectorySort = "score" | "close_rate" | "order_count";

interface AccountRow {
  id: string;
  organization_id: string;
  name: string;
  display_name: string | null;
  city: string | null;
  state: string | null;
  last_order_date: string | null;
  custom_fields: Record<string, unknown> | null;
}

interface DirectoryRow {
  id: string;
  organization_id: string;
  name: string;
  display_name: string;
  city: string | null;
  state: string | null;
  last_order_date: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  lead_priority: string | null;
  lead_score: number | string | null;
  lead_grade: FraterniteesLeadGrade | null;
  lead_close_rate: number | string | null;
  closed_orders: number | string | null;
  lost_orders: number | string | null;
  open_orders: number | string | null;
  total_orders: number | string | null;
  total_opportunities: number | string | null;
  closed_revenue: number | string | null;
  average_closed_order_value: number | string | null;
  median_closed_order_value: number | string | null;
  dnc_flagged: boolean | null;
}

interface SummaryRow {
  organization_id: string;
  accounts: number | string | null;
  scored_accounts: number | string | null;
  avg_score_non_dnc: number | string | null;
  dnc_flagged_accounts: number | string | null;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeQuery(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim().slice(0, 120) ?? "";
}

function normalizeGrade(value: string | string[] | undefined): FraterniteesLeadGrade | "All Grades" {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "A+" || raw === "A" || raw === "B" || raw === "C" || raw === "D" || raw === "F" || raw === "Unscored") {
    return raw;
  }

  return "All Grades";
}

function normalizeSort(value: string | string[] | undefined): FraterniteesDirectorySort {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "close_rate" || raw === "order_count") {
    return raw;
  }

  return "score";
}

function normalizePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

function extractAccountMetrics(customFields: Record<string, unknown> | null | undefined) {
  const fields = customFields ?? {};
  const leadScore = toNumber(fields.leadScore);
  const closeRate = toNumber(fields.closeRate);
  const closedOrders = toNumber(fields.closedOrders) ?? 0;
  const lostOrders = toNumber(fields.lostOrders) ?? 0;
  const openOrders = toNumber(fields.openOrders) ?? 0;
  const totalOrders = toNumber(fields.totalOrders) ?? closedOrders + lostOrders + openOrders;
  const totalOpportunities = toNumber(fields.totalOpportunities) ?? closedOrders + lostOrders;
  const closedRevenue = toNumber(fields.closedRevenue);
  const averageClosedOrderValue = toNumber(fields.averageClosedOrderValue);
  const medianClosedOrderValue = toNumber(fields.medianClosedOrderValue);
  const leadPriority = typeof fields.leadPriority === "string" && fields.leadPriority.trim() ? fields.leadPriority : null;
  const primaryContactName =
    typeof fields.primaryContactName === "string" && fields.primaryContactName.trim() ? fields.primaryContactName : null;
  const primaryContactEmail =
    typeof fields.primaryContactEmail === "string" && fields.primaryContactEmail.trim() ? fields.primaryContactEmail : null;
  const dncFlagged = lostOrders >= 3;
  const leadGrade = gradeFraterniteesLead({
    score: leadScore,
    closeRate,
    closedOrders,
    lostOrders,
    openOrders,
    closedRevenue: closedRevenue ?? 0,
    monthsWithClosedOrdersLast12: 0,
  });

  return {
    leadPriority,
    primaryContactName,
    primaryContactEmail,
    leadScore,
    leadGrade,
    closeRate,
    closedOrders,
    lostOrders,
    openOrders,
    totalOrders,
    totalOpportunities,
    closedRevenue,
    averageClosedOrderValue,
    medianClosedOrderValue,
    dncFlagged,
  };
}

function mapAccountRow(row: AccountRow): FraterniteesAccountDirectoryItem {
  const metrics = extractAccountMetrics(row.custom_fields);

  return {
    id: row.id,
    name: row.display_name || row.name,
    city: row.city,
    state: row.state,
    primaryContactName: metrics.primaryContactName,
    primaryContactEmail: metrics.primaryContactEmail,
    leadPriority: metrics.leadPriority,
    leadScore: metrics.leadScore,
    leadGrade: metrics.leadGrade,
    closeRate: metrics.closeRate,
    closedOrders: metrics.closedOrders,
    lostOrders: metrics.lostOrders,
    openOrders: metrics.openOrders,
    totalOrders: metrics.totalOrders,
    totalOpportunities: metrics.totalOpportunities,
    closedRevenue: metrics.closedRevenue,
    averageClosedOrderValue: metrics.averageClosedOrderValue,
    medianClosedOrderValue: metrics.medianClosedOrderValue,
    dncFlagged: metrics.dncFlagged,
    lastOrderDate: row.last_order_date,
  };
}

function mapDirectoryRow(row: DirectoryRow): FraterniteesAccountDirectoryItem {
  return {
    id: row.id,
    name: row.display_name || row.name,
    city: row.city,
    state: row.state,
    primaryContactName: row.primary_contact_name,
    primaryContactEmail: row.primary_contact_email,
    leadPriority: row.lead_priority,
    leadScore: toNumber(row.lead_score),
    leadGrade: row.lead_grade ?? "Unscored",
    closeRate: toNumber(row.lead_close_rate),
    closedOrders: toNumber(row.closed_orders) ?? 0,
    lostOrders: toNumber(row.lost_orders) ?? 0,
    openOrders: toNumber(row.open_orders) ?? 0,
    totalOrders: toNumber(row.total_orders) ?? 0,
    totalOpportunities: toNumber(row.total_opportunities) ?? 0,
    closedRevenue: toNumber(row.closed_revenue),
    averageClosedOrderValue: toNumber(row.average_closed_order_value),
    medianClosedOrderValue: toNumber(row.median_closed_order_value),
    dncFlagged: Boolean(row.dnc_flagged),
    lastOrderDate: row.last_order_date,
  };
}

function mapSummaryRow(row: SummaryRow | null, orders: number): FraterniteesAccountDirectorySummary {
  return {
    accounts: toNumber(row?.accounts) ?? 0,
    scoredAccounts: toNumber(row?.scored_accounts) ?? 0,
    avgScoreNonDnc: toNumber(row?.avg_score_non_dnc),
    dncFlaggedAccounts: toNumber(row?.dnc_flagged_accounts) ?? 0,
    orders,
  };
}

function applyDirectBaseFilters(
  params: URLSearchParams,
  input: {
    organizationId: string;
    query: string;
    dncOnly: boolean;
  },
) {
  params.set("organization_id", `eq.${input.organizationId}`);

  if (input.dncOnly) {
    params.set("custom_fields->lostOrders", "gte.3");
  }

  if (input.query) {
    const escaped = input.query.replaceAll(",", " ").replaceAll("(", " ").replaceAll(")", " ");
    params.set(
      "or",
      `(
display_name.ilike.*${escaped}*,
name.ilike.*${escaped}*,
city.ilike.*${escaped}*,
state.ilike.*${escaped}*,
custom_fields->>primaryContactName.ilike.*${escaped}*,
custom_fields->>primaryContactEmail.ilike.*${escaped}*
)`.replace(/\s+/g, ""),
    );
  }

  return params;
}

function applyViewBaseFilters(
  params: URLSearchParams,
  input: {
    organizationId: string;
    query: string;
    dncOnly: boolean;
  },
) {
  params.set("organization_id", `eq.${input.organizationId}`);

  if (input.dncOnly) {
    params.set("dnc_flagged", "eq.true");
  }

  if (input.query) {
    const escaped = input.query.replaceAll(",", " ").replaceAll("(", " ").replaceAll(")", " ");
    params.set(
      "or",
      `(
display_name.ilike.*${escaped}*,
name.ilike.*${escaped}*,
city.ilike.*${escaped}*,
state.ilike.*${escaped}*,
primary_contact_name.ilike.*${escaped}*,
primary_contact_email.ilike.*${escaped}*
)`.replace(/\s+/g, ""),
    );
  }

  return params;
}

function applyDirectGradeFilter(params: URLSearchParams, grade: FraterniteesLeadGrade | "All Grades") {
  if (grade === "All Grades") {
    return params;
  }

  if (grade === "Unscored") {
    params.set("custom_fields->leadScore", "is.null");
    return params;
  }

  const aPlus = "and(custom_fields->leadScore.gte.90,custom_fields->closeRate.gte.0.8,custom_fields->closedOrders.gte.5,custom_fields->lostOrders.lte.1)";
  const aBase = "and(custom_fields->leadScore.gte.82,custom_fields->closeRate.gte.0.65,custom_fields->closedOrders.gte.3)";
  const fSpecial =
    "or(and(custom_fields->lostOrders.gte.2,custom_fields->closedOrders.lte.0,custom_fields->openOrders.lte.0),and(custom_fields->lostOrders.gte.4,custom_fields->closeRate.lt.0.4))";

  if (grade === "A+") {
    params.set("and", `(${aPlus.slice(4, -1)})`);
    return params;
  }

  if (grade === "A") {
    params.set("and", `(${aBase.slice(4, -1)},not.${aPlus})`);
    return params;
  }

  if (grade === "B") {
    params.set("and", `(custom_fields->leadScore.gte.72,not.${aBase},not.${fSpecial})`);
    return params;
  }

  if (grade === "C") {
    params.set("and", `(custom_fields->leadScore.gte.58,custom_fields->leadScore.lt.72,not.${fSpecial})`);
    return params;
  }

  if (grade === "D") {
    params.set("and", `(custom_fields->leadScore.gte.45,custom_fields->leadScore.lt.58,not.${fSpecial})`);
    return params;
  }

  if (grade === "F") {
    params.set("and", `(or(custom_fields->leadScore.lt.45,${fSpecial.slice(3, -1)}))`);
  }

  return params;
}

function applyViewGradeFilter(params: URLSearchParams, grade: FraterniteesLeadGrade | "All Grades") {
  if (grade === "All Grades") {
    return params;
  }

  if (grade === "Unscored") {
    params.set("lead_grade", "eq.Unscored");
    return params;
  }

  params.set("lead_grade", `eq.${grade}`);
  return params;
}

function directOrderClause(sort: FraterniteesDirectorySort) {
  if (sort === "close_rate") {
    return "custom_fields->closeRate.desc.nullslast,custom_fields->closedOrders.desc.nullslast,display_name.asc";
  }

  if (sort === "order_count") {
    return "custom_fields->closedOrders.desc.nullslast,custom_fields->lostOrders.desc.nullslast,custom_fields->openOrders.desc.nullslast,display_name.asc";
  }

  return "custom_fields->leadScore.desc.nullslast,custom_fields->closedOrders.desc.nullslast,display_name.asc";
}

function viewOrderClause(sort: FraterniteesDirectorySort) {
  if (sort === "close_rate") {
    return "lead_close_rate.desc.nullslast,total_orders.desc.nullslast,display_name.asc";
  }

  if (sort === "order_count") {
    return "total_orders.desc.nullslast,lead_close_rate.desc.nullslast,display_name.asc";
  }

  return "lead_score.desc.nullslast,total_orders.desc.nullslast,display_name.asc";
}

async function fetchDirectSummarySnapshot(organization: Organization): Promise<FraterniteesAccountDirectorySummary> {
  const [accounts, scoredAccounts, dncFlaggedAccounts, orders] = await Promise.all([
    runtimeExactCount("account", organization.id),
    runtimeExactCount("account", organization.id, { "custom_fields->leadScore": "not.is.null" }),
    runtimeExactCount("account", organization.id, { "custom_fields->lostOrders": "gte.3" }),
    runtimeExactCount("order_record", organization.id),
  ]);

  let totalScore = 0;
  let scoredNonDncAccounts = 0;

  const batchCount = Math.ceil(accounts / SUMMARY_BATCH_SIZE);
  if (batchCount > 0) {
    const batches = await Promise.all(
      Array.from({ length: batchCount }, (_, index) => {
        const params = new URLSearchParams({
          organization_id: `eq.${organization.id}`,
          select: "leadScore:custom_fields->>leadScore,lostOrders:custom_fields->>lostOrders",
          limit: String(SUMMARY_BATCH_SIZE),
          offset: String(index * SUMMARY_BATCH_SIZE),
          order: "id.asc",
        });
        return runtimeRestRequest<Array<{ leadScore: string | null; lostOrders: string | null }>>("account", params);
      }),
    );

    for (const batch of batches) {
      for (const row of batch.data) {
        const leadScore = toNumber(row.leadScore);
        const lostOrders = toNumber(row.lostOrders) ?? 0;
        if (leadScore !== null && lostOrders < 3) {
          totalScore += leadScore;
          scoredNonDncAccounts += 1;
        }
      }
    }
  }

  return {
    accounts,
    scoredAccounts,
    avgScoreNonDnc: scoredNonDncAccounts ? Math.round(totalScore / scoredNonDncAccounts) : null,
    dncFlaggedAccounts,
    orders,
  };
}

async function fetchViewSummarySnapshot(organization: Organization): Promise<FraterniteesAccountDirectorySummary> {
  const [summaryResponse, orders] = await Promise.all([
    runtimeRestRequest<SummaryRow[]>(
      "fraternitees_account_directory_summary_view",
      new URLSearchParams({
        organization_id: `eq.${organization.id}`,
        select: "organization_id,accounts,scored_accounts,avg_score_non_dnc,dnc_flagged_accounts",
        limit: "1",
      }),
    ),
    runtimeExactCount("order_record", organization.id),
  ]);

  return mapSummaryRow(summaryResponse.data[0] ?? null, orders);
}

async function fetchDirectFilteredCount(input: {
  organizationId: string;
  query: string;
  grade: FraterniteesLeadGrade | "All Grades";
  dncOnly: boolean;
}) {
  const params = applyDirectGradeFilter(
    applyDirectBaseFilters(
      new URLSearchParams({
        select: "id",
        limit: "1",
      }),
      input,
    ),
    input.grade,
  );

  const result = await runtimeRestRequest<null>("account", params, {
    method: "HEAD",
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  return result.count;
}

async function fetchViewFilteredCount(input: {
  organizationId: string;
  query: string;
  grade: FraterniteesLeadGrade | "All Grades";
  dncOnly: boolean;
}) {
  const params = applyViewGradeFilter(
    applyViewBaseFilters(
      new URLSearchParams({
        select: "id",
        limit: "1",
      }),
      input,
    ),
    input.grade,
  );

  const result = await runtimeRestRequest<null>("fraternitees_account_directory_view", params, {
    method: "HEAD",
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  return result.count;
}

async function fetchDirectItems(input: {
  organizationId: string;
  query: string;
  grade: FraterniteesLeadGrade | "All Grades";
  dncOnly: boolean;
  sort: FraterniteesDirectorySort;
  page: number;
}) {
  const offset = (input.page - 1) * PAGE_SIZE;
  const params = applyDirectGradeFilter(
    applyDirectBaseFilters(
      new URLSearchParams({
        select: "id,organization_id,name,display_name,city,state,last_order_date,custom_fields",
        order: directOrderClause(input.sort),
        limit: String(PAGE_SIZE),
        offset: String(offset),
      }),
      input,
    ),
    input.grade,
  );

  const result = await runtimeRestRequest<AccountRow[]>("account", params);
  return result.data.map(mapAccountRow);
}

async function fetchViewItems(input: {
  organizationId: string;
  query: string;
  grade: FraterniteesLeadGrade | "All Grades";
  dncOnly: boolean;
  sort: FraterniteesDirectorySort;
  page: number;
}) {
  const offset = (input.page - 1) * PAGE_SIZE;
  const params = applyViewGradeFilter(
    applyViewBaseFilters(
      new URLSearchParams({
        select:
          "id,organization_id,name,display_name,city,state,last_order_date,primary_contact_name,primary_contact_email,lead_priority,lead_score,lead_grade,lead_close_rate,closed_orders,lost_orders,open_orders,total_orders,total_opportunities,closed_revenue,average_closed_order_value,median_closed_order_value,dnc_flagged",
        order: viewOrderClause(input.sort),
        limit: String(PAGE_SIZE),
        offset: String(offset),
      }),
      input,
    ),
    input.grade,
  );

  const result = await runtimeRestRequest<DirectoryRow[]>("fraternitees_account_directory_view", params);
  return result.data.map(mapDirectoryRow);
}

function buildDirectoryPage(input: {
  organization: Organization;
  summary: FraterniteesAccountDirectorySummary;
  items: FraterniteesAccountDirectoryItem[];
  query: string;
  grade: FraterniteesLeadGrade | "All Grades";
  dncOnly: boolean;
  sort: FraterniteesDirectorySort;
  page: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(input.totalItems / PAGE_SIZE));
  const normalizedPage = Math.min(input.page, totalPages);
  const startItem = input.totalItems === 0 ? 0 : (normalizedPage - 1) * PAGE_SIZE + 1;
  const endItem = input.totalItems === 0 ? 0 : Math.min(input.totalItems, startItem + input.items.length - 1);

  return {
    organization: input.organization,
    summary: input.summary,
    items: input.items,
    filters: {
      query: input.query,
      grade: input.grade,
      dncOnly: input.dncOnly,
      sort: input.sort,
      page: normalizedPage,
      pageSize: PAGE_SIZE,
    },
    pagination: {
      page: normalizedPage,
      pageSize: PAGE_SIZE,
      totalItems: input.totalItems,
      totalPages,
      hasPreviousPage: normalizedPage > 1,
      hasNextPage: normalizedPage < totalPages,
      startItem,
      endItem,
    },
  } satisfies FraterniteesAccountDirectoryPage;
}

async function getFraterniteesAccountDirectoryViaViews(input: {
  organization: Organization;
  query: string;
  grade: FraterniteesLeadGrade | "All Grades";
  dncOnly: boolean;
  sort: FraterniteesDirectorySort;
  page: number;
}) {
  const [summary, totalItems] = await Promise.all([
    fetchViewSummarySnapshot(input.organization),
    fetchViewFilteredCount({
      organizationId: input.organization.id,
      query: input.query,
      grade: input.grade,
      dncOnly: input.dncOnly,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const normalizedPage = Math.min(input.page, totalPages);
  const items = await fetchViewItems({
    organizationId: input.organization.id,
    query: input.query,
    grade: input.grade,
    dncOnly: input.dncOnly,
    sort: input.sort,
    page: normalizedPage,
  });

  return buildDirectoryPage({
    organization: input.organization,
    summary,
    items,
    query: input.query,
    grade: input.grade,
    dncOnly: input.dncOnly,
    sort: input.sort,
    page: normalizedPage,
    totalItems,
  });
}

async function getFraterniteesAccountDirectoryViaDirect(input: {
  organization: Organization;
  query: string;
  grade: FraterniteesLeadGrade | "All Grades";
  dncOnly: boolean;
  sort: FraterniteesDirectorySort;
  page: number;
}) {
  const [summary, totalItems] = await Promise.all([
    fetchDirectSummarySnapshot(input.organization),
    fetchDirectFilteredCount({
      organizationId: input.organization.id,
      query: input.query,
      grade: input.grade,
      dncOnly: input.dncOnly,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const normalizedPage = Math.min(input.page, totalPages);
  const items = await fetchDirectItems({
    organizationId: input.organization.id,
    query: input.query,
    grade: input.grade,
    dncOnly: input.dncOnly,
    sort: input.sort,
    page: normalizedPage,
  });

  return buildDirectoryPage({
    organization: input.organization,
    summary,
    items,
    query: input.query,
    grade: input.grade,
    dncOnly: input.dncOnly,
    sort: input.sort,
    page: normalizedPage,
    totalItems,
  });
}

export async function getFraterniteesAccountDirectory(
  slug: string,
  params: Record<string, string | string[] | undefined>,
): Promise<FraterniteesAccountDirectoryPage | null> {
  const organization = await findRuntimeOrganization(slug);
  if (!organization) {
    return null;
  }

  const query = normalizeQuery(params.q);
  const grade = normalizeGrade(params.grade);
  const dncOnly = (Array.isArray(params.dnc) ? params.dnc[0] : params.dnc) === "1";
  const sort = normalizeSort(params.sort);
  const page = normalizePage(params.page);

  try {
    return await getFraterniteesAccountDirectoryViaViews({
      organization,
      query,
      grade,
      dncOnly,
      sort,
      page,
    });
  } catch {
    return getFraterniteesAccountDirectoryViaDirect({
      organization,
      query,
      grade,
      dncOnly,
      sort,
      page,
    });
  }
}
