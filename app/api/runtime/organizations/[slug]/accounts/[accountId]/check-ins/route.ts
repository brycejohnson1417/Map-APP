import { NextResponse } from "next/server";
import { createAccountCheckIn } from "@/lib/application/runtime/account-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; accountId: string }> | { slug: string; accountId: string } },
) {
  const { slug, accountId } = await resolveRouteParams(context.params);
  const body = (await request.json().catch(() => ({}))) as { note?: unknown };
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!note) {
    return NextResponse.json({ ok: false, error: "note_required" }, { status: 400 });
  }

  const result = await createAccountCheckIn(slug, accountId, note);

  if (!result) {
    return NextResponse.json({ ok: false, error: "account_not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      activity: result.activity,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
