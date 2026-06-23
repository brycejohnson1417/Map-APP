export type FraterniteesLeadGrade = "A+" | "A" | "B" | "C" | "D" | "F" | "Unscored";

const leadGrades = new Set<FraterniteesLeadGrade>(["A+", "A", "B", "C", "D", "F", "Unscored"]);
const closedStatusHints = ["order placed", "completed", "shipped by"];
const lostStatusHints = ["order canceled", "cancelled", "ghost", "not enough interest", "other company", "event cancelled"];

export type AccountRankingSort = "score" | "close_rate" | "order_count" | "last_order_date" | "salesperson";
export type AccountRankingOrderSource = "account_table" | "directory_view";
export type CalendarYearCustomerSort = "needs_close" | "fraternity" | "spend";

export interface CalendarYearAccountInput {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  customFields: Record<string, unknown> | null;
}

export interface CalendarYearOrderInput {
  accountId: string | null;
  status: string | null;
  orderTotal: number | null;
  orderCreatedAt: string | null;
}

export interface CalendarYearCustomerRow {
  accountId: string;
  name: string;
  city: string | null;
  state: string | null;
  fraternity: string;
  chapter: string;
  orderCount: number;
  closedOrders: number;
  openOrders: number;
  lostOrders: number;
  revenue: number;
  lastOrderDate: string | null;
  needsClose: boolean;
}

export function normalizeCalendarYearCustomerSort(value: unknown): CalendarYearCustomerSort {
  return value === "fraternity" || value === "spend" ? value : "needs_close";
}

export function normalizeAccountRankingSort(value: unknown): AccountRankingSort {
  return value === "close_rate" ||
    value === "order_count" ||
    value === "last_order_date" ||
    value === "salesperson"
    ? value
    : "score";
}

export function buildAccountRankingOrderClause(sort: AccountRankingSort, source: AccountRankingOrderSource) {
  if (source === "directory_view") {
    if (sort === "close_rate") {
      return "lead_close_rate.desc.nullslast,total_orders.desc.nullslast,display_name.asc";
    }

    if (sort === "order_count") {
      return "total_orders.desc.nullslast,lead_close_rate.desc.nullslast,display_name.asc";
    }

    if (sort === "last_order_date") {
      return "last_order_date.desc.nullslast,lead_score.desc.nullslast,total_orders.desc.nullslast,display_name.asc";
    }

    if (sort === "salesperson") {
      return "primary_sales_rep.asc.nullslast,display_name.asc,last_order_date.desc.nullslast";
    }

    return "lead_score.desc.nullslast,total_orders.desc.nullslast,display_name.asc";
  }

  if (sort === "close_rate") {
    return "custom_fields->closeRate.desc.nullslast,custom_fields->closedOrders.desc.nullslast,display_name.asc";
  }

  if (sort === "order_count") {
    return "custom_fields->closedOrders.desc.nullslast,custom_fields->lostOrders.desc.nullslast,custom_fields->openOrders.desc.nullslast,display_name.asc";
  }

  if (sort === "last_order_date") {
    return "last_order_date.desc.nullslast,custom_fields->leadScore.desc.nullslast,custom_fields->closedOrders.desc.nullslast,display_name.asc";
  }

  if (sort === "salesperson") {
    return "sales_rep_names.asc.nullslast,display_name.asc,last_order_date.desc.nullslast";
  }

  return "custom_fields->leadScore.desc.nullslast,custom_fields->closedOrders.desc.nullslast,display_name.asc";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function collectSalesRepNames(values: Array<{ salesRepName?: string | null | undefined }>) {
  return [...new Set(values.map((value) => cleanText(value.salesRepName)).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function normalizeManualLeadGrade(value: unknown): FraterniteesLeadGrade | null {
  const cleaned = cleanText(value);
  return leadGrades.has(cleaned as FraterniteesLeadGrade) ? (cleaned as FraterniteesLeadGrade) : null;
}

export function resolveManualLeadGrade(
  computed: {
    leadGrade: FraterniteesLeadGrade;
    leadScore: number | null;
  },
  customFields: Record<string, unknown> | null | undefined,
) {
  const fields = customFields ?? {};
  const manualLeadGrade = normalizeManualLeadGrade(fields.manualLeadGrade);
  if (!manualLeadGrade) {
    return {
      leadGrade: computed.leadGrade,
      computedLeadGrade: null,
      manualLeadGrade: null,
      manualLeadGradeReason: null,
      manualLeadGradeUpdatedAt: null,
      manualLeadGradeUpdatedBy: null,
    };
  }

  return {
    leadGrade: manualLeadGrade,
    computedLeadGrade: computed.leadGrade,
    manualLeadGrade,
    manualLeadGradeReason: cleanText(fields.manualLeadGradeReason) || null,
    manualLeadGradeUpdatedAt: cleanText(fields.manualLeadGradeUpdatedAt) || null,
    manualLeadGradeUpdatedBy: cleanText(fields.manualLeadGradeUpdatedBy) || null,
  };
}

function explicitFraternity(fields: Record<string, unknown>) {
  return cleanText(fields.fraternity) || cleanText(fields.fraternityName) || cleanText(fields.greekOrganization);
}

function explicitChapter(fields: Record<string, unknown>) {
  return cleanText(fields.chapter) || cleanText(fields.chapterName) || cleanText(fields.school) || cleanText(fields.university);
}

function splitChapterName(name: string) {
  const parts = name
    .split(/\s(?:-|\/| at | @ )\s/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      fraternity: parts[0],
      chapter: parts.slice(1).join(" - "),
    };
  }

  const commaParts = name.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    return {
      fraternity: commaParts[0],
      chapter: commaParts.slice(1).join(", "),
    };
  }

  return {
    fraternity: name || "Unassigned fraternity",
    chapter: "Unassigned chapter",
  };
}

export function extractFraternityChapter(input: {
  name: string;
  customFields: Record<string, unknown> | null | undefined;
}) {
  const fields = input.customFields ?? {};
  const parsed = splitChapterName(input.name);
  return {
    fraternity: explicitFraternity(fields) || parsed.fraternity,
    chapter: explicitChapter(fields) || parsed.chapter,
  };
}

function inCalendarYear(value: string | null, year: number) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getUTCFullYear() === year;
}

function classifyOrderStatus(status: string | null) {
  const normalized = cleanText(status).toLowerCase();
  if (closedStatusHints.some((hint) => normalized.includes(hint))) {
    return "closed";
  }
  if (lostStatusHints.some((hint) => normalized.includes(hint))) {
    return "lost";
  }
  return "open";
}

function sortCalendarRows(rows: CalendarYearCustomerRow[], sort: CalendarYearCustomerSort) {
  return [...rows].sort((left, right) => {
    if (sort === "fraternity") {
      return (
        left.fraternity.localeCompare(right.fraternity) ||
        Number(right.needsClose) - Number(left.needsClose) ||
        left.chapter.localeCompare(right.chapter) ||
        left.name.localeCompare(right.name)
      );
    }

    if (sort === "spend") {
      return right.revenue - left.revenue || right.closedOrders - left.closedOrders || left.name.localeCompare(right.name);
    }

    return (
      Number(right.needsClose) - Number(left.needsClose) ||
      left.fraternity.localeCompare(right.fraternity) ||
      left.chapter.localeCompare(right.chapter) ||
      left.name.localeCompare(right.name)
    );
  });
}

export function buildCalendarYearCustomerRows(input: {
  now: Date;
  accounts: CalendarYearAccountInput[];
  orders: CalendarYearOrderInput[];
  sort?: CalendarYearCustomerSort;
}): CalendarYearCustomerRow[] {
  const year = input.now.getUTCFullYear();
  const accountsById = new Map(input.accounts.map((account) => [account.id, account]));
  const aggregates = new Map<
    string,
    {
      orderCount: number;
      closedOrders: number;
      openOrders: number;
      lostOrders: number;
      revenue: number;
      lastOrderDate: string | null;
    }
  >();

  for (const order of input.orders) {
    if (!order.accountId || !inCalendarYear(order.orderCreatedAt, year)) {
      continue;
    }

    const current = aggregates.get(order.accountId) ?? {
      orderCount: 0,
      closedOrders: 0,
      openOrders: 0,
      lostOrders: 0,
      revenue: 0,
      lastOrderDate: null,
    };
    const bucket = classifyOrderStatus(order.status);
    current.orderCount += 1;
    current.closedOrders += bucket === "closed" ? 1 : 0;
    current.lostOrders += bucket === "lost" ? 1 : 0;
    current.openOrders += bucket !== "closed" && bucket !== "lost" ? 1 : 0;
    current.revenue += bucket === "closed" ? order.orderTotal ?? 0 : 0;
    if (order.orderCreatedAt && (!current.lastOrderDate || order.orderCreatedAt > current.lastOrderDate)) {
      current.lastOrderDate = order.orderCreatedAt;
    }
    aggregates.set(order.accountId, current);
  }

  const rows = [...aggregates.entries()].flatMap(([accountId, aggregate]) => {
    const account = accountsById.get(accountId);
    if (!account) {
      return [];
    }
    const chapter = extractFraternityChapter({
      name: account.name,
      customFields: account.customFields,
    });
    return [
      {
        accountId,
        name: account.name,
        city: account.city,
        state: account.state,
        fraternity: chapter.fraternity,
        chapter: chapter.chapter,
        orderCount: aggregate.orderCount,
        closedOrders: aggregate.closedOrders,
        openOrders: aggregate.openOrders,
        lostOrders: aggregate.lostOrders,
        revenue: Math.round(aggregate.revenue * 100) / 100,
        lastOrderDate: aggregate.lastOrderDate,
        needsClose: aggregate.closedOrders === 0,
      },
    ];
  });

  return sortCalendarRows(rows, input.sort ?? "needs_close");
}
