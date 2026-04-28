import { NextResponse } from "next/server";
import { createScreenprintingSocialComment } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../../_shared";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string; postId: string }> | { slug: string; postId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { postId } = await resolveRouteParams(context.params);
    const comment = await createScreenprintingSocialComment(slug, postId);
    return NextResponse.json({ ok: true, comment });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
