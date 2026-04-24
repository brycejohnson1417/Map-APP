import "server-only";

import { bootstrapOrganization, registerIntegration } from "@/lib/application/runtime/bootstrap-service";
import { resolveTenantPluginSettings, type TenantPluginSettings } from "@/lib/application/runtime/plugin-settings";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import type { IntegrationInstallation } from "@/lib/domain/runtime";

export const FRATERNITEES_ORG_SLUG = "fraternitees";
export const FRATERNITEES_ORG_NAME = "FraterniTees";

const integrations = new IntegrationRepository();

export interface FraterniteesConnectorSnapshot {
  organizationId: string;
  organizationSlug: string;
  pluginSettings: TenantPluginSettings;
  integrations: Array<Pick<IntegrationInstallation, "id" | "provider" | "displayName" | "externalAccountId" | "status" | "updatedAt">>;
}

export async function ensureFraterniteesWorkspace(email: string): Promise<FraterniteesConnectorSnapshot> {
  const { organization } = await bootstrapOrganization({
    slug: FRATERNITEES_ORG_SLUG,
    name: FRATERNITEES_ORG_NAME,
    owner: {
      clerkUserId: `fraternitees:${email.toLowerCase()}`,
      email,
      fullName: null,
      role: "owner",
    },
  });
  const integrationList = await integrations.listByOrganizationId(organization.id);

  return {
    organizationId: organization.id,
    organizationSlug: organization.slug,
    pluginSettings: resolveTenantPluginSettings(organization.slug, organization.settings),
    integrations: integrationList.map((integration) => ({
      id: integration.id,
      provider: integration.provider,
      displayName: integration.displayName,
      externalAccountId: integration.externalAccountId,
      status: integration.status,
      updatedAt: integration.updatedAt,
    })),
  };
}

export async function saveFraterniteesConnectors(input: {
  email: string;
  printavo?: {
    email: string;
    apiKey: string;
  } | null;
}) {
  const { organization } = await bootstrapOrganization({
    slug: FRATERNITEES_ORG_SLUG,
    name: FRATERNITEES_ORG_NAME,
    owner: {
      clerkUserId: `fraternitees:${input.email.toLowerCase()}`,
      email: input.email,
      fullName: null,
      role: "owner",
    },
  });

  if (input.printavo?.email && input.printavo.apiKey) {
    await registerIntegration({
      organizationId: organization.id,
      provider: "printavo",
      displayName: "Printavo Orders",
      externalAccountId: input.printavo.email,
      config: {
        endpoint: "https://www.printavo.com/api/v2",
        auth: "email_token_headers",
        supportsWebhooks: false,
        syncPlan: {
          object: "orders",
          pageSize: 25,
          sortOn: "VISUAL_ID",
          statusSource: "statuses",
        },
      },
      secrets: {
        credentials: {
          email: input.printavo.email,
          apiKey: input.printavo.apiKey,
        },
      },
    });
  }

  return ensureFraterniteesWorkspace(input.email);
}
