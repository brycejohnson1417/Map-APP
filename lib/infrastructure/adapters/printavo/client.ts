import "server-only";

import type { FraterniteesLeadOrder } from "@/lib/application/fraternitees/lead-scoring";

export interface PrintavoCredentials {
  email: string;
  apiKey: string;
}

export interface PrintavoStatus {
  id: string;
  name: string;
  type: string;
  color: string | null;
  position: number | null;
}

interface PrintavoGraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class PrintavoRateLimitError extends Error {
  retryAfterSeconds: number | null;

  constructor(message: string, retryAfterSeconds: number | null) {
    super(message);
    this.name = "PrintavoRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface PrintavoStatusNode {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  position?: number | null;
}

interface PrintavoOrderNode {
  __typename: "Invoice" | "Quote";
  id: string;
  visualId: string | null;
  nickname: string | null;
  amountOutstanding: number | null;
  amountPaid: number | null;
  paidInFull: boolean | null;
  status: { id: string; name: string; type: string } | null;
  total: number | null;
  subtotal: number | null;
  totalQuantity: number | null;
  createdAt: string | null;
  startAt: string | null;
  dueAt: string | null;
  invoiceAt: string | null;
  timestamps: {
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
  contact: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    customer: { id: string; companyName: string | null } | null;
  } | null;
  shippingAddress: {
    address1: string | null;
    address2: string | null;
    companyName: string | null;
    customerName: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
  } | null;
  tags: string[];
}

const PRINTAVO_ENDPOINT = "https://www.printavo.com/api/v2";
const MAX_PRINTAVO_PAGE_SIZE = 25;

function parseRetryAfterSeconds(value: string | null) {
  if (!value) {
    return null;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.ceil(seconds);
  }

  const retryAt = new Date(value).getTime();
  if (!Number.isNaN(retryAt)) {
    return Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
  }

  return null;
}

function safeJsonParse<T>(raw: string): PrintavoGraphqlResponse<T> {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as PrintavoGraphqlResponse<T>;
  } catch {
    return {};
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function printavoGraphql<T>(
  credentials: PrintavoCredentials,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(PRINTAVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      email: credentials.email,
      token: credentials.apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const raw = await response.text();
  const payload = safeJsonParse<T>(raw);
  const errorMessage = payload.errors?.length
    ? payload.errors.map((error) => error.message).join("; ")
    : raw.slice(0, 240);

  if (!response.ok) {
    if (response.status === 429) {
      throw new PrintavoRateLimitError(
        errorMessage || "Printavo rate limit reached",
        parseRetryAfterSeconds(response.headers.get("retry-after")),
      );
    }
    throw new Error(`Printavo request failed with status ${response.status}${errorMessage ? `: ${errorMessage}` : ""}`);
  }
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }
  if (!payload.data) {
    throw new Error("Printavo returned an empty response");
  }

  return payload.data;
}

export async function fetchPrintavoStatuses(credentials: PrintavoCredentials, pageLimit = 10): Promise<PrintavoStatus[]> {
  const statuses: PrintavoStatus[] = [];
  let after: string | null = null;

  for (let page = 0; page < pageLimit; page += 1) {
    const data: {
      statuses: {
        nodes: PrintavoStatusNode[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await printavoGraphql(
      credentials,
      `query PrintavoStatuses($after: String) {
        statuses(first: 25, after: $after) {
          nodes {
            id
            name
            type
            color
            position
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      { after },
    );

    statuses.push(
      ...data.statuses.nodes.map((status) => ({
        id: status.id,
        name: status.name,
        type: status.type,
        color: status.color ?? null,
        position: status.position ?? null,
      })),
    );

    if (!data.statuses.pageInfo.hasNextPage) {
      break;
    }
    after = data.statuses.pageInfo.endCursor;
  }

  return statuses;
}

export async function fetchPrintavoLeadOrders(
  credentials: PrintavoCredentials,
  options: {
    pageLimit?: number;
    pageSize?: number;
    after?: string | null;
    pageDelayMs?: number;
    inProductionAfter?: string | null;
    inProductionBefore?: string | null;
  } = {},
): Promise<FraterniteesLeadOrder[]> {
  const batch = await fetchPrintavoLeadOrdersBatch(credentials, options);
  return batch.orders;
}

export async function fetchPrintavoLeadOrdersBatch(
  credentials: PrintavoCredentials,
  options: {
    pageLimit?: number;
    pageSize?: number;
    after?: string | null;
    pageDelayMs?: number;
    inProductionAfter?: string | null;
    inProductionBefore?: string | null;
  } = {},
): Promise<{
  orders: FraterniteesLeadOrder[];
  nextCursor: string | null;
  hasNextPage: boolean;
  pagesFetched: number;
  rateLimited: boolean;
  retryAfterSeconds: number | null;
}> {
  const orders: FraterniteesLeadOrder[] = [];
  let after = options.after ?? null;
  const pageLimit = options.pageLimit ?? 5;
  const pageSize = Math.max(1, Math.min(MAX_PRINTAVO_PAGE_SIZE, Math.floor(options.pageSize ?? 25)));
  const pageDelayMs = Math.max(0, Math.min(3_000, Math.floor(options.pageDelayMs ?? 0)));
  let hasNextPage = false;
  let pagesFetched = 0;
  let rateLimited = false;
  let retryAfterSeconds: number | null = null;

  for (let page = 0; page < pageLimit; page += 1) {
    let data: {
      orders: {
        nodes: PrintavoOrderNode[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };

    try {
      data = await printavoGraphql(
        credentials,
        `query PrintavoOrders($after: String, $inProductionAfter: ISO8601DateTime, $inProductionBefore: ISO8601DateTime) {
        orders(
          first: ${pageSize},
          after: $after,
          sortDescending: true,
          sortOn: VISUAL_ID,
          inProductionAfter: $inProductionAfter,
          inProductionBefore: $inProductionBefore
        ) {
          nodes {
            __typename
            ... on Invoice {
              id
              visualId
              nickname
              amountOutstanding
              amountPaid
              paidInFull
              status { id name type }
              total
              subtotal
              totalQuantity
              createdAt
              startAt
              dueAt
              invoiceAt
              timestamps { createdAt updatedAt }
              contact {
                id
                fullName
                email
                phone
                customer { id companyName }
              }
              shippingAddress { address1 address2 companyName customerName city state zipCode country }
              tags
            }
            ... on Quote {
              id
              visualId
              nickname
              amountOutstanding
              amountPaid
              paidInFull
              status { id name type }
              total
              subtotal
              totalQuantity
              createdAt
              startAt
              dueAt
              invoiceAt
              timestamps { createdAt updatedAt }
              contact {
                id
                fullName
                email
                phone
                customer { id companyName }
              }
              shippingAddress { address1 address2 companyName customerName city state zipCode country }
              tags
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
        {
          after,
          inProductionAfter: options.inProductionAfter ?? null,
          inProductionBefore: options.inProductionBefore ?? null,
        },
      );
    } catch (error) {
      if (error instanceof PrintavoRateLimitError) {
        rateLimited = true;
        retryAfterSeconds = error.retryAfterSeconds ?? 30;
        hasNextPage = true;
        break;
      }
      throw error;
    }

    orders.push(...data.orders.nodes.map(mapPrintavoOrder));
    pagesFetched += 1;
    hasNextPage = data.orders.pageInfo.hasNextPage;
    after = data.orders.pageInfo.endCursor;

    if (!hasNextPage) {
      break;
    }

    if (pageDelayMs > 0 && page + 1 < pageLimit) {
      await sleep(pageDelayMs);
    }
  }

  return {
    orders,
    nextCursor: after,
    hasNextPage: hasNextPage || rateLimited,
    pagesFetched,
    rateLimited,
    retryAfterSeconds,
  };
}

function mapPrintavoOrder(order: PrintavoOrderNode): FraterniteesLeadOrder {
  const companyName = order.contact?.customer?.companyName ?? order.shippingAddress?.companyName;
  const customerName = companyName ?? order.shippingAddress?.customerName ?? order.contact?.fullName ?? `Printavo ${order.id}`;

  return {
    customerName,
    status: order.status?.name ?? null,
    total: typeof order.total === "number" ? order.total : null,
    orderDate: order.invoiceAt ?? order.startAt ?? order.dueAt ?? null,
    externalOrderId: order.id,
    externalCustomerId: order.contact?.customer?.id ?? order.contact?.id ?? null,
    orderNumber: order.visualId,
    eventName: order.nickname,
    contactName: order.contact?.fullName ?? order.shippingAddress?.customerName ?? null,
    contactEmail: order.contact?.email ?? null,
    contactPhone: order.contact?.phone ?? null,
    addressLine1: order.shippingAddress?.address1 ?? null,
    addressLine2: order.shippingAddress?.address2 ?? null,
    quantity: typeof order.totalQuantity === "number" ? order.totalQuantity : null,
    city: order.shippingAddress?.city ?? null,
    state: order.shippingAddress?.state ?? null,
    postalCode: order.shippingAddress?.zipCode ?? null,
    country: order.shippingAddress?.country ?? null,
    paidInFull: order.paidInFull ?? null,
    amountPaid: typeof order.amountPaid === "number" ? order.amountPaid : null,
    amountOutstanding: typeof order.amountOutstanding === "number" ? order.amountOutstanding : null,
    createdAt: order.createdAt ?? order.timestamps?.createdAt ?? null,
    updatedAt: order.timestamps?.updatedAt ?? null,
    source: "printavo",
  };
}
