import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import {
  normalizeMetaGraphMode,
  type MetaGraphMode,
} from "@/lib/infrastructure/adapters/social/meta-instagram-adapter";

const integrations = new IntegrationRepository();

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

export function metaOAuthRedirectUri(requestUrl: string, slug: string) {
  return `${redirectBaseUrl(requestUrl)}/api/runtime/organizations/${encodeURIComponent(slug)}/connectors/meta/oauth/callback`;
}

export async function readMetaOAuthConfig(slug: string, modeOverride?: string | null) {
  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return { workspace, organization: null, installation: null, fields: {}, clientId: null, clientSecret: null, mode: normalizeMetaGraphMode(modeOverride), apiVersion: "v24.0" };
  }

  const installation = await integrations.findByProvider(workspace.organization.id, "meta").catch(() => null);
  const fields = fieldMap(installation?.config?.fields);
  const mode = normalizeMetaGraphMode(modeOverride ?? fields.authMode);
  const apiVersion = stringField(fields.graphApiVersion) ?? process.env.META_GRAPH_API_VERSION ?? "v24.0";
  const appSecret = installation
    ? await integrations.readSecret<string>(workspace.organization.id, installation.id, "appSecret").catch(() => null)
    : null;
  const envClientId =
    mode === "facebook_login_business"
      ? process.env.META_FACEBOOK_APP_ID ?? process.env.META_APP_ID
      : process.env.META_INSTAGRAM_APP_ID ?? process.env.META_APP_ID;
  const envClientSecret =
    mode === "facebook_login_business"
      ? process.env.META_FACEBOOK_APP_SECRET ?? process.env.META_APP_SECRET
      : process.env.META_INSTAGRAM_APP_SECRET ?? process.env.META_APP_SECRET;

  return {
    workspace,
    organization: workspace.organization,
    installation,
    fields,
    clientId: envClientId ?? stringField(fields.appId),
    clientSecret: envClientSecret ?? appSecret,
    mode,
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
