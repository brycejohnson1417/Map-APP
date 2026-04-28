import { NextResponse } from "next/server";
import { snoozeScreenprintingReorder } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../../_shared";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; signalId: string }> | { slug: string; signalId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { signalId } = await resolveRouteParams(context.params);
    const body = await readJson(request);
    const reorderSignal = await snoozeScreenprintingReorder(slug, signalId, {
      snoozedUntil: String(body.snoozedUntil ?? ""),
      reason: typeof body.reason === "string" ? body.reason : null,
    });
    return NextResponse.json({ ok: true, reorderSignal });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
