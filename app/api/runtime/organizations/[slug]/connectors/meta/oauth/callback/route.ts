import { NextResponse } from "next/server";
import { registerIntegration } from "@/lib/application/runtime/bootstrap-service";
import { scanScreenprintingSocialAccounts } from "@/lib/application/screenprinting/screenprinting-service";
import {
  exchangeMetaOAuthCode,
  scopesForMetaMode,
} from "@/lib/infrastructure/adapters/social/meta-instagram-adapter";
import { resolveRouteParams } from "@/lib/presentation/route-params";
import {
  metaOAuthErrorRedirect,
  metaOAuthRedirectUri,
  readMetaOAuthConfig,
  readMetaOAuthStateUnsafe,
  verifyMetaOAuthState,
} from "../_shared";

function successRedirect(slug: string, scanned: number, requestUrl: string) {
  const url = new URL(`/screenprinting?org=${encodeURIComponent(slug)}&module=social&social=accounts`, requestUrl);
  url.searchParams.set("meta_oauth", "connected");
  if (scanned) {
    url.searchParams.set("connected_accounts", String(scanned));
  }
  return url;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const unsafeState = readMetaOAuthStateUnsafe(state);
  const stateMode = unsafeState?.mode ?? null;
  const config = await readMetaOAuthConfig(slug, stateMode);

  if (!config.organization) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, "Organization not found."), request.url));
  }
  if (!code) {
    const message = url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? "Instagram login did not return an authorization code.";
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, message), request.url));
  }
  if (!config.clientId || !config.clientSecret) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, "Meta app credentials are missing."), request.url));
  }

  const verifiedState = verifyMetaOAuthState(state, config.clientSecret);
  if (!verifiedState || verifiedState.slug !== slug) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, "Instagram login state expired or did not match this tenant."), request.url));
  }

  try {
    const redirectUri = metaOAuthRedirectUri(request.url, slug);
    const token = await exchangeMetaOAuthCode({
      mode: verifiedState.mode,
      apiVersion: config.apiVersion,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri,
      code,
    });
    const existingFields = config.fields;
    const grantedScopes = token.grantedScopes.length ? token.grantedScopes : scopesForMetaMode(verifiedState.mode, true);
    await registerIntegration({
      organizationId: config.organization.id,
      provider: "meta",
      displayName: "Meta Business / Instagram",
      externalAccountId: token.userId ?? (typeof existingFields.businessId === "string" ? existingFields.businessId : typeof existingFields.appId === "string" ? existingFields.appId : null),
      config: {
        savedByEmail: "meta_oauth",
        selfServeConfiguredAt: new Date().toISOString(),
        fields: {
          ...existingFields,
          authMode: verifiedState.mode,
          graphApiVersion: config.apiVersion,
          grantedScopes: grantedScopes.join(", "),
          authorizationUrl: "oauth_connected",
        },
        secretFieldKeys: ["accessToken", "appSecret"],
        oauth: {
          tokenType: token.tokenType,
          expiresIn: token.expiresIn,
          longLived: token.longLived,
          connectedAt: new Date().toISOString(),
        },
      },
      secrets: {
        accessToken: token.accessToken,
        appSecret: config.clientSecret,
      },
    });

    const scan = await scanScreenprintingSocialAccounts(slug).catch(() => ({ created: 0, updated: 0 }));
    return NextResponse.redirect(successRedirect(slug, (scan.created ?? 0) + (scan.updated ?? 0), request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram login failed.";
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, message), request.url));
  }
}
