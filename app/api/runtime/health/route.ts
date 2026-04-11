import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      runtime: "supabase-first",
      supabaseConfigured: isSupabaseConfigured(),
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
      },
    },
  );
}
