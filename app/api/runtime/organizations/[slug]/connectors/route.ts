import { NextResponse } from "next/server";
import { z } from "zod";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { registerIntegration } from "@/lib/application/runtime/bootstrap-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import { resolveRouteParams } from "@/lib/presentation/route-params";

const integrations = new IntegrationRepository();

const requestSchema = z.object({
  provider: z.string().min(1),
  fields: z.record(z.string(), z.string()).default({}),
});

export async function POST(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const { slug } = await resolveRouteParams(context.params);
  const sessionEmail = await getTenantSessionEmailForSlug(slug);
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Tenant login is required to update connectors." }, { status: 401 });
  }

  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (!workspace.organization) {
    return NextResponse.json({ ok: false, error: `Organization "${slug}" was not found.` }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid connector payload." }, { status: 400 });
  }

  const connector = workspace.workspace.connectors.find((candidate) => candidate.provider === parsed.data.provider);
  if (!connector) {
    return NextResponse.json({ ok: false, error: `Connector "${parsed.data.provider}" is not enabled for ${slug}.` }, { status: 400 });
  }
  if (!connector.selfServe) {
    return NextResponse.json({ ok: false, error: `${connector.label} currently requires a guided setup.` }, { status: 403 });
  }

  for (const field of connector.fields) {
    if (field.required && !parsed.data.fields[field.key]?.trim()) {
      return NextResponse.json({ ok: false, error: `${field.label} is required.` }, { status: 400 });
    }
  }

  const existingIntegration = await integrations.findByProvider(workspace.organization.id, connector.provider).catch(() => null);
  const existingSecretFieldKeys = Array.isArray(existingIntegration?.config?.secretFieldKeys)
    ? existingIntegration.config.secretFieldKeys.filter((key): key is string => typeof key === "string")
    : [];

  const config: Record<string, unknown> = {
    savedByEmail: sessionEmail,
    selfServeConfiguredAt: new Date().toISOString(),
    fields: {},
    secretFieldKeys: [],
  };
  const secrets: Record<string, unknown> = {};
  const secretFieldKeys: string[] = [];

  for (const field of connector.fields) {
    const value = parsed.data.fields[field.key]?.trim() ?? "";
    if (!value) {
      continue;
    }
    if (field.type === "secret") {
      secrets[field.key] = value;
      secretFieldKeys.push(field.key);
    } else {
      (config.fields as Record<string, string>)[field.key] = value;
    }
  }
  config.secretFieldKeys =
    connector.provider === "meta" ? Array.from(new Set([...existingSecretFieldKeys, ...secretFieldKeys])) : secretFieldKeys;

  const integrationSecrets =
    connector.provider === "printavo" &&
    typeof secrets.email === "string" &&
    typeof secrets.apiKey === "string"
      ? {
          credentials: {
            email: String(secrets.email),
            apiKey: String(secrets.apiKey),
          },
        }
      : connector.provider === "meta" && Object.keys(secrets).length
        ? Object.fromEntries(
            Object.entries(secrets).map(([key, value]) => [
              key,
              String(value),
            ]),
          )
      : Object.keys(secrets).length
        ? { selfServeForm: secrets }
        : undefined;

  const installation = await registerIntegration({
    organizationId: workspace.organization.id,
    provider: connector.provider,
    displayName: connector.label,
    externalAccountId:
      parsed.data.fields.email?.trim() ||
      parsed.data.fields.sheetUrl?.trim() ||
      parsed.data.fields.businessId?.trim() ||
      parsed.data.fields.appId?.trim() ||
      null,
    config,
    secrets: integrationSecrets,
  });

  const integration = await integrations.findByProvider(workspace.organization.id, installation.provider);

  return NextResponse.json({
    ok: true,
    integration: integration
      ? {
          id: integration.id,
          provider: integration.provider,
          displayName: integration.displayName,
          externalAccountId: integration.externalAccountId,
          status: integration.status,
          updatedAt: integration.updatedAt,
        }
      : null,
  });
}
