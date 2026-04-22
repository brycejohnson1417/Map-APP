import { NextResponse } from "next/server";
import { getTerritoryRuntimeDashboard } from "@/lib/application/runtime/territory-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const url = new URL(request.url);
  const dashboard = await getTerritoryRuntimeDashboard(slug, {
    q: url.searchParams.get("q") ?? undefined,
    flag: url.searchParams.get("flag") ?? undefined,
    rep: url.searchParams.get("rep") ?? undefined,
  });

  if (!dashboard) {
    return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      counts: dashboard.counts,
      appliedFilters: dashboard.appliedFilters,
      pins: dashboard.pins,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=45",
      },
    },
  );
}
