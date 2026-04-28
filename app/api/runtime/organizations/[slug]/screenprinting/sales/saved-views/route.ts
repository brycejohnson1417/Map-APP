import { NextResponse } from "next/server";
import {
  createScreenprintingSavedView,
  listScreenprintingSavedViews,
} from "@/lib/application/screenprinting/screenprinting-service";
import { readJson, requireTenantSession, resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const url = new URL(request.url);
    return NextResponse.json({
      ok: true,
      ...(await listScreenprintingSavedViews(await resolveSlug(context), url.searchParams.get("module") ?? "sales_orders")),
    });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const slug = await resolveSlug(context);
    const session = await requireTenantSession(slug);
    if (session.error) {
      return session.error;
    }
    const savedView = await createScreenprintingSavedView(slug, await readJson(request));
    return NextResponse.json({ ok: true, savedView });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
