import { NextResponse } from "next/server";
import { FRATERNITEES_STATUS_FILTERS, scoreFraterniteesLeads } from "@/lib/application/fraternitees/lead-scoring";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { createPrintavoOrderingAdapter } from "@/lib/infrastructure/adapters/printavo/ordering-adapter";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to preview Printavo data." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; apiKey?: string };
  const email = body.email?.trim() ?? "";
  const apiKey = body.apiKey?.trim() ?? "";

  if (!email || !apiKey) {
    return NextResponse.json({ ok: false, error: "Printavo email and API key are required." }, { status: 400 });
  }

  try {
    const orderingAdapter = createPrintavoOrderingAdapter({ email, apiKey });
    const [statuses, orders] = await Promise.all([
      orderingAdapter.listStatuses(),
      orderingAdapter.fetchOrders({ pageLimit: 5 }).then((result) => result.orders),
    ]);

    return NextResponse.json({
      ok: true,
      statuses,
      statusFilters: FRATERNITEES_STATUS_FILTERS,
      sampleOrderCount: orders.length,
      scores: scoreFraterniteesLeads(orders, { limit: 25 }),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Printavo preview failed" },
      { status: 502 },
    );
  }
}
