import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { runPrintavoSync, readPrintavoSyncStatus } from "@/lib/application/fraternitees/printavo-sync-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export const maxDuration = 60;

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveWorkspaceOrError(slug: string) {
  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return {
      workspace,
      error: NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 }),
    };
  }

  const hasPrintavo = workspace.workspace.connectors.some((connector) => connector.provider === "printavo");
  if (!hasPrintavo) {
    return {
      workspace,
      error: NextResponse.json({ ok: false, error: `Printavo is not enabled for "${slug}".` }, { status: 400 }),
    };
  }

  return { workspace, error: null };
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to view Printavo sync status." }, { status: 401 });
  }

  const resolved = await resolveWorkspaceOrError(slug);
  if (resolved.error) {
    return resolved.error;
  }

  try {
    return NextResponse.json({
      ok: true,
      status: await readPrintavoSyncStatus(resolved.workspace.organization!.id),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Printavo sync status failed" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to run Printavo sync." }, { status: 401 });
  }

  const resolved = await resolveWorkspaceOrError(slug);
  if (resolved.error) {
    return resolved.error;
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    apiKey?: string;
    pageLimit?: number;
    pageSize?: number;
    mode?: string;
    reset?: boolean;
  };
  const mode = body.mode === "backfill" ? "backfill" : "latest";
  const pageLimit = numberInRange(body.pageLimit, mode === "backfill" ? 10 : 3, 1, mode === "backfill" ? 20 : 5);
  const pageSize = numberInRange(body.pageSize, 25, 1, 25);

  try {
    const result = await runPrintavoSync({
      organizationId: resolved.workspace.organization!.id,
      organizationSlug: resolved.workspace.organization!.slug,
      email: readString(body.email),
      apiKey: readString(body.apiKey),
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
