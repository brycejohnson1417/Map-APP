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
  priority: "Priority" | "Nurture" | "Watch" | "Do Not Contact review";
  closeRate: number | null;
  closedOrders: number;
  lostOrders: number;
  openOrders: number;
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

function scoreGroup(customerName: string, orders: FraterniteesLeadOrder[], now: Date): FraterniteesLeadScore {
  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = parseDate(a.orderDate)?.getTime() ?? 0;
    const bDate = parseDate(b.orderDate)?.getTime() ?? 0;
    return bDate - aDate;
  });
  const closedOrders = sortedOrders.filter((order) => classifyFraterniteesStatus(order.status) === "closed");
  const lostOrders = sortedOrders.filter((order) => classifyFraterniteesStatus(order.status) === "lost");
  const openOrders = sortedOrders.length - closedOrders.length - lostOrders.length;
  const totalOpportunities = closedOrders.length + lostOrders.length;
  const closeRate = totalOpportunities ? closedOrders.length / totalOpportunities : null;
  const closedValues = closedOrders.map((order) => order.total ?? 0).filter((value) => value > 0);
  const closedRevenue = closedValues.reduce((sum, value) => sum + value, 0);
  const maxOrderValue = sortedOrders.reduce((max, order) => Math.max(max, order.total ?? 0), 0);
  const averageClosedOrderValue = closedValues.length ? closedRevenue / closedValues.length : 0;
  const medianClosedOrderValue = median(closedValues);
  const lastOrderDate = sortedOrders.map((order) => parseDate(order.orderDate)).find((date): date is Date => Boolean(date)) ?? null;
  const last12Cutoff = new Date(now);
  last12Cutoff.setUTCFullYear(last12Cutoff.getUTCFullYear() - 1);

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
  const recencyScore = recencyDays <= 45 ? 15 : recencyDays <= 120 ? 10 : recencyDays <= 240 ? 5 : 0;
  const closeRateScore = closeRate === null ? 12 : closeRate * 45;
  const consistencyScore = clamp(closedMonthsLast12.size / 6, 0, 1) * 25;
  const orderValueScore = clamp(medianClosedOrderValue / 1500, 0, 1) * 15;
  const penalty = (highTicketVolatility ? 18 : 0) + Math.min(ghostOrHardLosses * 4, 16);
  const rawScore = closeRateScore + consistencyScore + orderValueScore + recencyScore - penalty;
  const score = Math.round(clamp(rawScore, 0, 100));
  const dncRecommendedUntil = lostOrders.length >= 3 ? addYears(now, 2).toISOString().slice(0, 10) : null;

  let priority: FraterniteesLeadScore["priority"] = "Nurture";
  if (lostOrders.length >= 3) {
    priority = "Do Not Contact review";
  } else if ((closeRate ?? 0) >= 0.8 && medianClosedOrderValue >= 1500 && closedMonthsLast12.size >= 3) {
    priority = "Priority";
  } else if ((closeRate ?? 0) < 0.5 && totalOpportunities >= 3) {
    priority = "Watch";
  }

  const reasons: string[] = [];
  if (closeRate !== null) {
    reasons.push(`${Math.round(closeRate * 100)}% close rate across ${totalOpportunities} closed/lost opportunities`);
  } else {
    reasons.push("No terminal closed/lost outcome yet");
  }
  if (closedMonthsLast12.size) {
    reasons.push(`${closedMonthsLast12.size} ordering month${closedMonthsLast12.size === 1 ? "" : "s"} in the last 12 months`);
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
    priority,
    closeRate,
    closedOrders: closedOrders.length,
    lostOrders: lostOrders.length,
    openOrders,
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
