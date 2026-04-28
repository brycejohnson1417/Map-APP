import { NextResponse } from "next/server";
import { replyToScreenprintingSocialThread } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../../../_shared";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; threadId: string }> | { slug: string; threadId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const { threadId } = await resolveRouteParams(context.params);
    const thread = await replyToScreenprintingSocialThread(slug, threadId, await readJson(request));
    return NextResponse.json({ ok: true, thread });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
