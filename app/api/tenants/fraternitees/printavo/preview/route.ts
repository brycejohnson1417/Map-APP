import { NextResponse } from "next/server";
import { FRATERNITEES_STATUS_FILTERS, scoreFraterniteesLeads } from "@/lib/application/fraternitees/lead-scoring";
import { fetchPrintavoLeadOrders, fetchPrintavoStatuses } from "@/lib/infrastructure/adapters/printavo/client";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; apiKey?: string };
  const email = body.email?.trim() ?? "";
  const apiKey = body.apiKey?.trim() ?? "";

  if (!email || !apiKey) {
    return NextResponse.json({ ok: false, error: "Printavo email and API key are required." }, { status: 400 });
  }

  try {
    const [statuses, orders] = await Promise.all([
      fetchPrintavoStatuses({ email, apiKey }),
      fetchPrintavoLeadOrders({ email, apiKey }, { pageLimit: 5 }),
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

