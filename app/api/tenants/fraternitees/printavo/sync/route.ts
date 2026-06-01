import { NextResponse } from "next/server";
import {
  ensureFraterniteesWorkspace,
} from "@/lib/application/fraternitees/onboarding-service";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { readPrintavoSyncStatus, runPrintavoSync } from "@/lib/application/fraternitees/printavo-sync-service";

export const maxDuration = 60;

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

export async function POST(request: Request) {
  const sessionEmail = await getTenantSessionEmailForSlug("fraternitees");
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Fraternitees session required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    pageLimit?: number;
    pageSize?: number;
    mode?: string;
    reset?: boolean;
  };
  const mode = body.mode === "backfill" ? "backfill" : "latest";
  const pageLimit = numberInRange(body.pageLimit, mode === "backfill" ? 10 : 3, 1, mode === "backfill" ? 20 : 5);
  const pageSize = numberInRange(body.pageSize, 25, 1, 25);

  try {
    const snapshot = await ensureFraterniteesWorkspace(sessionEmail);
    const result = await runPrintavoSync({
      organizationId: snapshot.organizationId,
      organizationSlug: snapshot.organizationSlug,
      mode,
      pageLimit,
      pageSize,
      reset: body.reset === true,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Printavo sync failed" },
      { status: 502 },
    );
  }
}

export async function GET() {
  const sessionEmail = await getTenantSessionEmailForSlug("fraternitees");
  if (!sessionEmail) {
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
