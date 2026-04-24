export const FRATERNITEES_POSITIVE_STATUSES = [
  "Order Placed Townsend",
  "Order Placed Night Shift",
  "Order Placed Black Rock",
  "Order Placed Make Life",
  "Order Placed Sage",
] as const;

export const FRATERNITEES_NEGATIVE_STATUSES = [
  "Order Canceled",
  "Order Canceled - Art",
  "Order Canceled - Not enough interest",
  "Order Canceled - Other company",
  "Order Canceled - New design",
  "Order Canceled - GHOST",
  "Order Canceled - Design REJECTED",
  "Order Canceled - Event Cancelled",
] as const;

export const FRATERNITEES_STATUS_FILTERS = [
  {
    label: "Closed order handoff",
    intent: "Won orders that should count toward close rate.",
    statuses: FRATERNITEES_POSITIVE_STATUSES,
  },
  {
    label: "Canceled or lost",
    intent: "Lost opportunities that should count against close rate.",
    statuses: FRATERNITEES_NEGATIVE_STATUSES,
  },
  {
    label: "Art or files needed",
    intent: "Orders blocked by artwork, files, revisions, or internal review.",
    statuses: [
      "Artwork Requested Allen",
      "Revision Requested Allen",
      "Files Requested Allen",
      "Artwork Requested Maya",
      "Revision Requested Maya",
      "Files Requested Maya",
      "Artwork Requested Kayla",
      "Revision Requested Kayla",
      "Files Requested Kayla",
      "Artwork Requested Katie",
      "Revision Requested Katie",
      "Files Requested Katie",
      "Artwork Requested Carly",
      "Revision Requested Carly",
      "Files Requested Carly",
      "Artwork Requested Bryson",
      "Revision Requested Bryson",
      "Files Requested Bryson",
      "Artwork Requested Paige",
      "Revision Requested Paige",
      "Files Requested Paige",
      "Art Request with customer files",
      "ART HOLD PLS CONTACT ALLEN",
      "HIGH PRIORITEE ART",
    ],
  },
  {
    label: "Approval and production",
    intent: "Operational statuses that show demand but are not always the close-rate handoff point.",
    statuses: [
      "Art - Awaiting Customer Approval",
      "Art approved",
      "Invoice reviewed and approved",
      "Ready to print",
      "Blanks Ordered",
      "RUSH ORDER",
      "DROP READY",
      "Completed",
      "Shipped by Townsend",
      "Shipped by Night Shift",
    ],
  },
  {
    label: "Follow-up risk",
    intent: "Needs human review before a rep spends high-effort selling time.",
    statuses: [
      "Quote",
      "LINK",
      "THIS LINK IS CLOSED",
      "POSTPONED",
      "Design rejected - pls request revision",
      "REFUND THESE PLS",
      "Resubmit Again Pls",
      "pls request files",
    ],
  },
] as const;

export type FraterniteesStatusBucket =
  | "closed"
  | "lost"
  | "quote"
  | "art"
  | "approval"
  | "production"
  | "risk"
  | "open";

export type FraterniteesLeadGrade = "A+" | "A" | "B" | "C" | "D" | "F" | "Unscored";

export interface FraterniteesLeadOrder {
  customerName: string;
  status: string | null;
  total: number | null;
  orderDate: string | null;
  externalOrderId?: string | null;
  externalCustomerId?: string | null;
  orderNumber?: string | null;
  eventName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  quantity?: number | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  paidInFull?: boolean | null;
  amountPaid?: number | null;
  amountOutstanding?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  source?: "printavo";
}

export interface FraterniteesLeadScore {
  customerName: string;
  score: number;
  grade: FraterniteesLeadGrade;
  priority: "Priority" | "Nurture" | "Watch" | "Do Not Contact review";
  closeRate: number | null;
  closedOrders: number;
  lostOrders: number;
  openOrders: number;
  totalOrders: number;
  totalOpportunities: number;
  closedRevenue: number;
  averageClosedOrderValue: number;
  medianClosedOrderValue: number;
  maxOrderValue: number;
  monthsWithClosedOrdersLast12: number;
  averageMonthlyClosedRevenueLast12: number;
  lastOrderDate: string | null;
  ghostOrHardLosses: number;
  highTicketVolatility: boolean;
  dncRecommendedUntil: string | null;
  statusMix: Array<{ status: string; count: number; bucket: FraterniteesStatusBucket }>;
  reasons: string[];
  orders: FraterniteesLeadOrder[];
}

export interface FraterniteesLeadTrendPeriod {
  label: string;
  startDate: string;
  endDate: string;
  score: number | null;
  grade: FraterniteesLeadGrade;
  closeRate: number | null;
  closedOrders: number;
  lostOrders: number;
  totalOrders: number;
  closedRevenue: number;
}

export interface FraterniteesLeadTrendSummary {
  direction: "up" | "down" | "flat" | "insufficient_data";
  delta: number | null;
  current: FraterniteesLeadTrendPeriod;
  previous: FraterniteesLeadTrendPeriod;
}

interface FraterniteesGradeInput {
  score: number | null;
  closeRate: number | null;
  closedOrders: number;
  lostOrders: number;
  openOrders: number;
  closedRevenue: number;
  monthsWithClosedOrdersLast12: number;
}

const closedStatusSet = new Set(FRATERNITEES_POSITIVE_STATUSES.map(normalizeStatus));
const lostStatusSet = new Set(FRATERNITEES_NEGATIVE_STATUSES.map(normalizeStatus));

function normalizeStatus(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeCustomerName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function median(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function shiftUtcYears(date: Date, years: number) {
  const next = new Date(date);
  next.setUTCFullYear(next.getUTCFullYear() + years);
  return next;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function classifyFraterniteesStatus(status: string | null | undefined): FraterniteesStatusBucket {
  const normalized = normalizeStatus(status ?? "");

  if (!normalized) {
    return "open";
  }
  if (closedStatusSet.has(normalized) || normalized === "completed" || normalized.startsWith("shipped by")) {
    return "closed";
  }
  if (lostStatusSet.has(normalized)) {
    return "lost";
  }
  if (normalized === "quote") {
    return "quote";
  }
  if (
    normalized.includes("artwork requested") ||
    normalized.includes("revision requested") ||
    normalized.includes("files requested") ||
    normalized.includes("art hold") ||
    normalized.includes("art request") ||
    normalized.includes("review")
  ) {
    return "art";
  }
  if (normalized.includes("approved") || normalized.includes("awaiting customer approval")) {
    return "approval";
  }
  if (
    normalized.includes("ready to print") ||
    normalized.includes("blanks ordered") ||
    normalized.includes("rush order") ||
    normalized.includes("drop ready") ||
    normalized.includes("print on demand")
  ) {
    return "production";
  }
  if (
    normalized.includes("ghost") ||
    normalized.includes("postponed") ||
    normalized.includes("refund") ||
    normalized.includes("rejected") ||
    normalized.includes("link is closed") ||
    normalized.includes("resubmit")
  ) {
    return "risk";
  }

  return "open";
}

function isGhostOrHardLoss(status: string | null | undefined) {
  const normalized = normalizeStatus(status ?? "");
  return (
    normalized.includes("ghost") ||
    normalized.includes("not enough interest") ||
    normalized.includes("other company") ||
    normalized.includes("event cancelled") ||
    normalized.includes("design rejected")
  );
}

function summarizeStatusMix(orders: FraterniteesLeadOrder[]) {
  const counts = new Map<string, { count: number; bucket: FraterniteesStatusBucket }>();

  for (const order of orders) {
    const status = order.status?.trim() || "No status";
    const current = counts.get(status);
    if (current) {
      current.count += 1;
      continue;
    }
    counts.set(status, {
      count: 1,
      bucket: classifyFraterniteesStatus(status),
    });
  }

  return [...counts.entries()]
    .map(([status, detail]) => ({ status, count: detail.count, bucket: detail.bucket }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

export function gradeFraterniteesLead(input: FraterniteesGradeInput): FraterniteesLeadGrade {
  if (input.score === null) {
    return "Unscored";
  }

  const totalOrders = input.closedOrders + input.lostOrders + input.openOrders;
  const normalizedCloseRate = input.closeRate ?? 0;

  if ((totalOrders <= 2 && input.lostOrders >= 2) || (input.lostOrders >= 4 && normalizedCloseRate < 0.4)) {
    return "F";
  }

  if (
    input.score >= 90 &&
    normalizedCloseRate >= 0.8 &&
    input.closedOrders >= 5 &&
    input.lostOrders <= 1
  ) {
    return "A+";
  }

  if (
    input.score >= 82 &&
    normalizedCloseRate >= 0.65 &&
    input.closedOrders >= 3
  ) {
    return "A";
  }

  if (input.score >= 72) {
    return "B";
  }

  if (input.score >= 58) {
    return "C";
  }

  if (input.score >= 45) {
    return "D";
  }

  return "F";
}

function scoreGroup(customerName: string, orders: FraterniteesLeadOrder[], now: Date): FraterniteesLeadScore {
  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = parseDate(a.orderDate)?.getTime() ?? 0;
    const bDate = parseDate(b.orderDate)?.getTime() ?? 0;
    return bDate - aDate;
  });
  const closedOrders = sortedOrders.filter((order) => classifyFraterniteesStatus(order.status) === "closed");
  const lostOrders = sortedOrders.filter((order) => classifyFraterniteesStatus(order.status) === "lost");
  const openOrders = sortedOrders.length - closedOrders.length - lostOrders.length;
  const totalOrders = sortedOrders.length;
  const totalOpportunities = closedOrders.length + lostOrders.length;
  const closeRate = totalOpportunities ? closedOrders.length / totalOpportunities : null;
  const closedValues = closedOrders.map((order) => order.total ?? 0).filter((value) => value > 0);
  const closedRevenue = closedValues.reduce((sum, value) => sum + value, 0);
  const maxOrderValue = sortedOrders.reduce((max, order) => Math.max(max, order.total ?? 0), 0);
  const averageClosedOrderValue = closedValues.length ? closedRevenue / closedValues.length : 0;
  const medianClosedOrderValue = median(closedValues);
  const lastOrderDate = sortedOrders.map((order) => parseDate(order.orderDate)).find((date): date is Date => Boolean(date)) ?? null;
  const last12Cutoff = shiftUtcYears(now, -1);

  const closedMonthsLast12 = new Set<string>();
  let closedRevenueLast12 = 0;
  for (const order of closedOrders) {
    const date = parseDate(order.orderDate);
    if (!date || date < last12Cutoff) {
      continue;
    }
    closedMonthsLast12.add(monthKey(date));
    closedRevenueLast12 += order.total ?? 0;
  }

  const ghostOrHardLosses = sortedOrders.filter((order) => isGhostOrHardLoss(order.status)).length;
  const highTicketDate = sortedOrders
    .filter((order) => (order.total ?? 0) >= 6000)
    .map((order) => parseDate(order.orderDate))
    .find((date): date is Date => Boolean(date));
  const hardLossesAfterHighTicket = highTicketDate
    ? sortedOrders.filter((order) => {
        const date = parseDate(order.orderDate);
        return date && date > highTicketDate && (classifyFraterniteesStatus(order.status) === "lost" || isGhostOrHardLoss(order.status));
      }).length
    : 0;
  const highTicketVolatility =
    maxOrderValue >= 6000 &&
    (closedOrders.length <= 1 || hardLossesAfterHighTicket >= 3 || (closeRate !== null && closeRate < 0.35));

  const recencyDays = lastOrderDate ? Math.max(0, Math.floor((now.getTime() - lastOrderDate.getTime()) / 86_400_000)) : 999;
  const closeRateScore = closeRate === null ? 10 : clamp(closeRate, 0, 1) * 36;
  const orderCountScore = clamp(closedOrders.length / 12, 0, 1) * 18;
  const consistencyScore = clamp(closedMonthsLast12.size / 8, 0, 1) * 12;
  const revenueScore = clamp(closedRevenue / 12_000, 0, 1) * 18;
  const recentRevenueScore = clamp(closedRevenueLast12 / 12_000, 0, 1) * 8;
  const recencyScore = recencyDays <= 60 ? 8 : recencyDays <= 120 ? 5 : recencyDays <= 240 ? 2 : 0;
  const lostOrdersPenalty = Math.min(lostOrders.length * 6, 24);
  const hardLossPenalty = Math.min(ghostOrHardLosses * 4, 12);
  const volatilityPenalty = highTicketVolatility ? 8 : 0;
  const rawScore =
    closeRateScore +
    orderCountScore +
    consistencyScore +
    revenueScore +
    recentRevenueScore +
    recencyScore -
    lostOrdersPenalty -
    hardLossPenalty -
    volatilityPenalty;
  const score = Math.round(clamp(rawScore, 0, 100));
  const grade = gradeFraterniteesLead({
    score,
    closeRate,
    closedOrders: closedOrders.length,
    lostOrders: lostOrders.length,
    openOrders,
    closedRevenue,
    monthsWithClosedOrdersLast12: closedMonthsLast12.size,
  });
  const dncRecommendedUntil = lostOrders.length >= 3 ? addYears(now, 2).toISOString().slice(0, 10) : null;

  let priority: FraterniteesLeadScore["priority"] = "Nurture";
  if (lostOrders.length >= 3) {
    priority = "Do Not Contact review";
  } else if (grade === "A+" || grade === "A") {
    priority = "Priority";
  } else if (grade === "D" || grade === "F" || highTicketVolatility) {
    priority = "Watch";
  }

  const reasons: string[] = [];
  if (closeRate !== null) {
    reasons.push(`${Math.round(closeRate * 100)}% close rate across ${totalOpportunities} closed/lost opportunities`);
  } else {
    reasons.push("No terminal closed/lost outcome yet");
  }
  reasons.push(`${totalOrders} total order${totalOrders === 1 ? "" : "s"} on record`);
  if (closedMonthsLast12.size) {
    reasons.push(`${closedMonthsLast12.size} ordering month${closedMonthsLast12.size === 1 ? "" : "s"} in the last 12 months`);
  }
  if (closedRevenue > 0) {
    reasons.push(`$${Math.round(closedRevenue).toLocaleString("en-US")} closed revenue lifetime`);
  }
  if (medianClosedOrderValue >= 1500) {
    reasons.push(`Median closed order is $${Math.round(medianClosedOrderValue).toLocaleString("en-US")}`);
  }
  if (highTicketVolatility) {
    reasons.push("High-ticket volatility flagged because the account shows large-order upside without repeat consistency");
  }
  if (ghostOrHardLosses) {
    reasons.push(`${ghostOrHardLosses} ghost or hard-loss outcome${ghostOrHardLosses === 1 ? "" : "s"}`);
  }
  if (lostOrders.length >= 3) {
    reasons.push("DNC flagged because this organization has at least 3 cancelled orders");
  }

  return {
    customerName,
    score,
    grade,
    priority,
    closeRate,
    closedOrders: closedOrders.length,
    lostOrders: lostOrders.length,
    openOrders,
    totalOrders,
    totalOpportunities,
    closedRevenue: roundCurrency(closedRevenue),
    averageClosedOrderValue: roundCurrency(averageClosedOrderValue),
    medianClosedOrderValue: roundCurrency(medianClosedOrderValue),
    maxOrderValue: roundCurrency(maxOrderValue),
    monthsWithClosedOrdersLast12: closedMonthsLast12.size,
    averageMonthlyClosedRevenueLast12: roundCurrency(closedRevenueLast12 / 12),
    lastOrderDate: lastOrderDate ? lastOrderDate.toISOString().slice(0, 10) : null,
    ghostOrHardLosses,
    highTicketVolatility,
    dncRecommendedUntil,
    statusMix: summarizeStatusMix(sortedOrders),
    reasons,
    orders: sortedOrders,
  };
}

export function scoreFraterniteesLeads(
  orders: FraterniteesLeadOrder[],
  options: { now?: Date; limit?: number } = {},
): FraterniteesLeadScore[] {
  const now = options.now ?? new Date();
  const groups = new Map<string, FraterniteesLeadOrder[]>();

  for (const order of orders) {
    const customerName = normalizeCustomerName(order.customerName);
    if (!customerName) {
      continue;
    }
    const group = groups.get(customerName) ?? [];
    group.push({
      ...order,
      customerName,
      status: order.status?.trim() || null,
      total: typeof order.total === "number" && Number.isFinite(order.total) ? order.total : null,
      orderDate: order.orderDate?.trim() || null,
    });
    groups.set(customerName, group);
  }

  return [...groups.entries()]
    .map(([customerName, groupOrders]) => scoreGroup(customerName, groupOrders, now))
    .sort((a, b) => b.score - a.score || b.closedRevenue - a.closedRevenue || a.customerName.localeCompare(b.customerName))
    .slice(0, options.limit ?? 100);
}

function buildTrendPeriod(
  label: string,
  orders: FraterniteesLeadOrder[],
  startDate: Date,
  endDate: Date,
  scoreAsOf: Date,
): FraterniteesLeadTrendPeriod {
  const scopedOrders = orders.filter((order) => {
    const orderDate = parseDate(order.orderDate);
    return Boolean(orderDate && orderDate >= startDate && orderDate < endDate);
  });

  if (!scopedOrders.length) {
    return {
      label,
      startDate: toDateOnly(startDate),
      endDate: toDateOnly(endDate),
      score: null,
      grade: "Unscored",
      closeRate: null,
      closedOrders: 0,
      lostOrders: 0,
      totalOrders: 0,
      closedRevenue: 0,
    };
  }

  const summary = scoreGroup(scopedOrders[0]?.customerName ?? "Account", scopedOrders, scoreAsOf);

  return {
    label,
    startDate: toDateOnly(startDate),
    endDate: toDateOnly(endDate),
    score: summary.score,
    grade: summary.grade,
    closeRate: summary.closeRate,
    closedOrders: summary.closedOrders,
    lostOrders: summary.lostOrders,
    totalOrders: summary.totalOrders,
    closedRevenue: summary.closedRevenue,
  };
}

export function buildFraterniteesLeadTrendSummary(
  orders: FraterniteesLeadOrder[],
  options: { now?: Date } = {},
): FraterniteesLeadTrendSummary {
  const now = options.now ?? new Date();
  const currentStart = shiftUtcYears(now, -1);
  const previousStart = shiftUtcYears(currentStart, -1);

  const previous = buildTrendPeriod("Previous 12 months", orders, previousStart, currentStart, currentStart);
  const current = buildTrendPeriod("Current 12 months", orders, currentStart, now, now);

  let direction: FraterniteesLeadTrendSummary["direction"] = "insufficient_data";
  let delta: number | null = null;

  if (current.score !== null && previous.score !== null) {
    delta = current.score - previous.score;
    direction = delta >= 5 ? "up" : delta <= -5 ? "down" : "flat";
  } else if (current.totalOrders > 0 && previous.totalOrders === 0) {
    direction = "up";
  } else if (current.totalOrders === 0 && previous.totalOrders > 0) {
    direction = "down";
  } else if (current.totalOrders > 0 || previous.totalOrders > 0) {
    direction = "flat";
  }

  return {
    direction,
    delta,
    current,
    previous,
  };
}
