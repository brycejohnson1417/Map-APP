import { NextResponse } from "next/server";
import { requireRuntimeTenantAccess } from "@/lib/application/auth/runtime-authorization";
import {
  buildMetaOAuthAuthorizationUrl,
  scopesForMetaMode,
} from "@/lib/infrastructure/adapters/social/meta-instagram-adapter";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import {
  createMetaOAuthState,
  metaOAuthErrorRedirect,
  metaOAuthRedirectUri,
  readMetaOAuthConfig,
} from "@/lib/application/runtime/meta-oauth";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const access = await requireRuntimeTenantAccess(slug, "Tenant login is required to start Meta OAuth.");
  if (access.response) {
    return NextResponse.redirect(new URL(`/login?org=${encodeURIComponent(slug)}`, request.url));
  }

  const url = new URL(request.url);
  const config = await readMetaOAuthConfig(slug, url.searchParams.get("mode"));
  if (!config.organization) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, "Organization not found."), request.url));
  }
  if (!config.clientId || !config.clientSecret) {
    return NextResponse.redirect(
      new URL(
        metaOAuthErrorRedirect(
          slug,
          "The platform Meta app is not configured yet. Add META_APP_ID and META_APP_SECRET in the backend before starting Instagram login.",
        ),
        request.url,
      ),
    );
  }

  const redirectUri = metaOAuthRedirectUri(request.url);
  const state = createMetaOAuthState({ slug, mode: config.mode, ts: Date.now() }, config.clientSecret);
  const authorizationUrl = buildMetaOAuthAuthorizationUrl({
    mode: config.mode,
    clientId: config.clientId,
    redirectUri,
    state,
    apiVersion: config.apiVersion,
    scopes: scopesForMetaMode(config.mode, true),
  });

  return NextResponse.redirect(authorizationUrl);
}
