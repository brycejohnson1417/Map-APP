import { NextResponse } from "next/server";
import { listScreenprintingOrders } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveSlug, screenprintingErrorResponse } from "../../_shared";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const url = new URL(request.url);
    const result = await listScreenprintingOrders(await resolveSlug(context), {
      q: url.searchParams.get("q"),
      pageSize: Number(url.searchParams.get("pageSize") ?? 100),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return screenprintingErrorResponse(error);
  }
}
