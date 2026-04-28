import { NextResponse } from "next/server";
import { getScreenprintingSalesDashboard } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const dashboard = await getScreenprintingSalesDashboard(await resolveSlug(context));
    return NextResponse.json({ ok: true, ...dashboard });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
