import "server-only";

import type { FraterniteesLeadOrder } from "@/lib/application/fraternitees/lead-scoring";
import type {
  OrderingAdapterCursorState,
  OrderingPlatformAdapter,
  OrderingPlatformContact,
  OrderingPlatformCustomer,
} from "@/lib/application/screenprinting/adapters";
import {
  fetchPrintavoLeadOrdersBatch,
  fetchPrintavoStatuses,
  type PrintavoCredentials,
} from "@/lib/infrastructure/adapters/printavo/client";

function printavoOrderUrl(externalOrderId: string) {
  return externalOrderId ? `https://www.printavo.com/orders/${encodeURIComponent(externalOrderId)}` : null;
}

function printavoCustomerUrl(externalCustomerId: string) {
  return externalCustomerId ? `https://www.printavo.com/customers/${encodeURIComponent(externalCustomerId)}` : null;
}

export function createPrintavoOrderingAdapter(credentials: PrintavoCredentials): OrderingPlatformAdapter<FraterniteesLeadOrder> {
  return {
    provider: "printavo",
    mode: "read_only",
    async listStatuses() {
      return fetchPrintavoStatuses(credentials);
    },
    async fetchOrders(input = {}) {
      return fetchPrintavoLeadOrdersBatch(credentials, input);
    },
    async fetchCustomers(input = {}) {
      const batch = await fetchPrintavoLeadOrdersBatch(credentials, {
        pageLimit: input.limit ? Math.min(Math.ceil(input.limit / 25), 5) : 2,
      });
      const byCustomerId = new Map<string, OrderingPlatformCustomer>();
      for (const order of batch.orders) {
        const key = order.externalCustomerId ?? order.customerName.toLowerCase();
        if (!byCustomerId.has(key)) {
          byCustomerId.set(key, {
            externalCustomerId: order.externalCustomerId ?? null,
            name: order.customerName,
            email: order.contactEmail ?? null,
            phone: order.contactPhone ?? null,
            sourcePayload: { source: "printavo", sampledFromOrderId: order.externalOrderId },
          });
        }
      }
      return [...byCustomerId.values()];
    },
    async fetchContacts(input = {}) {
      const batch = await fetchPrintavoLeadOrdersBatch(credentials, {
        pageLimit: input.limit ? Math.min(Math.ceil(input.limit / 25), 5) : 2,
      });
      const byContact = new Map<string, OrderingPlatformContact>();
      for (const order of batch.orders) {
        const fullName = order.contactName ?? order.contactEmail ?? order.customerName;
        const key = `${order.externalCustomerId ?? order.customerName}:${order.contactEmail ?? fullName}`.toLowerCase();
        if (!byContact.has(key)) {
          byContact.set(key, {
            externalContactId: null,
            externalCustomerId: order.externalCustomerId ?? null,
            fullName,
            email: order.contactEmail ?? null,
            phone: order.contactPhone ?? null,
            sourcePayload: { source: "printavo", sampledFromOrderId: order.externalOrderId },
          });
        }
      }
      return [...byContact.values()];
    },
    sourceOrderUrl: printavoOrderUrl,
    sourceCustomerUrl: printavoCustomerUrl,
    readCursorState(input): OrderingAdapterCursorState {
      const cursorPayload = input.cursorPayload ?? {};
      return {
        provider: "printavo",
        scope: input.scope,
        status: cursorPayload.completed === true ? "success" : cursorPayload.hasMore === true ? "running" : "idle",
        nextCursor: typeof cursorPayload.nextCursor === "string" ? cursorPayload.nextCursor : null,
        hasMore: cursorPayload.hasMore === true,
        rateLimited: cursorPayload.rateLimited === true,
        retryAfterSeconds:
          typeof cursorPayload.retryAfterSeconds === "number" && Number.isFinite(cursorPayload.retryAfterSeconds)
            ? cursorPayload.retryAfterSeconds
            : null,
        metadata: cursorPayload,
      };
    },
  };
}
