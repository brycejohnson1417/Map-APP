import { NextResponse } from "next/server";
import { getScreenprintingSocialPost } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { resolveSlug, screenprintingErrorResponse } from "../../../_shared";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; postId: string }> | { slug: string; postId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const { postId } = await resolveRouteParams(context.params);
    return NextResponse.json({ ok: true, ...(await getScreenprintingSocialPost(slug, postId)) });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
