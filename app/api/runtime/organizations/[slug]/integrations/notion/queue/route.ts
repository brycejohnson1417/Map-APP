import { NextResponse } from "next/server";
import { z } from "zod";
import { queueNotionDirtyPageSync } from "@/lib/application/runtime/notion-sync-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

const requestSchema = z.object({
  pageIds: z.array(z.string().trim().min(1)).min(1).max(100),
  reason: z.string().trim().min(3).max(120).default("manual_refresh"),
});

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  try {
    const { slug } = await resolveRouteParams(context.params);
    const payload = requestSchema.parse(await request.json());
    const job = await queueNotionDirtyPageSync({
      organizationSlug: slug,
      pageIds: payload.pageIds,
      reason: payload.reason,
    });

    return NextResponse.json(
      {
        ok: true,
        queued: true,
        job,
      },
      {
        status: 202,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_request",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
