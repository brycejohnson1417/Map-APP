import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { registerIntegration } from "@/lib/application/runtime/bootstrap-service";
import { scanScreenprintingSocialAccounts } from "@/lib/application/screenprinting/screenprinting-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import {
  exchangeMetaOAuthCode,
  normalizeMetaGraphMode,
  scopesForMetaMode,
  type MetaGraphMode,
} from "@/lib/infrastructure/adapters/social/meta-instagram-adapter";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";

const integrations = new IntegrationRepository();
const META_OAUTH_CALLBACK_PATH = "/api/runtime/connectors/meta/oauth/callback";

type MetaOAuthStatePayload = {
  slug: string;
  mode: MetaGraphMode;
  ts: number;
};

function fieldMap(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function redirectBaseUrl(requestUrl: string) {
  if (process.env.META_OAUTH_REDIRECT_BASE_URL) {
    return process.env.META_OAUTH_REDIRECT_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return new URL(requestUrl).origin;
}

export function metaOAuthRedirectUri(requestUrl: string) {
  return `${redirectBaseUrl(requestUrl)}${META_OAUTH_CALLBACK_PATH}`;
}

export function legacyMetaOAuthRedirectUri(requestUrl: string, slug: string) {
  return `${redirectBaseUrl(requestUrl)}/api/runtime/organizations/${encodeURIComponent(slug)}/connectors/meta/oauth/callback`;
}

export function metaOAuthCallbackUrl(baseUrl: string) {
  return `${redirectBaseUrl(baseUrl)}${META_OAUTH_CALLBACK_PATH}`;
}

export function getPlatformMetaOAuthCredentials(mode: MetaGraphMode) {
  const clientId =
    mode === "facebook_login_business"
      ? process.env.META_FACEBOOK_APP_ID ?? process.env.META_APP_ID
      : process.env.META_INSTAGRAM_APP_ID ?? process.env.META_APP_ID;
  const clientSecret =
    mode === "facebook_login_business"
      ? process.env.META_FACEBOOK_APP_SECRET ?? process.env.META_APP_SECRET
      : process.env.META_INSTAGRAM_APP_SECRET ?? process.env.META_APP_SECRET;

  return {
    clientId: stringField(clientId),
    clientSecret: stringField(clientSecret),
  };
}

export function hasPlatformMetaOAuthCredentials() {
  const availability = getPlatformMetaOAuthAvailability();
  return availability.instagramBusinessLogin || availability.facebookLoginBusiness;
}

export function getPlatformMetaOAuthAvailability() {
  const instagram = getPlatformMetaOAuthCredentials("instagram_business_login");
  const facebook = getPlatformMetaOAuthCredentials("facebook_login_business");
  return {
    instagramBusinessLogin: Boolean(instagram.clientId && instagram.clientSecret),
    facebookLoginBusiness: Boolean(facebook.clientId && facebook.clientSecret),
  };
}

export async function readMetaOAuthConfig(slug: string, modeOverride?: string | null) {
  const workspace = await getWorkspaceExperienceBySlug(slug);
  const mode = normalizeMetaGraphMode(modeOverride);
  const credentials = getPlatformMetaOAuthCredentials(mode);

  if (!workspace.organization) {
    return {
      workspace,
      organization: null,
      installation: null,
      fields: {},
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      mode,
      apiVersion: process.env.META_GRAPH_API_VERSION ?? "v24.0",
    };
  }

  const installation = await integrations.findByProvider(workspace.organization.id, "meta").catch(() => null);
  const fields = fieldMap(installation?.config?.fields);
  const resolvedMode = normalizeMetaGraphMode(modeOverride ?? fields.authMode);
  const resolvedCredentials = getPlatformMetaOAuthCredentials(resolvedMode);
  const apiVersion = process.env.META_GRAPH_API_VERSION ?? "v24.0";

  return {
    workspace,
    organization: workspace.organization,
    installation,
    fields,
    clientId: resolvedCredentials.clientId,
    clientSecret: resolvedCredentials.clientSecret,
    mode: resolvedMode,
    apiVersion,
  };
}

export function createMetaOAuthState(payload: MetaOAuthStatePayload, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function readMetaOAuthStateUnsafe(state: string | null) {
  if (!state || !state.includes(".")) {
    return null;
  }
  const [encodedPayload] = state.split(".");
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<MetaOAuthStatePayload>;
    if (!payload.slug || (payload.mode !== "instagram_business_login" && payload.mode !== "facebook_login_business") || !payload.ts) {
      return null;
    }
    return payload as MetaOAuthStatePayload;
  } catch {
    return null;
  }
}

export function verifyMetaOAuthState(state: string | null, secret: string) {
  if (!state || !state.includes(".")) {
    return null;
  }
  const [encodedPayload, signature] = state.split(".");
  const expected = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }
  const payload = readMetaOAuthStateUnsafe(state);
  if (!payload) {
    return null;
  }
  const ageMs = Date.now() - payload.ts;
  return ageMs >= 0 && ageMs <= 10 * 60 * 1000 ? payload : null;
}

export function metaOAuthErrorRedirect(slug: string, message: string) {
  return `/integrations?org=${encodeURIComponent(slug)}&meta_oauth_error=${encodeURIComponent(message)}`;
}

function successRedirect(slug: string, scanned: number, requestUrl: string) {
  const url = new URL(`/screenprinting?org=${encodeURIComponent(slug)}&module=social&social=accounts`, requestUrl);
  url.searchParams.set("meta_oauth", "connected");
  if (scanned) {
    url.searchParams.set("connected_accounts", String(scanned));
  }
  return url;
}

export async function handleMetaOAuthCallback(
  request: Request,
  options: {
    routeSlug?: string | null;
    redirectUri?: string;
  } = {},
) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const unsafeState = readMetaOAuthStateUnsafe(state);
  const slug = unsafeState?.slug ?? options.routeSlug ?? "";
  const stateMode = unsafeState?.mode ?? null;

  if (!slug) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect("fraternitees", "Instagram login state was missing a tenant."), request.url));
  }

  const config = await readMetaOAuthConfig(slug, stateMode);
  if (!config.organization) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, "Organization not found."), request.url));
  }
  if (!code) {
    const message = url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? "Instagram login did not return an authorization code.";
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, message), request.url));
  }
  if (!config.clientId || !config.clientSecret) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, "The platform Meta app is not configured yet. Add META_APP_ID and META_APP_SECRET in the backend before starting Instagram login."), request.url));
  }

  const verifiedState = verifyMetaOAuthState(state, config.clientSecret);
  if (!verifiedState || verifiedState.slug !== slug || (options.routeSlug && options.routeSlug !== verifiedState.slug)) {
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, "Instagram login state expired or did not match this tenant."), request.url));
  }

  try {
    const token = await exchangeMetaOAuthCode({
      mode: verifiedState.mode,
      apiVersion: config.apiVersion,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: options.redirectUri ?? metaOAuthRedirectUri(request.url),
      code,
    });
    const existingFields = config.fields;
    const grantedScopes = token.grantedScopes.length ? token.grantedScopes : scopesForMetaMode(verifiedState.mode, true);
    await registerIntegration({
      organizationId: config.organization.id,
      provider: "meta",
      displayName: "Meta Business / Instagram",
      externalAccountId:
        token.userId ??
        (typeof existingFields.businessId === "string"
          ? existingFields.businessId
          : config.installation?.externalAccountId ?? null),
      config: {
        savedByEmail: "meta_oauth",
        selfServeConfiguredAt: new Date().toISOString(),
        fields: {
          ...existingFields,
          authMode: verifiedState.mode,
          graphApiVersion: config.apiVersion,
          credentialSource: "platform_meta_app",
          grantedScopes: grantedScopes.join(", "),
          authorizationUrl: "oauth_connected",
          platformCallbackPath: META_OAUTH_CALLBACK_PATH,
        },
        secretFieldKeys: ["accessToken"],
        oauth: {
          tokenType: token.tokenType,
          expiresIn: token.expiresIn,
          longLived: token.longLived,
          connectedAt: new Date().toISOString(),
        },
      },
      secrets: {
        accessToken: token.accessToken,
      },
    });

    const scan = await scanScreenprintingSocialAccounts(slug).catch(() => ({ created: 0, updated: 0 }));
    return NextResponse.redirect(successRedirect(slug, (scan.created ?? 0) + (scan.updated ?? 0), request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram login failed.";
    return NextResponse.redirect(new URL(metaOAuthErrorRedirect(slug, message), request.url));
  }
}
