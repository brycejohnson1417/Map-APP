import "server-only";

import type { AuditEventType } from "@/lib/domain/runtime";
import { AuditEventRepository } from "@/lib/infrastructure/supabase/audit-event-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const auditEvents = new AuditEventRepository();

export type ScreenprintingAuditAction =
  | "config_changed"
  | "config_undone"
  | "mapping_changed"
  | "identity_resolution_updated"
  | "opportunity_updated"
  | "reorder_updated"
  | "email_draft_recorded"
  | "social_account_updated"
  | "social_thread_logged"
  | "alert_updated";

const auditEventByAction: Record<ScreenprintingAuditAction, AuditEventType> = {
  config_changed: "screenprinting_config_changed",
  config_undone: "screenprinting_config_undone",
  mapping_changed: "screenprinting_mapping_changed",
  identity_resolution_updated: "identity_resolution_updated",
  opportunity_updated: "opportunity_updated",
  reorder_updated: "reorder_updated",
  email_draft_recorded: "email_draft_recorded",
  social_account_updated: "social_account_updated",
  social_thread_logged: "social_thread_logged",
  alert_updated: "alert_updated",
};

export async function recordScreenprintingAuditEvent(input: {
  organizationId: string;
  actorMemberId?: string | null;
  action: ScreenprintingAuditAction;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}) {
  return auditEvents.record({
    organizationId: input.organizationId,
    actorMemberId: input.actorMemberId ?? null,
    eventType: auditEventByAction[input.action],
    entityType: input.entityType,
    entityId: input.entityId,
    payload: {
      ...input.payload,
      action: input.action,
      module: "screenprinting",
      providerWriteBack: false,
    },
  });
}

export async function recordScreenprintingActivity(input: {
  organizationId: string;
  accountId?: string | null;
  contactId?: string | null;
  actorMemberId?: string | null;
  activityType: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient() as any;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("activity")
    .insert({
      organization_id: input.organizationId,
      account_id: input.accountId ?? null,
      contact_id: input.contactId ?? null,
      actor_member_id: input.actorMemberId ?? null,
      activity_type: input.activityType,
      summary: input.summary,
      occurred_at: now,
      metadata: {
        ...input.metadata,
        module: "screenprinting",
        providerWriteBack: false,
      },
    })
    .select("id,activity_type,summary,occurred_at,metadata,created_at,updated_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: String(data.id),
    activityType: String(data.activity_type),
    summary: String(data.summary),
    occurredAt: String(data.occurred_at),
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}
