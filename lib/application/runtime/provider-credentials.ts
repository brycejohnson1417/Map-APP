import "server-only";

import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import type { ExternalProvider } from "@/lib/domain/runtime";

const integrations = new IntegrationRepository();

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function tenantEnvPrefix(slug: string | null | undefined) {
  return String(slug ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function readTenantScopedEnvironmentValue(slug: string | null | undefined, suffix: string) {
  const prefix = tenantEnvPrefix(slug);
  if (!prefix) {
    return null;
  }

  const key = `${prefix}_${suffix}`;
  const value = process.env[key];
  return cleanString(value);
}

async function findIntegration(organizationId: string, provider: ExternalProvider) {
  return integrations.findByProvider(organizationId, provider);
}

async function readSecret<T>(organizationId: string, installationId: string, keyName: string) {
  return integrations.readSecret<T>(organizationId, installationId, keyName);
}

export async function resolveTenantGoogleMapsBrowserKey(input: {
  organizationId: string;
  organizationSlug: string;
}) {
  const installation = await findIntegration(input.organizationId, "google_maps");
  const browserKeyFromConfig = cleanString(installation?.config.browserApiKey);
  if (browserKeyFromConfig) {
    return browserKeyFromConfig;
  }

  return readTenantScopedEnvironmentValue(input.organizationSlug, "GOOGLE_MAPS_BROWSER_API_KEY");
}

export async function resolveTenantGoogleMapsServerKey(input: {
  organizationId: string;
  organizationSlug: string;
}) {
  const installation = await findIntegration(input.organizationId, "google_maps");
  if (installation) {
    const directKey = cleanString(
      await readSecret<string | { serverApiKey?: string }>(input.organizationId, installation.id, "serverApiKey"),
    );
    if (directKey) {
      return directKey;
    }

    const wrappedKey = await readSecret<{ serverApiKey?: string }>(input.organizationId, installation.id, "credentials");
    const nestedKey = cleanString(wrappedKey?.serverApiKey);
    if (nestedKey) {
      return nestedKey;
    }
  }

  return readTenantScopedEnvironmentValue(input.organizationSlug, "GOOGLE_MAPS_SERVER_API_KEY");
}

interface NabisCredentialSecret {
  apiKey?: string;
  apiBaseUrl?: string;
  ordersPath?: string;
  inventoryPath?: string;
}

export async function resolveTenantNabisConfig(input: {
  organizationId: string;
  organizationSlug: string;
}) {
  const installation = await findIntegration(input.organizationId, "nabis");
  let storedApiKey: string | null = null;
  let storedConfig: NabisCredentialSecret | null = null;

  if (installation) {
    storedApiKey = cleanString(await readSecret<string | { apiKey?: string }>(input.organizationId, installation.id, "apiKey"));
    if (!storedApiKey) {
      const credentials = await readSecret<NabisCredentialSecret>(input.organizationId, installation.id, "credentials");
      storedApiKey = cleanString(credentials?.apiKey);
      storedConfig = credentials ?? null;
    } else {
      storedConfig = await readSecret<NabisCredentialSecret>(input.organizationId, installation.id, "credentials");
    }
  }

  return {
    apiKey: storedApiKey ?? readTenantScopedEnvironmentValue(input.organizationSlug, "NABIS_API_KEY"),
    apiBaseUrl:
      cleanString(storedConfig?.apiBaseUrl) ||
      cleanString(installation?.config.apiBaseUrl) ||
      readTenantScopedEnvironmentValue(input.organizationSlug, "NABIS_API_BASE_URL"),
    ordersPath:
      cleanString(storedConfig?.ordersPath) ||
      cleanString(installation?.config.ordersPath) ||
      readTenantScopedEnvironmentValue(input.organizationSlug, "NABIS_ORDERS_PATH"),
    inventoryPath:
      cleanString(storedConfig?.inventoryPath) ||
      cleanString(installation?.config.inventoryPath) ||
      readTenantScopedEnvironmentValue(input.organizationSlug, "NABIS_INVENTORY_PATH"),
  };
}
