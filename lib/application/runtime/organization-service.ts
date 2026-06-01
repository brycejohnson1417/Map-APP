import "server-only";

import type { IntegrationInstallation, OrganizationRuntimeSnapshot, RuntimeIntegrationSummary } from "@/lib/domain/runtime";
import { AuditEventRepository } from "@/lib/infrastructure/supabase/audit-event-repository";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { SyncCursorRepository } from "@/lib/infrastructure/supabase/sync-cursor-repository";
import { SyncJobRepository } from "@/lib/infrastructure/supabase/sync-job-repository";

const organizations = new OrganizationRepository();
const integrations = new IntegrationRepository();
const syncCursors = new SyncCursorRepository();
const syncJobs = new SyncJobRepository();
const auditEvents = new AuditEventRepository();

function sanitizeRuntimeIntegration(integration: IntegrationInstallation): RuntimeIntegrationSummary {
  return {
    id: integration.id,
    organizationId: integration.organizationId,
    provider: integration.provider,
    externalAccountId: integration.externalAccountId,
    displayName: integration.displayName,
    status: integration.status,
    configured: integration.status === "active",
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

export async function getOrganizationRuntimeSnapshot(slug: string): Promise<OrganizationRuntimeSnapshot | null> {
  const organization = await organizations.findBySlug(slug);

  if (!organization) {
    return null;
  }

  const [integrationList, recentSyncJobs, syncCursorList, syncJobStatusCounts, recentAuditEvents] = await Promise.all([
    integrations.listByOrganizationId(organization.id),
    syncJobs.listRecentByOrganizationId(organization.id, 12),
    syncCursors.listByOrganizationId(organization.id),
    syncJobs.countByStatusForOrganizationId(organization.id),
    auditEvents.listRecentByOrganizationId(organization.id, 12),
  ]);

  return {
    organization,
    integrations: integrationList.map(sanitizeRuntimeIntegration),
    recentSyncJobs,
    syncCursors: syncCursorList,
    syncJobStatusCounts,
    recentAuditEvents,
  };
}
