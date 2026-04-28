import { NextResponse } from "next/server";
import { FRATERNITEES_STATUS_FILTERS, scoreFraterniteesLeads } from "@/lib/application/fraternitees/lead-scoring";
import { createPrintavoOrderingAdapter } from "@/lib/infrastructure/adapters/printavo/ordering-adapter";

export async function POST(request: Request) {
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
    const scores = scoreFraterniteesLeads(orders, { limit: 25 });

    return NextResponse.json({
      ok: true,
      statuses,
      statusFilters: FRATERNITEES_STATUS_FILTERS,
      sampleOrderCount: orders.length,
      scores,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Printavo preview failed" },
      { status: 502 },
    );
  }
}
