import "server-only";

import { NextResponse } from "next/server";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";

export async function requireRuntimeTenantAccess(
  slug: string,
  message = "Tenant login is required.",
): Promise<{ sessionEmail: string; response: null } | { sessionEmail: null; response: NextResponse }> {
  const sessionEmail = await getTenantSessionEmailForSlug(slug);

  if (!sessionEmail) {
    return {
      sessionEmail: null,
      response: NextResponse.json({ ok: false, error: message }, { status: 401 }),
    };
  }

  return { sessionEmail, response: null };
}
