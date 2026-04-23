import { buildMockOrderProposalReport } from "@/lib/application/runtime/mock-order-proposal-service";
import { renderMockOrderProposalPdf } from "@/lib/application/runtime/mock-order-proposal-pdf";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export const runtime = "nodejs";

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; accountId: string }> | { slug: string; accountId: string } },
) {
  const { slug, accountId } = await resolveRouteParams(context.params);
  const report = await buildMockOrderProposalReport(slug, accountId);

  if (!report) {
    return Response.json({ ok: false, error: "account_not_found" }, { status: 404 });
  }

  const pdf = await renderMockOrderProposalPdf(report);
  const filename = `${safeFilename(report.accountName) || "account"}-mock-order-proposal.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
