import { NextResponse } from "next/server";
import { calculatePppSavingsReport } from "@/lib/application/runtime/ppp-savings-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; accountId: string }> | { slug: string; accountId: string } },
) {
  const { slug, accountId } = await resolveRouteParams(context.params);
  const body = (await request.json().catch(() => ({}))) as { year?: unknown };
  const requestedYear = typeof body.year === "number" ? body.year : Number(body.year);
  const year = Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100 ? requestedYear : undefined;
  const report = await calculatePppSavingsReport(slug, accountId, year);

  if (!report) {
    return NextResponse.json({ ok: false, error: "account_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      report,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
