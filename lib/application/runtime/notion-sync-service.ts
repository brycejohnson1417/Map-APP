import "server-only";

import { NotionCrmAdapter } from "@/lib/infrastructure/adapters/notion/crm-adapter";
import { IntegrationRepository } from "@/lib/infrastructure/supabase/integration-repository";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { SyncJobRepository } from "@/lib/infrastructure/supabase/sync-job-repository";

const organizations = new OrganizationRepository();
const integrations = new IntegrationRepository();
const syncJobs = new SyncJobRepository();

export async function queueNotionDirtyPageSync(input: {
  organizationSlug: string;
  pageIds: string[];
  reason: string;
}) {
  const organization = await organizations.findBySlug(input.organizationSlug);

  if (!organization) {
    throw new Error(`Organization "${input.organizationSlug}" was not found`);
  }

  const installation = await integrations.findByProvider(organization.id, "notion");

  if (!installation) {
    throw new Error(`Organization "${input.organizationSlug}" does not have an active Notion installation`);
  }

  const adapter = new NotionCrmAdapter(installation);
  const payload = adapter.buildDirtyPageSyncPayload({
    pageIds: input.pageIds,
    reason: input.reason,
  });

  return syncJobs.queue({
    organizationId: organization.id,
    installationId: installation.id,
    kind: "notion_pages",
    dedupeKey: `notion-pages:${organization.id}:${payload.pageIds.sort().join(",")}:${payload.reason}`,
    payload: payload as unknown as Record<string, unknown>,
  });
}
