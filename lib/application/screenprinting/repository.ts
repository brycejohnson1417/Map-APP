import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface ScreenprintingOrderRow {
  id: string;
  account_id: string | null;
  external_order_id: string;
  order_number: string | null;
  licensed_location_name: string | null;
  status: string | null;
  payment_status: string | null;
  order_total: number | string | null;
  order_created_at: string | null;
  delivery_date: string | null;
  sales_rep_name: string | null;
  source_payload: Record<string, unknown> | null;
}

export interface ScreenprintingOpportunityRow {
  id: string;
  organization_id: string;
  account_id: string | null;
  contact_id: string | null;
  source_order_id: string | null;
  source_activity_id: string | null;
  pipeline_key: string;
  stage_key: string;
  title: string;
  value: number | string | null;
  currency: string;
  owner_member_id: string | null;
  source_type: string;
  status: string;
  due_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingReorderSignalRow {
  id: string;
  organization_id: string;
  account_id: string;
  source_order_id: string | null;
  opportunity_id: string | null;
  rule_key: string;
  bucket: string;
  expected_reorder_date: string;
  last_action_at: string | null;
  snoozed_until: string | null;
  owner_member_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingSocialAccountRow {
  id: string;
  organization_id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  external_account_id: string | null;
  ownership: string;
  source: string;
  category: string | null;
  priority: string | null;
  status: string;
  account_id: string | null;
  contact_id: string | null;
  school_or_org_key: string | null;
  profile_url: string | null;
  follower_count: number | null;
  last_synced_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingSocialPostRow {
  id: string;
  organization_id: string;
  social_account_id: string;
  external_post_id: string | null;
  post_type: string;
  caption: string | null;
  permalink: string | null;
  media_url: string | null;
  status: string;
  published_at: string | null;
  scheduled_for: string | null;
  metrics: Record<string, unknown> | null;
  campaign_id: string | null;
  account_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingSocialThreadRow {
  id: string;
  organization_id: string;
  platform: string;
  thread_type: string;
  social_account_id: string | null;
  social_post_id: string | null;
  external_thread_id: string | null;
  participant_handle: string | null;
  account_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  status: string;
  owner_member_id: string | null;
  last_message_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingCampaignRow {
  id: string;
  organization_id: string;
  name: string;
  campaign_type: string;
  status: string;
  owner_member_id: string | null;
  starts_on: string | null;
  ends_on: string | null;
  goal: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingAlertRow {
  id: string;
  organization_id: string;
  alert_rule_id: string | null;
  module: string;
  event_type: string;
  title: string;
  body: string | null;
  severity: string;
  status: string;
  owner_member_id: string | null;
  account_id: string | null;
  opportunity_id: string | null;
  social_account_id: string | null;
  social_post_id: string | null;
  dedupe_key: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingIdentityResolutionRow {
  id: string;
  organization_id: string;
  source_type: string;
  source_ref: Record<string, unknown>;
  target_type: string;
  target_id: string | null;
  status: string;
  confidence: number | string;
  reason: string;
  metadata: Record<string, unknown> | null;
  reviewed_by_member_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingDashboardDefinitionRow {
  id: string;
  organization_id: string;
  dashboard_key: string;
  name: string;
  module: string;
  role_scope: string[];
  definition: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScreenprintingSyncCursorRow {
  scope: string;
  status: string;
  cursor_payload: Record<string, unknown> | null;
  last_successful_sync_at: string | null;
  last_attempted_sync_at: string | null;
  last_error: string | null;
}

function isMissingTableError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";
  return /does not exist|schema cache|Could not find the table|PGRST205/i.test(message);
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function maybeSelect<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
  return data ?? [];
}

async function maybeSingle<T>(query: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }
  return data ?? null;
}

export class ScreenprintingRepository {
  async countAccounts(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    const { count, error } = await supabase
      .from("account")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    if (error) {
      if (isMissingTableError(error)) {
        return 0;
      }
      throw error;
    }
    return count ?? 0;
  }

  async countOrders(organizationId: string, input: { q?: string | null } = {}) {
    const supabase = getSupabaseAdminClient() as any;
    let query = supabase
      .from("order_record")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("provider", "printavo");

    if (input.q?.trim()) {
      query = query.or(`licensed_location_name.ilike.%${input.q.trim()}%,order_number.ilike.%${input.q.trim()}%`);
    }

    const { count, error } = await query;
    if (error) {
      if (isMissingTableError(error)) {
        return 0;
      }
      throw error;
    }
    return count ?? 0;
  }

  async listOrders(organizationId: string, input: { q?: string | null; pageSize?: number } = {}) {
    const supabase = getSupabaseAdminClient() as any;
    let query = supabase
      .from("order_record")
      .select(
        "id,account_id,external_order_id,order_number,licensed_location_name,status,payment_status,order_total,order_created_at,delivery_date,sales_rep_name,source_payload",
      )
      .eq("organization_id", organizationId)
      .eq("provider", "printavo")
      .order("order_created_at", { ascending: false, nullsFirst: false })
      .limit(Math.max(1, Math.min(200, Math.floor(input.pageSize ?? 100))));

    if (input.q?.trim()) {
      query = query.or(`licensed_location_name.ilike.%${input.q.trim()}%,order_number.ilike.%${input.q.trim()}%`);
    }

    return maybeSelect<ScreenprintingOrderRow>(query);
  }

  async listAllOrderMetricRows(organizationId: string, input: { maxRows?: number } = {}) {
    const supabase = getSupabaseAdminClient() as any;
    const pageSize = 1000;
    const maxRows = Math.max(pageSize, Math.min(100_000, Math.floor(input.maxRows ?? 50_000)));
    const total = Math.min(await this.countOrders(organizationId), maxRows);

    if (total === 0) {
      return [];
    }

    const ranges = Array.from({ length: Math.ceil(total / pageSize) }, (_, index) => {
      const from = index * pageSize;
      return { from, to: Math.min(from + pageSize - 1, total - 1) };
    });

    const pages = await Promise.all(
      ranges.map(({ from, to }) =>
        maybeSelect<ScreenprintingOrderRow>(
        supabase
          .from("order_record")
          .select(
            "id,account_id,external_order_id,order_number,licensed_location_name,status,payment_status,order_total,order_created_at,delivery_date,sales_rep_name,source_payload",
          )
          .eq("organization_id", organizationId)
          .eq("provider", "printavo")
          .order("order_created_at", { ascending: false, nullsFirst: false })
          .range(from, to),
      )),
    );

    return pages.flat();
  }

  async readPrintavoSyncStatus(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    const [accounts, orders, cursors] = await Promise.all([
      this.countAccounts(organizationId),
      this.countOrders(organizationId),
      maybeSelect<ScreenprintingSyncCursorRow>(
        supabase
          .from("sync_cursor")
          .select("scope,status,cursor_payload,last_successful_sync_at,last_attempted_sync_at,last_error")
          .eq("organization_id", organizationId)
          .eq("provider", "printavo")
          .order("scope", { ascending: true }),
      ),
    ]);
    const lastSuccessfulSyncAt =
      cursors
        .map((cursor) => cursor.last_successful_sync_at)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;
    const lastAttemptedSyncAt =
      cursors
        .map((cursor) => cursor.last_attempted_sync_at)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;

    return {
      accounts,
      orders,
      lastSuccessfulSyncAt,
      lastAttemptedSyncAt,
      cursors,
    };
  }

  async findOrder(organizationId: string, orderId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSingle<ScreenprintingOrderRow>(
      supabase
        .from("order_record")
        .select(
          "id,account_id,external_order_id,order_number,licensed_location_name,status,payment_status,order_total,order_created_at,delivery_date,sales_rep_name,source_payload",
        )
        .eq("organization_id", organizationId)
        .eq("id", orderId)
        .maybeSingle(),
    );
  }

  async listOpportunities(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingOpportunityRow>(
      supabase
        .from("opportunity")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })
        .limit(200),
    );
  }

  async createOpportunity(organizationId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("opportunity")
      .insert({
        organization_id: organizationId,
        account_id: input.accountId ?? null,
        contact_id: input.contactId ?? null,
        source_order_id: input.sourceOrderId ?? null,
        pipeline_key: input.pipelineKey ?? "sales_pipeline",
        stage_key: input.stageKey ?? "new_lead",
        title: input.title,
        value: input.value ?? null,
        currency: input.currency ?? "USD",
        source_type: input.sourceType ?? "manual",
        status: input.status ?? "open",
        due_at: input.dueAt ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingOpportunityRow;
  }

  async updateOpportunity(organizationId: string, opportunityId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const [inputKey, column] of [
      ["stageKey", "stage_key"],
      ["pipelineKey", "pipeline_key"],
      ["title", "title"],
      ["value", "value"],
      ["status", "status"],
      ["dueAt", "due_at"],
      ["ownerMemberId", "owner_member_id"],
      ["accountId", "account_id"],
      ["contactId", "contact_id"],
    ]) {
      if (inputKey in input) {
        patch[column] = input[inputKey];
      }
    }

    const { data, error } = await supabase
      .from("opportunity")
      .update(patch)
      .eq("organization_id", organizationId)
      .eq("id", opportunityId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingOpportunityRow;
  }

  async listReorderSignals(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingReorderSignalRow>(
      supabase
        .from("reorder_signal")
        .select("*")
        .eq("organization_id", organizationId)
        .order("expected_reorder_date", { ascending: true })
        .limit(300),
    );
  }

  async snoozeReorderSignal(organizationId: string, signalId: string, input: { snoozedUntil: string; reason?: string | null }) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("reorder_signal")
      .update({
        bucket: "snoozed",
        snoozed_until: input.snoozedUntil,
        last_action_at: new Date().toISOString(),
        metadata: {
          snoozeReason: input.reason ?? null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("id", signalId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingReorderSignalRow;
  }

  async listSocialAccounts(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingSocialAccountRow>(
      supabase
        .from("social_account")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })
        .limit(300),
    );
  }

  async createSocialAccount(organizationId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("social_account")
      .insert({
        organization_id: organizationId,
        platform: input.platform,
        handle: String(input.handle ?? "").replace(/^@/, ""),
        display_name: input.displayName ?? null,
        external_account_id: input.externalAccountId ?? null,
        ownership: input.ownership ?? "watched",
        source: input.source ?? "manual",
        category: input.category ?? null,
        priority: input.priority ?? null,
        status: input.status ?? "active",
        account_id: input.accountId ?? null,
        contact_id: input.contactId ?? null,
        school_or_org_key: input.schoolOrOrgKey ?? null,
        profile_url: input.profileUrl ?? null,
        follower_count: toNumber(input.followerCount as number | string | null | undefined),
        last_synced_at: input.lastSyncedAt ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingSocialAccountRow;
  }

  async updateSocialAccount(organizationId: string, socialAccountId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [inputKey, column] of [
      ["category", "category"],
      ["priority", "priority"],
      ["ownership", "ownership"],
      ["status", "status"],
      ["source", "source"],
      ["displayName", "display_name"],
      ["accountId", "account_id"],
      ["contactId", "contact_id"],
      ["externalAccountId", "external_account_id"],
      ["schoolOrOrgKey", "school_or_org_key"],
      ["profileUrl", "profile_url"],
      ["followerCount", "follower_count"],
      ["lastSyncedAt", "last_synced_at"],
      ["metadata", "metadata"],
    ]) {
      if (inputKey in input) {
        patch[column] = column === "follower_count" ? toNumber(input[inputKey] as number | string | null | undefined) : input[inputKey];
      }
    }
    const { data, error } = await supabase
      .from("social_account")
      .update(patch)
      .eq("organization_id", organizationId)
      .eq("id", socialAccountId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingSocialAccountRow;
  }

  async listSocialPosts(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingSocialPostRow>(
      supabase
        .from("social_post")
        .select("*")
        .eq("organization_id", organizationId)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(300),
    );
  }

  async listSocialThreads(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingSocialThreadRow>(
      supabase
        .from("social_thread")
        .select("*")
        .eq("organization_id", organizationId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(300),
    );
  }

  async createSocialThread(organizationId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("social_thread")
      .insert({
        organization_id: organizationId,
        platform: input.platform ?? "instagram",
        thread_type: input.threadType ?? "manual",
        social_account_id: input.socialAccountId ?? null,
        social_post_id: input.socialPostId ?? null,
        external_thread_id: input.externalThreadId ?? null,
        participant_handle: input.participantHandle ?? null,
        account_id: input.accountId ?? null,
        contact_id: input.contactId ?? null,
        opportunity_id: input.opportunityId ?? null,
        status: input.status ?? "needs_review",
        last_message_at: new Date().toISOString(),
        metadata: {
          ...(input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {}),
          summary: input.summary ?? null,
          source: input.source ?? "manual",
        },
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingSocialThreadRow;
  }

  async updateSocialPost(organizationId: string, socialPostId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [inputKey, column] of [
      ["externalPostId", "external_post_id"],
      ["permalink", "permalink"],
      ["mediaUrl", "media_url"],
      ["status", "status"],
      ["publishedAt", "published_at"],
      ["scheduledFor", "scheduled_for"],
      ["metrics", "metrics"],
      ["metadata", "metadata"],
    ]) {
      if (inputKey in input) {
        patch[column] = input[inputKey];
      }
    }
    const { data, error } = await supabase
      .from("social_post")
      .update(patch)
      .eq("organization_id", organizationId)
      .eq("id", socialPostId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingSocialPostRow;
  }

  async createSocialPost(organizationId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("social_post")
      .insert({
        organization_id: organizationId,
        social_account_id: input.socialAccountId,
        external_post_id: null,
        post_type: input.postType ?? "post",
        caption: input.caption ?? null,
        permalink: null,
        media_url: input.mediaUrl ?? null,
        status: input.status ?? "draft",
        published_at: null,
        scheduled_for: input.scheduledFor ?? null,
        metrics: {},
        campaign_id: input.campaignId ?? null,
        account_id: input.accountId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingSocialPostRow;
  }

  async listCampaigns(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingCampaignRow>(
      supabase
        .from("campaign")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false })
        .limit(200),
    );
  }

  async createCampaign(organizationId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("campaign")
      .insert({
        organization_id: organizationId,
        name: input.name,
        campaign_type: input.campaignType ?? "general",
        status: input.status ?? "planned",
        starts_on: input.startsOn ?? null,
        ends_on: input.endsOn ?? null,
        goal: input.goal ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingCampaignRow;
  }

  async listAlerts(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingAlertRow>(
      supabase
        .from("alert_instance")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(300),
    );
  }

  async updateAlert(organizationId: string, alertId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("alert_instance")
      .update({
        status: input.status ?? "read",
        owner_member_id: input.ownerMemberId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("id", alertId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingAlertRow;
  }

  async markAllAlertsRead(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("alert_instance")
      .update({ status: "read", updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("status", "unread")
      .select("id");

    if (error) {
      if (isMissingTableError(error)) {
        return 0;
      }
      throw error;
    }

    return (data ?? []).length;
  }

  async listIdentityResolutions(organizationId: string) {
    const supabase = getSupabaseAdminClient() as any;
    return maybeSelect<ScreenprintingIdentityResolutionRow>(
      supabase
        .from("identity_resolution")
        .select("*")
        .eq("organization_id", organizationId)
        .order("confidence", { ascending: false })
        .limit(300),
    );
  }

  async updateIdentityResolution(organizationId: string, suggestionId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("identity_resolution")
      .update({
        status: input.status,
        reviewed_at: new Date().toISOString(),
        metadata: {
          reviewNote: input.note ?? null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("id", suggestionId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingIdentityResolutionRow;
  }

  async listDashboardDefinitions(organizationId: string, module?: string | null) {
    const supabase = getSupabaseAdminClient() as any;
    let query = supabase
      .from("dashboard_definition")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false })
      .limit(300);

    if (module?.trim()) {
      query = query.eq("module", module.trim());
    }

    return maybeSelect<ScreenprintingDashboardDefinitionRow>(query);
  }

  async createDashboardDefinition(organizationId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("dashboard_definition")
      .insert({
        organization_id: organizationId,
        dashboard_key: input.dashboardKey,
        name: input.name,
        module: input.module,
        role_scope: Array.isArray(input.roleScope) ? input.roleScope : [],
        definition: input.definition ?? {},
        is_default: Boolean(input.isDefault),
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingDashboardDefinitionRow;
  }

  async upsertDashboardDefinition(organizationId: string, input: Record<string, unknown>) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("dashboard_definition")
      .upsert(
        {
          organization_id: organizationId,
          dashboard_key: input.dashboardKey,
          name: input.name,
          module: input.module,
          role_scope: Array.isArray(input.roleScope) ? input.roleScope : [],
          definition: input.definition ?? {},
          is_default: Boolean(input.isDefault),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,dashboard_key" },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ScreenprintingDashboardDefinitionRow;
  }

  toNumber(value: number | string | null | undefined) {
    return toNumber(value);
  }
}
