import { NextResponse } from "next/server";
import { getScreenprintingOrderDetail } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import { resolveSlug, screenprintingErrorResponse } from "../../../_shared";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; orderId: string }> | { slug: string; orderId: string } },
) {
  try {
    const slug = await resolveSlug(context);
    const { orderId } = await resolveRouteParams(context.params);
    const result = await getScreenprintingOrderDetail(slug, orderId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
