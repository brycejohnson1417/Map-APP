import "server-only";

import type { SyncCursor } from "@/lib/domain/runtime";
import { mapSyncCursorRow } from "@/lib/infrastructure/supabase/runtime-mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export class SyncCursorRepository {
  async listByOrganizationId(organizationId: string): Promise<SyncCursor[]> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("sync_cursor")
      .select("*")
      .eq("organization_id", organizationId)
      .order("provider", { ascending: true })
      .order("scope", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: unknown) => mapSyncCursorRow(row as Record<string, unknown>));
  }
}
