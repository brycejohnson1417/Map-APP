import "server-only";

import type { QueueSyncJobInput, SyncJob } from "@/lib/domain/runtime";
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
}
