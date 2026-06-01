import { NextResponse } from "next/server";
import { requireRuntimeTenantAccess } from "@/lib/application/auth/runtime-authorization";
import { ScreenprintingServiceError } from "@/lib/application/screenprinting/screenprinting-service";
import { resolveRouteParams } from "@/lib/presentation/route-params";

class RuntimeTenantAuthorizationError extends Error {
  constructor(readonly response: NextResponse) {
    super("runtime_tenant_authorization_failed");
  }
}

export async function resolveSlug(context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const session = await requireTenantSession(slug);
  if (session.error) {
    throw new RuntimeTenantAuthorizationError(session.error);
  }
  return slug;
}

export async function readJson(request: Request) {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function requireTenantSession(slug: string) {
  const access = await requireRuntimeTenantAccess(slug);
  if (access.response) {
    return {
      sessionEmail: null,
      error: access.response,
    };
  }

  return { sessionEmail: access.sessionEmail, error: null };
}

export function screenprintingErrorResponse(error: unknown) {
  if (error instanceof RuntimeTenantAuthorizationError) {
    return error.response;
  }

  if (error instanceof ScreenprintingServiceError) {
    return NextResponse.json({ ok: false, error: error.code, message: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : "screenprinting_request_failed" },
    { status: 500 },
  );
}
