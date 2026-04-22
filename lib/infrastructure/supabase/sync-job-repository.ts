import "server-only";

import type { QueueSyncJobInput, SyncJob, SyncJobStatusCount, SyncStatus } from "@/lib/domain/runtime";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapSyncJobRow } from "@/lib/infrastructure/supabase/runtime-mappers";

export class SyncJobRepository {
  async queue(input: QueueSyncJobInput): Promise<SyncJob> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("sync_job")
      .insert({
        organization_id: input.organizationId,
        installation_id: input.installationId ?? null,
        kind: input.kind,
        status: "queued",
        dedupe_key: input.dedupeKey ?? null,
        payload: input.payload ?? {},
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapSyncJobRow(data as Record<string, unknown>);
  }

  async listRecentByOrganizationId(organizationId: string, limit = 10): Promise<SyncJob[]> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("sync_job")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: unknown) => mapSyncJobRow(row as Record<string, unknown>));
  }

  async countByStatusForOrganizationId(organizationId: string): Promise<SyncJobStatusCount[]> {
    const supabase = getSupabaseAdminClient() as any;
    const statuses: SyncStatus[] = ["queued", "running", "success", "error", "idle"];
    const counts = await Promise.all(
      statuses.map(async (status) => {
        const { count, error } = await supabase
          .from("sync_job")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", status);

        if (error) {
          throw error;
        }

        return {
          status,
          count: count ?? 0,
        };
      }),
    );

    return counts.filter((entry) => entry.count > 0);
  }
}
