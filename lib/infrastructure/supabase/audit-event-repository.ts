import "server-only";

import type { AuditEvent, RecordAuditEventInput } from "@/lib/domain/runtime";
import { mapAuditEventRow } from "@/lib/infrastructure/supabase/runtime-mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export class AuditEventRepository {
  async record(input: RecordAuditEventInput): Promise<AuditEvent> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("audit_event")
      .insert({
        organization_id: input.organizationId,
        actor_member_id: input.actorMemberId ?? null,
        event_type: input.eventType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        payload: input.payload ?? {},
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapAuditEventRow(data as Record<string, unknown>);
  }

  async listRecentByOrganizationId(organizationId: string, limit = 20): Promise<AuditEvent[]> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("audit_event")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: unknown) => mapAuditEventRow(row as Record<string, unknown>));
  }
}
