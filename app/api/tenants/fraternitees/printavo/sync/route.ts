import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  FRATERNITEES_SESSION_COOKIE,
  ensureFraterniteesWorkspace,
  isFraterniteesEmail,
} from "@/lib/application/fraternitees/onboarding-service";
import { importFraterniteesOrdersToRuntime } from "@/lib/application/fraternitees/runtime-import-service";
import { scoreFraterniteesLeads } from "@/lib/application/fraternitees/lead-scoring";
import { fetchPrintavoLeadOrdersBatch } from "@/lib/infrastructure/adapters/printavo/client";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

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

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
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

async function resolvePrintavoCredentials(input: {
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

  const secret = await integrations.readSecret<PrintavoCredentialsSecret>(input.organizationId, integration.id, "credentials");
  if (!secret?.email || !secret.apiKey) {
    return null;
  }

  return secret;
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

async function readPrintavoSyncStatus(organizationId: string) {
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

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionEmail = cookieStore.get(FRATERNITEES_SESSION_COOKIE)?.value ?? "";

  if (!isFraterniteesEmail(sessionEmail)) {
    return NextResponse.json({ ok: false, error: "Fraternitees session required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    apiKey?: string;
    pageLimit?: number;
    pageSize?: number;
    mode?: string;
    reset?: boolean;
  };
  const email = readString(body.email);
  const apiKey = readString(body.apiKey);
  const mode = body.mode === "backfill" ? "backfill" : "latest";
  const pageLimit = numberInRange(body.pageLimit, mode === "backfill" ? 10 : 3, 1, mode === "backfill" ? 20 : 5);
  const pageSize = numberInRange(body.pageSize, 25, 1, 25);

  try {
    const snapshot = await ensureFraterniteesWorkspace(sessionEmail);
    const credentials = await resolvePrintavoCredentials({
      organizationId: snapshot.organizationId,
      email,
      apiKey,
    });
    if (!credentials) {
      return NextResponse.json({ ok: false, error: "Printavo credentials are required or must be saved first." }, { status: 400 });
    }

    const previousBackfill = mode === "backfill" && !body.reset ? await readBackfillCursor(snapshot.organizationId) : {};
    if (mode === "backfill" && previousBackfill.completed === true && !body.reset) {
      return NextResponse.json({
        ok: true,
        imported: {
          accountsSeen: 0,
          createdAccounts: 0,
          updatedAccounts: 0,
          geocodedAccounts: 0,
          geocodingProvider: "openstreetmap",
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
        status: await readPrintavoSyncStatus(snapshot.organizationId),
      });
    }
    const backfillYear = mode === "backfill" ? currentBackfillYear(previousBackfill) : null;
    const backfillWindow = backfillYear ? productionWindowForYear(backfillYear) : null;

    const batch = await fetchPrintavoLeadOrdersBatch(credentials, {
      pageLimit,
      pageSize,
      pageDelayMs: mode === "backfill" ? 250 : 0,
      after: mode === "backfill" ? readString(previousBackfill.nextCursor) : null,
      inProductionAfter: backfillWindow?.inProductionAfter ?? null,
      inProductionBefore: backfillWindow?.inProductionBefore ?? null,
    });
    const orders = batch.orders;
    const importSummary = orders.length
      ? await importFraterniteesOrdersToRuntime({
          organizationId: snapshot.organizationId,
          organizationSlug: snapshot.organizationSlug,
          provider: "printavo",
          orders,
          geocodeAccounts: mode !== "backfill",
        })
      : {
          accountsSeen: 0,
          createdAccounts: 0,
          updatedAccounts: 0,
          geocodedAccounts: 0,
          geocodingProvider: "openstreetmap",
          geocodeAttempts: 0,
          geocodeLimitReachedAccounts: 0,
          upsertedOrders: 0,
          skippedClosedPaidOrders: 0,
        };
    const nextBackfillYear =
      mode === "backfill" && backfillYear !== null && !batch.hasNextPage ? backfillYear - 1 : backfillYear;
    const partitionedHasMore =
      mode === "backfill" && backfillYear !== null && nextBackfillYear !== null
        ? batch.hasNextPage || nextBackfillYear >= PRINTAVO_BACKFILL_MIN_YEAR
        : batch.hasNextPage;
    const backfillCursor =
      mode === "backfill"
        ? await writeBackfillCursor({
            organizationId: snapshot.organizationId,
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

    return NextResponse.json({
      ok: true,
      imported: importSummary,
      sampleOrderCount: orders.length,
      scores: scoreFraterniteesLeads(orders, { limit: 25 }),
      rateLimited: batch.rateLimited,
      retryAfterSeconds: batch.retryAfterSeconds,
      backfill: backfillCursor,
      status: await readPrintavoSyncStatus(snapshot.organizationId),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Printavo sync failed" },
      { status: 502 },
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionEmail = cookieStore.get(FRATERNITEES_SESSION_COOKIE)?.value ?? "";

  if (!isFraterniteesEmail(sessionEmail)) {
    return NextResponse.json({ ok: false, error: "Fraternitees session required." }, { status: 401 });
  }

  try {
    const snapshot = await ensureFraterniteesWorkspace(sessionEmail);
    return NextResponse.json({
      ok: true,
      status: await readPrintavoSyncStatus(snapshot.organizationId),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Printavo sync status failed" },
      { status: 502 },
    );
  }
}
