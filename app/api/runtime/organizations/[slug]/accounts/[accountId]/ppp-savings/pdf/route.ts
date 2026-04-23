import { calculatePppSavingsReport } from "@/lib/application/runtime/ppp-savings-service";
import { renderPppSavingsPdf } from "@/lib/application/runtime/ppp-savings-pdf";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export const runtime = "nodejs";

function requestedYearFromUrl(request: Request) {
  const url = new URL(request.url);
  const requestedYear = Number(url.searchParams.get("year"));
  return Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100 ? requestedYear : undefined;
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string; accountId: string }> | { slug: string; accountId: string } },
) {
  const { slug, accountId } = await resolveRouteParams(context.params);
  const report = await calculatePppSavingsReport(slug, accountId, requestedYearFromUrl(request));

  if (!report) {
    return Response.json({ ok: false, error: "account_not_found" }, { status: 404 });
  }

  const pdf = await renderPppSavingsPdf(report);
  const filename = `${safeFilename(report.accountName) || "account"}-ppp-savings-${report.year}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
