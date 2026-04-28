import { NextResponse } from "next/server";
import { getScreenprintingSocialDashboard } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    return NextResponse.json({ ok: true, ...(await getScreenprintingSocialDashboard(await resolveSlug(context))) });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
