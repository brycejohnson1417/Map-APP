import { NextResponse } from "next/server";
import { markScreenprintingEmailDraftSent } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../../_shared";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string; draftId: string }> | { slug: string; draftId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { draftId } = await resolveRouteParams(context.params);
    const activity = await markScreenprintingEmailDraftSent(slug, draftId);
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
