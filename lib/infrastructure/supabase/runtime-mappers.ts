import type { IntegrationInstallation, Organization, SyncJob } from "@/lib/domain/runtime";

function normalizeJson(value: unknown) {
  return (value ?? {}) as Record<string, unknown>;
}

export function mapOrganizationRow(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    status: String(row.status),
    settings: normalizeJson(row.settings),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapIntegrationRow(row: Record<string, unknown>): IntegrationInstallation {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    provider: row.provider as IntegrationInstallation["provider"],
    externalAccountId: row.external_account_id ? String(row.external_account_id) : null,
    displayName: String(row.display_name),
    config: normalizeJson(row.config),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapSyncJobRow(row: Record<string, unknown>): SyncJob {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    installationId: row.installation_id ? String(row.installation_id) : null,
    kind: row.kind as SyncJob["kind"],
    status: row.status as SyncJob["status"],
    dedupeKey: row.dedupe_key ? String(row.dedupe_key) : null,
    payload: normalizeJson(row.payload),
    attempts: Number(row.attempts ?? 0),
    lastError: row.last_error ? String(row.last_error) : null,
    availableAt: String(row.available_at),
    startedAt: row.started_at ? String(row.started_at) : null,
    finishedAt: row.finished_at ? String(row.finished_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
