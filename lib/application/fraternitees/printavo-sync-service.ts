import "server-only";

import { importFraterniteesOrdersToRuntime } from "@/lib/application/fraternitees/runtime-import-service";
import { scoreFraterniteesLeads } from "@/lib/application/fraternitees/lead-scoring";
import { fetchPrintavoLeadOrdersBatch } from "@/lib/infrastructure/adapters/printavo/client";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const integrations = new IntegrationRepository();
const BACKFILL_SCOPE = "orders_accounts_backfill_all";
const LEGACY_BACKFILL_SCOPE = "orders_accounts_backfill";
const PRINTAVO_BACKFILL_MIN_YEAR = 2000;

interface PrintavoCredentialsSecret {
  email: string;
  apiKey: string;
}

interface SyncCursorRow {
  cursor_payload: Record<string, unknown> | null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function currentBackfillYear(payload: Record<string, unknown>) {
  const year = readNumber(payload.currentYear);
  return year ? Math.floor(year) : new Date().getUTCFullYear();
}

function productionWindowForYear(year: number) {
  return {
    year,
    inProductionAfter: `${year}-01-01T00:00:00.000Z`,
    inProductionBefore: `${year + 1}-01-01T00:00:00.000Z`,
  };
}

async function readBackfillCursor(organizationId: string, scope = BACKFILL_SCOPE) {
  const supabase = getSupabaseAdminClient() as any;
  const { data, error } = await supabase
    .from("sync_cursor")
    .select("cursor_payload")
    .eq("organization_id", organizationId)
    .eq("provider", "printavo")
    .eq("scope", scope)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return ((data as SyncCursorRow | null)?.cursor_payload ?? {}) as Record<string, unknown>;
}

async function writeBackfillCursor(input: {
  organizationId: string;
  scope?: string;
  nextCursor: string | null;
  hasMore: boolean;
  fetchedOrders: number;
  pagesFetched: number;
  rateLimited: boolean;
  retryAfterSeconds: number | null;
  previousPayload: Record<string, unknown>;
  payloadPatch?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient() as any;
  const previousFetched = typeof input.previousPayload.fetchedOrders === "number" ? input.previousPayload.fetchedOrders : 0;
  const previousPages = typeof input.previousPayload.pagesFetched === "number" ? input.previousPayload.pagesFetched : 0;
  const cursorPayload = {
    ...input.payloadPatch,
    nextCursor: input.hasMore ? input.nextCursor : null,
    hasMore: input.hasMore,
    completed: !input.hasMore,
    rateLimited: input.rateLimited,
    retryAfterSeconds: input.retryAfterSeconds,
    lastRateLimitedAt: input.rateLimited ? new Date().toISOString() : null,
    fetchedOrders: previousFetched + input.fetchedOrders,
    pagesFetched: previousPages + input.pagesFetched,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from("sync_cursor").upsert(
    {
      organization_id: input.organizationId,
      provider: "printavo",
      scope: input.scope ?? BACKFILL_SCOPE,
      cursor_payload: cursorPayload,
      status: input.hasMore ? "running" : "success",
      last_successful_sync_at: input.hasMore ? null : new Date().toISOString(),
      last_attempted_sync_at: new Date().toISOString(),
      last_error: null,
    },
    {
      onConflict: "organization_id,provider,scope",
    },
  );

  if (error) {
    throw error;
  }

  return cursorPayload;
}

export async function resolveStoredPrintavoCredentials(input: {
  organizationId: string;
  email: string | null;
  apiKey: string | null;
}) {
  if (input.email && input.apiKey) {
    return { email: input.email, apiKey: input.apiKey };
  }

  const integration = await integrations.findByProvider(input.organizationId, "printavo");
  if (!integration) {
    return null;
  }

  const secret =
    (await integrations.readSecret<PrintavoCredentialsSecret>(input.organizationId, integration.id, "credentials")) ??
    (await integrations.readSecret<{ email?: string; apiKey?: string }>(input.organizationId, integration.id, "selfServeForm"));

  if (!secret?.email || !secret.apiKey) {
    return null;
  }

  return {
    email: secret.email,
    apiKey: secret.apiKey,
  };
}

export async function readPrintavoSyncStatus(organizationId: string) {
  const supabase = getSupabaseAdminClient() as any;
  const [accounts, orders, cursors] = await Promise.all([
    supabase.from("account").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("order_record").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("provider", "printavo"),
    supabase
      .from("sync_cursor")
      .select("scope,status,cursor_payload,last_successful_sync_at,last_attempted_sync_at,last_error")
      .eq("organization_id", organizationId)
      .eq("provider", "printavo")
      .order("scope", { ascending: true }),
  ]);

  if (accounts.error) {
    throw accounts.error;
  }
  if (orders.error) {
    throw orders.error;
  }
  if (cursors.error) {
    throw cursors.error;
  }

  const backfillCursor =
    (cursors.data ?? []).find((cursor: { scope: string }) => cursor.scope === BACKFILL_SCOPE) ??
    (cursors.data ?? []).find((cursor: { scope: string }) => cursor.scope === LEGACY_BACKFILL_SCOPE);

  return {
    accounts: accounts.count ?? 0,
    orders: orders.count ?? 0,
    backfill: backfillCursor?.cursor_payload ?? {},
    cursors: cursors.data ?? [],
  };
}

export async function runPrintavoSync(input: {
  organizationId: string;
  organizationSlug: string;
  email: string | null;
  apiKey: string | null;
  mode: "latest" | "backfill";
  pageLimit: number;
  pageSize: number;
  reset?: boolean;
}) {
  const credentials = await resolveStoredPrintavoCredentials({
    organizationId: input.organizationId,
    email: input.email,
    apiKey: input.apiKey,
  });
  if (!credentials) {
    throw new Error("Printavo credentials are required or must be saved first.");
  }

  const previousBackfill = input.mode === "backfill" && !input.reset ? await readBackfillCursor(input.organizationId) : {};
  if (input.mode === "backfill" && previousBackfill.completed === true && !input.reset) {
    return {
      imported: {
        accountsSeen: 0,
        createdAccounts: 0,
        updatedAccounts: 0,
        geocodedAccounts: 0,
        geocodingProvider: "openstreetmap" as const,
        geocodeAttempts: 0,
        geocodeLimitReachedAccounts: 0,
        upsertedOrders: 0,
        skippedClosedPaidOrders: 0,
      },
      sampleOrderCount: 0,
      scores: [],
      rateLimited: false,
      retryAfterSeconds: null,
      backfill: {
        hasMore: false,
        completed: true,
        fetchedOrders: previousBackfill.fetchedOrders ?? 0,
        pagesFetched: previousBackfill.pagesFetched ?? 0,
        rateLimited: false,
        retryAfterSeconds: null,
      },
      status: await readPrintavoSyncStatus(input.organizationId),
    };
  }

  const backfillYear = input.mode === "backfill" ? currentBackfillYear(previousBackfill) : null;
  const backfillWindow = backfillYear ? productionWindowForYear(backfillYear) : null;
  const batch = await fetchPrintavoLeadOrdersBatch(credentials, {
    pageLimit: input.pageLimit,
    pageSize: input.pageSize,
    pageDelayMs: input.mode === "backfill" ? 250 : 0,
    after: input.mode === "backfill" ? readString(previousBackfill.nextCursor) : null,
    inProductionAfter: backfillWindow?.inProductionAfter ?? null,
    inProductionBefore: backfillWindow?.inProductionBefore ?? null,
  });
  const orders = batch.orders;
  const importSummary = orders.length
    ? await importFraterniteesOrdersToRuntime({
        organizationId: input.organizationId,
        organizationSlug: input.organizationSlug,
        provider: "printavo",
        orders,
        geocodeAccounts: input.mode !== "backfill",
      })
    : {
        accountsSeen: 0,
        createdAccounts: 0,
        updatedAccounts: 0,
        geocodedAccounts: 0,
        geocodingProvider: "openstreetmap" as const,
        geocodeAttempts: 0,
        geocodeLimitReachedAccounts: 0,
        upsertedOrders: 0,
        skippedClosedPaidOrders: 0,
      };
  const nextBackfillYear =
    input.mode === "backfill" && backfillYear !== null && !batch.hasNextPage ? backfillYear - 1 : backfillYear;
  const partitionedHasMore =
    input.mode === "backfill" && backfillYear !== null && nextBackfillYear !== null
      ? batch.hasNextPage || nextBackfillYear >= PRINTAVO_BACKFILL_MIN_YEAR
      : batch.hasNextPage;
  const backfillCursor =
    input.mode === "backfill"
      ? await writeBackfillCursor({
          organizationId: input.organizationId,
          scope: BACKFILL_SCOPE,
          nextCursor: batch.hasNextPage ? batch.nextCursor : null,
          hasMore: partitionedHasMore,
          fetchedOrders: orders.length,
          pagesFetched: batch.pagesFetched,
          rateLimited: batch.rateLimited,
          retryAfterSeconds: batch.retryAfterSeconds,
          previousPayload: previousBackfill,
          payloadPatch: {
            strategy: "yearly_production_windows",
            minYear: PRINTAVO_BACKFILL_MIN_YEAR,
            currentYear: partitionedHasMore ? nextBackfillYear : backfillYear,
            completedYear: batch.hasNextPage ? null : backfillYear,
            window: backfillWindow,
          },
        })
      : null;

  return {
    imported: importSummary,
    sampleOrderCount: orders.length,
    scores: scoreFraterniteesLeads(orders, { limit: 25 }),
    rateLimited: batch.rateLimited,
    retryAfterSeconds: batch.retryAfterSeconds,
    backfill: backfillCursor,
    status: await readPrintavoSyncStatus(input.organizationId),
  };
}
