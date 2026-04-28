import "server-only";

import { createHash } from "node:crypto";
import fixtureData from "@/fixtures/screenprinting/sample-screenprinting-data.json";
import {
  applyScreenprintingConfigPatch,
  buildScreenprintingConfigHistoryEntry,
  createScreenprintingImpactPreview,
  defaultScreenprintingConfig,
  mapPaymentBucket,
  mapStatusBucket,
  readScreenprintingConfigHistory,
  resolveScreenprintingConfig,
  screenprintingConfigToSettingsPatch,
  type ScreenprintingConfig,
  type ScreenprintingConfigSection,
} from "@/lib/application/screenprinting/config";
import { resolveScreenprintingFeatureFlags } from "@/lib/application/screenprinting/feature-flags";
import {
  recordScreenprintingActivity,
  recordScreenprintingAuditEvent,
} from "@/lib/application/screenprinting/audit-hooks";
import {
  ScreenprintingRepository,
  type ScreenprintingAlertRow,
  type ScreenprintingCampaignRow,
  type ScreenprintingIdentityResolutionRow,
  type ScreenprintingOpportunityRow,
  type ScreenprintingOrderRow,
  type ScreenprintingReorderSignalRow,
  type ScreenprintingSocialAccountRow,
  type ScreenprintingSocialPostRow,
  type ScreenprintingSocialThreadRow,
} from "@/lib/application/screenprinting/repository";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { OrganizationRepository } from "@/lib/infrastructure/supabase/organization-repository";
import { createManualSocialAdapter } from "@/lib/infrastructure/adapters/social/manual-social-adapter";
import type { Organization } from "@/lib/domain/runtime";
import type { WorkspaceRuntimeExperience } from "@/lib/application/workspace/workspace-service";

const repository = new ScreenprintingRepository();
const organizations = new OrganizationRepository();
const allOrderCache = new Map<string, { expiresAt: number; promise: Promise<ScreenprintingOrder[]> }>();

export class ScreenprintingServiceError extends Error {
  status: number;
  code: string;

  constructor(code: string, status: number, message = code) {
    super(message);
    this.name = "ScreenprintingServiceError";
    this.status = status;
    this.code = code;
  }
}

type FixtureOrder = {
  source_id: string;
  tenant_slug: string;
  customer_email?: string | null;
  organization_name: string;
  job_name: string;
  status: string;
  payment_status: string;
  tags?: string[];
  total_cents: number;
  created_at: string;
  production_due_date?: string | null;
  customer_due_date?: string | null;
};

type FixtureSocialAccount = {
  source_id: string;
  tenant_slug: string;
  platform: string;
  handle: string;
  ownership: string;
  category?: string;
  priority?: string;
  status?: string;
  followers?: number;
};

type FixtureSocialPost = {
  source_id: string;
  account_source_id: string;
  kind: string;
  caption?: string;
  posted_at?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  engagement_rate?: number;
  alert_candidates?: string[];
};

type FixtureSocialThread = {
  source_id: string;
  tenant_slug: string;
  platform: string;
  handle?: string;
  kind: string;
  body?: string;
  received_at?: string;
  suggested_links?: Array<{
    target_type?: string;
    target_name?: string;
    confidence?: number;
    evidence?: string[];
  }>;
};

type FixtureBundle = {
  printavo_like_orders?: FixtureOrder[];
  social_accounts?: FixtureSocialAccount[];
  social_posts?: FixtureSocialPost[];
  social_threads?: FixtureSocialThread[];
};

const fixture = fixtureData as FixtureBundle;

type ScreenprintingOrder = {
  id: string;
  accountId: string | null;
  externalOrderId: string | null;
  orderNumber: string | null;
  customerName: string;
  jobName: string | null;
  status: string | null;
  statusBucket: string;
  paymentStatus: string | null;
  paymentBucket: string;
  orderTotal: number | null;
  orderCreatedAt: string | null;
  productionDate: string | null;
  customerDueDate: string | null;
  managerName: string | null;
  teamName: string | null;
  tags: string[];
  sourceUrl: string | null;
  sourcePayloadAvailable: boolean;
  dataSource: "fixture" | "printavo";
};

type ScreenprintingOpportunity = {
  id: string;
  accountId: string | null;
  contactId: string | null;
  sourceOrderId: string | null;
  pipelineKey: string;
  stageKey: string;
  title: string;
  value: number | null;
  currency: string;
  ownerMemberId: string | null;
  sourceType: string;
  status: string;
  dueAt: string | null;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

type ScreenprintingReorderSignal = {
  id: string;
  accountId: string;
  sourceOrderId: string | null;
  opportunityId: string | null;
  ruleKey: string;
  bucket: string;
  expectedReorderDate: string;
  lastActionAt: string | null;
  snoozedUntil: string | null;
  ownerMemberId: string | null;
  metadata: Record<string, unknown>;
};

function hashId(parts: unknown[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}

function numberOrZero(value: number | string | null | undefined) {
  const parsed = repository.toNumber(value);
  return parsed ?? 0;
}

function firstString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toDateOnly(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function bucketForDate(value: string) {
  const today = new Date();
  const date = new Date(`${value}T00:00:00.000Z`);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
  if (diffDays < 0) {
    return "overdue";
  }
  if (diffDays <= 14) {
    return "due";
  }
  return "upcoming";
}

function sourceUrl(externalOrderId: string | null) {
  return externalOrderId ? `https://www.printavo.com/orders/${encodeURIComponent(externalOrderId)}` : null;
}

function fixtureOrders(slug: string, config: ScreenprintingConfig): ScreenprintingOrder[] {
  return (fixture.printavo_like_orders ?? [])
    .filter((order) => order.tenant_slug === slug)
    .map((order) => ({
      id: hashId(["fixture_order", order.source_id]),
      accountId: null,
      externalOrderId: order.source_id,
      orderNumber: order.source_id.replace(/^po_/, ""),
      customerName: order.organization_name,
      jobName: order.job_name,
      status: order.status,
      statusBucket: mapStatusBucket(config, order.status),
      paymentStatus: order.payment_status,
      paymentBucket: mapPaymentBucket(config, order.payment_status),
      orderTotal: order.total_cents / 100,
      orderCreatedAt: order.created_at,
      productionDate: order.production_due_date ?? toDateOnly(order.created_at),
      customerDueDate: order.customer_due_date ?? null,
      managerName: null,
      teamName: order.tags?.[0] ?? null,
      tags: order.tags ?? [],
      sourceUrl: sourceUrl(order.source_id),
      sourcePayloadAvailable: true,
      dataSource: "fixture" as const,
    }));
}

function dbOrders(rows: ScreenprintingOrderRow[], config: ScreenprintingConfig): ScreenprintingOrder[] {
  return rows.map((row) => {
    const payload = row.source_payload ?? {};
    return {
      id: row.id,
      accountId: row.account_id,
      externalOrderId: row.external_order_id,
      orderNumber: row.order_number,
      customerName: row.licensed_location_name ?? firstString(payload.customerName) ?? "Unknown customer",
      jobName: firstString(payload.eventName) ?? row.order_number ?? row.external_order_id,
      status: row.status,
      statusBucket: mapStatusBucket(config, row.status),
      paymentStatus: row.payment_status,
      paymentBucket: mapPaymentBucket(config, row.payment_status),
      orderTotal: repository.toNumber(row.order_total),
      orderCreatedAt: row.order_created_at,
      productionDate: row.delivery_date ?? toDateOnly(row.order_created_at),
      customerDueDate: firstString(payload.customerDueDate),
      managerName: row.sales_rep_name,
      teamName: firstString(payload.teamName),
      tags: Array.isArray(payload.tags) ? payload.tags.filter((tag): tag is string => typeof tag === "string") : [],
      sourceUrl: sourceUrl(row.external_order_id),
      sourcePayloadAvailable: Boolean(row.source_payload),
      dataSource: "printavo" as const,
    };
  });
}

function orderDateValue(order: ScreenprintingOrder) {
  return order.orderCreatedAt ?? order.productionDate ?? order.customerDueDate ?? null;
}

function orderTimestamp(order: ScreenprintingOrder) {
  const value = orderDateValue(order);
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function nonCancelledOrderValue(order: ScreenprintingOrder) {
  return order.statusBucket === "cancelled" ? 0 : order.orderTotal ?? 0;
}

function activeRevenueOrders(orders: ScreenprintingOrder[]) {
  return orders.filter((order) => nonCancelledOrderValue(order) > 0);
}

function orderFallsInPeriod(order: ScreenprintingOrder, start: Date | null, end: Date) {
  const timestamp = orderTimestamp(order);
  if (!timestamp) {
    return false;
  }
  return (!start || timestamp >= start.getTime()) && timestamp <= end.getTime();
}

function opportunityFromRow(row: ScreenprintingOpportunityRow): ScreenprintingOpportunity {
  return {
    id: row.id,
    accountId: row.account_id,
    contactId: row.contact_id,
    sourceOrderId: row.source_order_id,
    pipelineKey: row.pipeline_key,
    stageKey: row.stage_key,
    title: row.title,
    value: repository.toNumber(row.value),
    currency: row.currency,
    ownerMemberId: row.owner_member_id,
    sourceType: row.source_type,
    status: row.status,
    dueAt: row.due_at,
    metadata: row.metadata ?? {},
    updatedAt: row.updated_at,
  };
}

function reorderSignalFromRow(row: ScreenprintingReorderSignalRow): ScreenprintingReorderSignal {
  return {
    id: row.id,
    accountId: row.account_id,
    sourceOrderId: row.source_order_id,
    opportunityId: row.opportunity_id,
    ruleKey: row.rule_key,
    bucket: row.bucket,
    expectedReorderDate: row.expected_reorder_date,
    lastActionAt: row.last_action_at,
    snoozedUntil: row.snoozed_until,
    ownerMemberId: row.owner_member_id,
    metadata: row.metadata ?? {},
  };
}

function socialAccountFromRow(row: ScreenprintingSocialAccountRow) {
  return {
    id: row.id,
    platform: row.platform,
    handle: row.handle,
    displayName: row.display_name,
    ownership: row.ownership,
    source: row.source,
    category: row.category,
    priority: row.priority,
    status: row.status,
    accountId: row.account_id,
    contactId: row.contact_id,
    schoolOrOrgKey: row.school_or_org_key,
    profileUrl: row.profile_url,
    followerCount: row.follower_count,
    lastSyncedAt: row.last_synced_at,
    metadata: row.metadata ?? {},
  };
}

function socialPostFromRow(row: ScreenprintingSocialPostRow) {
  return {
    id: row.id,
    socialAccountId: row.social_account_id,
    externalPostId: row.external_post_id,
    postType: row.post_type,
    caption: row.caption,
    permalink: row.permalink,
    mediaUrl: row.media_url,
    status: row.status,
    publishedAt: row.published_at,
    scheduledFor: row.scheduled_for,
    metrics: row.metrics ?? {},
    campaignId: row.campaign_id,
    accountId: row.account_id,
    metadata: row.metadata ?? {},
  };
}

function socialThreadFromRow(row: ScreenprintingSocialThreadRow) {
  return {
    id: row.id,
    platform: row.platform,
    threadType: row.thread_type,
    socialAccountId: row.social_account_id,
    socialPostId: row.social_post_id,
    participantHandle: row.participant_handle,
    accountId: row.account_id,
    contactId: row.contact_id,
    opportunityId: row.opportunity_id,
    status: row.status,
    ownerMemberId: row.owner_member_id,
    lastMessageAt: row.last_message_at,
    metadata: row.metadata ?? {},
  };
}

function campaignFromRow(row: ScreenprintingCampaignRow) {
  return {
    id: row.id,
    name: row.name,
    campaignType: row.campaign_type,
    status: row.status,
    ownerMemberId: row.owner_member_id,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    goal: row.goal,
    metadata: row.metadata ?? {},
  };
}

function alertFromRow(row: ScreenprintingAlertRow) {
  return {
    id: row.id,
    alertRuleId: row.alert_rule_id,
    module: row.module,
    eventType: row.event_type,
    title: row.title,
    body: row.body,
    severity: row.severity,
    status: row.status,
    ownerMemberId: row.owner_member_id,
    accountId: row.account_id,
    opportunityId: row.opportunity_id,
    socialAccountId: row.social_account_id,
    socialPostId: row.social_post_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function identityFromRow(row: ScreenprintingIdentityResolutionRow) {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceRef: row.source_ref,
    targetType: row.target_type,
    targetId: row.target_id,
    status: row.status,
    confidence: repository.toNumber(row.confidence) ?? 0,
    reason: row.reason,
    metadata: row.metadata ?? {},
    reviewedAt: row.reviewed_at,
  };
}

async function resolveContext(slug: string): Promise<{
  slug: string;
  workspace: WorkspaceRuntimeExperience;
  organization: Organization | null;
  config: ScreenprintingConfig;
}> {
  const workspace = await getWorkspaceExperienceBySlug(slug);
  if (workspace.workspace.tenantType?.id !== "screenprinting") {
    throw new ScreenprintingServiceError("screenprinting_not_enabled", 400, `Screenprinting is not enabled for "${slug}".`);
  }

  const { config } = resolveScreenprintingConfig({
    slug,
    workspace: workspace.workspace,
    organization: workspace.organization,
  });

  return {
    slug,
    workspace,
    organization: workspace.organization,
    config,
  };
}

function requireOrganization(context: { organization: Organization | null }) {
  if (!context.organization) {
    throw new ScreenprintingServiceError("organization_not_found", 404, "A saved organization is required for this action.");
  }
  return context.organization;
}

async function listOrdersForContext(context: Awaited<ReturnType<typeof resolveContext>>, input: { q?: string | null; pageSize?: number } = {}) {
  const rows = context.organization ? await repository.listOrders(context.organization.id, input) : [];
  const orders = context.organization ? dbOrders(rows, context.config) : fixtureOrders(context.slug, context.config);
  const q = input.q?.trim().toLowerCase();
  return q
    ? orders.filter((order) => [order.customerName, order.jobName, order.orderNumber].filter(Boolean).join(" ").toLowerCase().includes(q))
    : orders;
}

async function listAllOrdersForContext(context: Awaited<ReturnType<typeof resolveContext>>) {
  if (!context.organization) {
    return fixtureOrders(context.slug, context.config);
  }
  const key = `${context.organization.id}:${context.config.statusMappings.length}:${context.config.paymentMappings.length}`;
  const cached = allOrderCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }
  const promise = repository.listAllOrderMetricRows(context.organization.id).then((rows) => dbOrders(rows, context.config));
  allOrderCache.set(key, { expiresAt: Date.now() + 60_000, promise });
  return promise;
}

function buildFixtureOpportunities(slug: string, config: ScreenprintingConfig): ScreenprintingOpportunity[] {
  const orders = fixtureOrders(slug, config);
  return orders
    .filter((order) => order.statusBucket === "quoted" || order.statusBucket === "needs_review")
    .map((order) => ({
      id: hashId(["fixture_opportunity", order.id]),
      accountId: order.accountId,
      contactId: null,
      sourceOrderId: order.id,
      pipelineKey: "sales_pipeline",
      stageKey: order.statusBucket === "quoted" ? "quote_sent" : "needs_review",
      title: order.jobName ?? order.customerName,
      value: order.orderTotal,
      currency: "USD",
      ownerMemberId: null,
      sourceType: "printavo_quote",
      status: "open",
      dueAt: order.customerDueDate,
      metadata: {
        fixture: true,
        customerName: order.customerName,
      },
      updatedAt: order.productionDate ?? new Date().toISOString(),
    }));
}

function buildDerivedOpportunities(orders: ScreenprintingOrder[]): ScreenprintingOpportunity[] {
  return orders
    .filter((order) => order.statusBucket === "quoted" || order.statusBucket === "needs_review")
    .sort((left, right) => orderTimestamp(right) - orderTimestamp(left))
    .slice(0, 300)
    .map((order) => ({
      id: hashId(["derived_opportunity", order.id, order.status, order.paymentStatus]),
      accountId: order.accountId,
      contactId: null,
      sourceOrderId: order.id,
      pipelineKey: "sales_pipeline",
      stageKey: order.statusBucket === "quoted" ? "proposal_sent" : "needs_review",
      title: order.jobName ?? order.customerName,
      value: order.orderTotal,
      currency: "USD",
      ownerMemberId: order.managerName,
      sourceType: "printavo_read_only",
      status: "open",
      dueAt: order.customerDueDate ?? order.productionDate,
      metadata: {
        derived: true,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        printavoStatus: order.status,
        paymentStatus: order.paymentStatus,
      },
      updatedAt: order.orderCreatedAt ?? order.productionDate ?? new Date().toISOString(),
    }));
}

function buildFixtureReorderSignals(slug: string, config: ScreenprintingConfig): ScreenprintingReorderSignal[] {
  const [defaultRule = { ruleKey: "annual_reorder", cycleDays: 365, category: "default", priority: "medium", enabled: true }] =
    config.reorderRules.filter((rule) => rule.enabled);
  return fixtureOrders(slug, config).map((order) => {
    const baseDate = order.productionDate ?? toDateOnly(new Date().toISOString()) ?? new Date().toISOString().slice(0, 10);
    const expectedReorderDate = addDays(baseDate, defaultRule.cycleDays);
    return {
      id: hashId(["fixture_reorder", order.id, defaultRule.ruleKey]),
      accountId: order.accountId ?? hashId(["fixture_account", order.customerName]),
      sourceOrderId: order.id,
      opportunityId: null,
      ruleKey: defaultRule.ruleKey,
      bucket: bucketForDate(expectedReorderDate),
      expectedReorderDate,
      lastActionAt: null,
      snoozedUntil: null,
      ownerMemberId: null,
      metadata: {
        fixture: true,
        category: defaultRule.category,
        priority: defaultRule.priority,
        customerName: order.customerName,
      },
    };
  });
}

function buildDerivedReorderSignals(orders: ScreenprintingOrder[], config: ScreenprintingConfig): ScreenprintingReorderSignal[] {
  const enabledRules = config.reorderRules.filter((rule) => rule.enabled);
  const [defaultRule = { ruleKey: "annual_reorder", cycleDays: 365, category: "default", priority: "medium", enabled: true }] = enabledRules;
  const latestByCustomer = new Map<string, ScreenprintingOrder>();
  for (const order of orders) {
    if (order.statusBucket === "cancelled" || !normalizeName(order.customerName)) {
      continue;
    }
    const key = normalizeName(order.customerName);
    const previous = latestByCustomer.get(key);
    if (!previous || orderTimestamp(order) > orderTimestamp(previous)) {
      latestByCustomer.set(key, order);
    }
  }

  return [...latestByCustomer.values()]
    .map((order) => {
      const baseDate = toDateOnly(orderDateValue(order)) ?? new Date().toISOString().slice(0, 10);
      const expectedReorderDate = addDays(baseDate, defaultRule.cycleDays);
      return {
        id: hashId(["derived_reorder", order.id, defaultRule.ruleKey]),
        accountId: order.accountId ?? hashId(["derived_account", order.customerName]),
        sourceOrderId: order.id,
        opportunityId: null,
        ruleKey: defaultRule.ruleKey,
        bucket: bucketForDate(expectedReorderDate),
        expectedReorderDate,
        lastActionAt: null,
        snoozedUntil: null,
        ownerMemberId: order.managerName,
        metadata: {
          derived: true,
          category: defaultRule.category,
          priority: defaultRule.priority,
          customerName: order.customerName,
          contactName: order.managerName,
          lastOrderName: order.jobName,
          lastOrderTotal: order.orderTotal,
          lastOrderDate: orderDateValue(order),
          cycleDays: defaultRule.cycleDays,
        },
      };
    })
    .sort((left, right) => left.expectedReorderDate.localeCompare(right.expectedReorderDate));
}

async function listOpportunitiesForContext(context: Awaited<ReturnType<typeof resolveContext>>) {
  const rows = context.organization ? await repository.listOpportunities(context.organization.id) : [];
  if (rows.length) {
    return rows.map(opportunityFromRow);
  }
  return context.organization ? buildDerivedOpportunities(await listAllOrdersForContext(context)) : buildFixtureOpportunities(context.slug, context.config);
}

async function listReordersForContext(context: Awaited<ReturnType<typeof resolveContext>>) {
  const rows = context.organization ? await repository.listReorderSignals(context.organization.id) : [];
  if (rows.length) {
    return rows.map(reorderSignalFromRow);
  }
  return context.organization ? buildDerivedReorderSignals(await listAllOrdersForContext(context), context.config) : buildFixtureReorderSignals(context.slug, context.config);
}

function groupOpportunities(opportunities: ScreenprintingOpportunity[]) {
  const stages = [
    { key: "new_lead", label: "New Lead" },
    { key: "contacted", label: "Contacted" },
    { key: "proposal_sent", label: "Proposal Sent" },
    { key: "quote_sent", label: "Quote Sent" },
    { key: "needs_review", label: "Needs Review" },
    { key: "follow_up", label: "Follow Up" },
    { key: "won", label: "Won" },
  ];

  return [
    {
      key: "sales_pipeline",
      stages: stages.map((stage) => {
        const stageOpportunities = opportunities.filter((opportunity) => opportunity.stageKey === stage.key);
        return {
          ...stage,
          count: stageOpportunities.length,
          value: stageOpportunities.reduce((sum, opportunity) => sum + (opportunity.value ?? 0), 0),
          opportunities: stageOpportunities,
        };
      }),
    },
  ];
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start;
}

function buildCustomerSummaries(orders: ScreenprintingOrder[]) {
  const customers = new Map<
    string,
    {
      name: string;
      accountId: string | null;
      total: number;
      orderCount: number;
      contactCount: number;
      category: string;
      managerName: string | null;
      lastOrderAt: string | null;
    }
  >();

  for (const order of orders) {
    const key = normalizeName(order.customerName);
    if (!key) {
      continue;
    }
    const current =
      customers.get(key) ??
      {
        name: order.customerName,
        accountId: order.accountId,
        total: 0,
        orderCount: 0,
        contactCount: 0,
        category: order.tags[0] ?? order.teamName ?? "Unmapped",
        managerName: order.managerName,
        lastOrderAt: null,
      };
    current.total += nonCancelledOrderValue(order);
    current.orderCount += 1;
    current.contactCount += order.managerName ? 1 : 0;
    current.accountId = current.accountId ?? order.accountId;
    current.managerName = current.managerName ?? order.managerName;
    const orderDate = orderDateValue(order);
    if (orderDate && (!current.lastOrderAt || new Date(orderDate).getTime() > new Date(current.lastOrderAt).getTime())) {
      current.lastOrderAt = orderDate;
      current.category = order.tags[0] ?? order.teamName ?? current.category;
    }
    customers.set(key, current);
  }

  return [...customers.values()].sort((left, right) => right.total - left.total || right.orderCount - left.orderCount);
}

function buildPeriodMetric(orders: ScreenprintingOrder[], start: Date | null, end: Date) {
  const scoped = orders.filter((order) => orderFallsInPeriod(order, start, end));
  const revenueOrders = activeRevenueOrders(scoped);
  const revenue = revenueOrders.reduce((sum, order) => sum + (order.orderTotal ?? 0), 0);
  return {
    orders: scoped.length,
    revenue,
    averageOrderValue: revenueOrders.length ? revenue / revenueOrders.length : 0,
    paidOrders: scoped.filter((order) => order.paymentBucket === "paid").length,
    unpaidOrders: scoped.filter((order) => order.paymentBucket === "unpaid").length,
    quotedOrders: scoped.filter((order) => order.statusBucket === "quoted").length,
    inProductionOrders: scoped.filter((order) => order.statusBucket === "in_production").length,
    completedOrders: scoped.filter((order) => order.statusBucket === "completed").length,
    cancelledOrders: scoped.filter((order) => order.statusBucket === "cancelled").length,
  };
}

function buildDailySeries(orders: ScreenprintingOrder[], now = new Date()) {
  const latestOrderTimestamp = Math.max(0, ...orders.map(orderTimestamp));
  const anchor = latestOrderTimestamp ? new Date(latestOrderTimestamp) : now;
  const buckets = Array.from({ length: 8 }, (_, index) => {
    const start = startOfDay(anchor);
    start.setDate(start.getDate() - (7 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setMilliseconds(end.getMilliseconds() - 1);
    return {
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(start),
      start,
      end,
      posts: 0,
      revenue: 0,
      orders: 0,
    };
  });
  for (const order of orders) {
    const timestamp = orderTimestamp(order);
    if (!timestamp) {
      continue;
    }
    const bucket = buckets.find((candidate) => timestamp >= candidate.start.getTime() && timestamp <= candidate.end.getTime());
    if (!bucket) {
      continue;
    }
    bucket.orders += 1;
    bucket.revenue += nonCancelledOrderValue(order);
  }
  return buckets.map(({ label, revenue, orders }) => ({ label, revenue, orders }));
}

export async function getScreenprintingConfigPayload(slug: string) {
  const context = await resolveContext(slug);
  const resolved = resolveScreenprintingConfig({
    slug,
    workspace: context.workspace.workspace,
    organization: context.organization,
  });

  return {
    config: resolved.config,
    source: resolved.source,
    definitions: Object.keys(defaultScreenprintingConfig),
    history: readScreenprintingConfigHistory(context.organization),
  };
}

export async function previewScreenprintingConfigChange(slug: string, input: { section: ScreenprintingConfigSection; draftChanges: unknown }) {
  const context = await resolveContext(slug);
  return createScreenprintingImpactPreview({
    section: input.section,
    draftChanges: input.draftChanges,
    currentConfig: context.config,
    fixtureTenantSlug: slug,
    orderStatuses: (await listOrdersForContext(context)).map((order) => order.status).filter((status): status is string => Boolean(status)),
  });
}

export async function updateScreenprintingConfig(
  slug: string,
  input: { section: ScreenprintingConfigSection; changes: unknown; previewToken?: string | null; actorEmail?: string | null },
) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const before = context.config[input.section];
  const nextConfig = applyScreenprintingConfigPatch({
    currentConfig: context.config,
    section: input.section,
    changes: input.changes,
  });
  const after = nextConfig[input.section];
  const history = [
    ...readScreenprintingConfigHistory(organization),
    buildScreenprintingConfigHistoryEntry({
      section: input.section,
      actorEmail: input.actorEmail,
      before,
      after,
      previewToken: input.previewToken,
    }),
  ].slice(-50);
  const settings = {
    ...organization.settings,
    screenprinting: screenprintingConfigToSettingsPatch(nextConfig, history),
  };
  const updated = await organizations.updateSettings(organization.id, settings);
  const { config } = resolveScreenprintingConfig({ slug, workspace: context.workspace.workspace, organization: updated });
  const impact = await previewScreenprintingConfigChange(slug, { section: input.section, draftChanges: input.changes });

  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: input.section.includes("Mapping") || input.section === "fieldTrust" ? "mapping_changed" : "config_changed",
    entityType: "screenprinting_config",
    entityId: input.section,
    payload: {
      section: input.section,
      previewToken: input.previewToken ?? null,
      affectedDashboards: impact.affectedDashboards,
    },
  });

  return { config, impact };
}

export async function getScreenprintingSalesDashboard(slug: string) {
  const context = await resolveContext(slug);
  const orders = await listAllOrdersForContext(context);
  const opportunities = await listOpportunitiesForContext(context);
  const reorders = await listReordersForContext(context);
  const revenueOrders = activeRevenueOrders(orders);
  const revenue = revenueOrders.reduce((sum, order) => sum + (order.orderTotal ?? 0), 0);
  const customers = buildCustomerSummaries(orders);
  const repeatCustomers = customers.filter((customer) => customer.orderCount > 1);
  const customerOrderCounts = new Map(customers.map((customer) => [normalizeName(customer.name), customer.orderCount]));
  const repeatRevenue = revenueOrders
    .filter((order) => (customerOrderCounts.get(normalizeName(order.customerName)) ?? 0) > 1)
    .reduce((sum, order) => sum + (order.orderTotal ?? 0), 0);
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const sevenDaysStart = new Date(todayStart);
  sevenDaysStart.setDate(sevenDaysStart.getDate() - 7);
  const thirtyDaysStart = new Date(todayStart);
  thirtyDaysStart.setDate(thirtyDaysStart.getDate() - 30);
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ytdStart = new Date(now.getFullYear(), 0, 1);
  const periodMetrics = {
    today: buildPeriodMetric(orders, todayStart, now),
    yesterday: buildPeriodMetric(orders, yesterdayStart, todayStart),
    thisWeek: buildPeriodMetric(orders, startOfWeek(now), now),
    sevenDays: buildPeriodMetric(orders, sevenDaysStart, now),
    thirtyDays: buildPeriodMetric(orders, thirtyDaysStart, now),
    mtd: buildPeriodMetric(orders, mtdStart, now),
    ytd: buildPeriodMetric(orders, ytdStart, now),
    allTime: buildPeriodMetric(orders, null, now),
  };
  const statusBreakdown = Object.entries(
    orders.reduce<Record<string, number>>((counts, order) => {
      counts[order.statusBucket] = (counts[order.statusBucket] ?? 0) + 1;
      return counts;
    }, {}),
  ).map(([bucket, count]) => ({ bucket, count }));
  const paymentBreakdown = Object.entries(
    orders.reduce<Record<string, number>>((counts, order) => {
      counts[order.paymentBucket] = (counts[order.paymentBucket] ?? 0) + 1;
      return counts;
    }, {}),
  ).map(([bucket, count]) => ({ bucket, count }));
  const managerPerformance = Object.entries(
    revenueOrders.reduce<Record<string, { revenue: number; orders: number }>>((byManager, order) => {
      const manager = order.managerName ?? "Unassigned";
      const current = byManager[manager] ?? { revenue: 0, orders: 0 };
      current.revenue += order.orderTotal ?? 0;
      current.orders += 1;
      byManager[manager] = current;
      return byManager;
    }, {}),
  )
    .map(([managerName, values]) => ({ managerName, ...values }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 20);
  const latestOrderCreatedAt =
    orders
      .map(orderDateValue)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  return {
    metrics: {
      revenue,
      averageOrderValue: revenueOrders.length ? revenue / revenueOrders.length : 0,
      averageOrdersPerCustomer: customers.length ? orders.length / customers.length : 0,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      repeatCustomers: repeatCustomers.length,
      repeatCustomerRate: customers.length ? repeatCustomers.length / customers.length : 0,
      bulkOrders: orders.filter((order) => (order.orderTotal ?? 0) >= 1000).length,
      personalSales: orders.length,
      repeatRevenue,
      dueReorders: reorders.filter((signal) => signal.bucket === "due" || signal.bucket === "overdue").length,
      quotedOrders: orders.filter((order) => order.statusBucket === "quoted").length,
      inProductionOrders: orders.filter((order) => order.statusBucket === "in_production").length,
      completedOrders: orders.filter((order) => order.statusBucket === "completed").length,
      cancelledOrders: orders.filter((order) => order.statusBucket === "cancelled").length,
      paidOrders: orders.filter((order) => order.paymentBucket === "paid").length,
      unpaidOrders: orders.filter((order) => order.paymentBucket === "unpaid").length,
      latestOrderCreatedAt,
    },
    ticker: opportunities.slice(0, 10),
    managerPerformance,
    periodPerformance: buildDailySeries(orders, now),
    periodMetrics,
    statusBreakdown,
    paymentBreakdown,
    topCustomers: customers.slice(0, 200),
    printavoSyncStatus: context.organization ? await repository.readPrintavoSyncStatus(context.organization.id) : null,
    dirtyDataWarnings: context.config.fieldTrust
      .filter((field) => field.trustLevel !== "trusted")
      .map((field) => ({ fieldKey: field.fieldKey, warning: field.warning ?? "Review before using as authoritative." })),
  };
}

export async function listScreenprintingOrders(slug: string, input: { q?: string | null; pageSize?: number } = {}) {
  const context = await resolveContext(slug);
  const [orders, total] = await Promise.all([
    listOrdersForContext(context, input),
    context.organization ? repository.countOrders(context.organization.id, { q: input.q }) : Promise.resolve(fixtureOrders(context.slug, context.config).length),
  ]);
  return {
    orders,
    facets: {
      statusBuckets: Object.entries(
        orders.reduce<Record<string, number>>((counts, order) => {
          counts[order.statusBucket] = (counts[order.statusBucket] ?? 0) + 1;
          return counts;
        }, {}),
      ).map(([name, count]) => ({ name, count })),
      paymentBuckets: Object.entries(
        orders.reduce<Record<string, number>>((counts, order) => {
          counts[order.paymentBucket] = (counts[order.paymentBucket] ?? 0) + 1;
          return counts;
        }, {}),
      ).map(([name, count]) => ({ name, count })),
    },
    pagination: { page: 1, pageSize: orders.length, total },
  };
}

export async function getScreenprintingOrderDetail(slug: string, orderId: string) {
  const context = await resolveContext(slug);
  const row = context.organization ? await repository.findOrder(context.organization.id, orderId) : null;
  const order = row ? dbOrders([row], context.config)[0] : fixtureOrders(context.slug, context.config).find((candidate) => candidate.id === orderId);
  if (!order) {
    throw new ScreenprintingServiceError("order_not_found", 404);
  }
  return {
    order: {
      ...order,
      source: "printavo",
      totals: {
        total: order.orderTotal,
        cost: null,
        margin: null,
      },
      lineItems: [],
      customer: { name: order.customerName },
    },
  };
}

export async function listScreenprintingOpportunities(slug: string) {
  const context = await resolveContext(slug);
  const opportunities = await listOpportunitiesForContext(context);
  return { pipelines: groupOpportunities(opportunities) };
}

export async function createScreenprintingOpportunity(slug: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const opportunity = opportunityFromRow(await repository.createOpportunity(organization.id, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "opportunity_updated",
    entityType: "opportunity",
    entityId: opportunity.id,
    payload: { operation: "created", title: opportunity.title },
  });
  return opportunity;
}

export async function updateScreenprintingOpportunity(slug: string, opportunityId: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const opportunity = opportunityFromRow(await repository.updateOpportunity(organization.id, opportunityId, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "opportunity_updated",
    entityType: "opportunity",
    entityId: opportunity.id,
    payload: { operation: "updated" },
  });
  return opportunity;
}

export async function listScreenprintingReorders(slug: string) {
  const context = await resolveContext(slug);
  const signals = await listReordersForContext(context);
  const buckets = {
    overdue: signals.filter((signal) => signal.bucket === "overdue"),
    due: signals.filter((signal) => signal.bucket === "due"),
    upcoming: signals.filter((signal) => signal.bucket === "upcoming"),
    snoozed: signals.filter((signal) => signal.bucket === "snoozed"),
  };
  return {
    buckets,
    counts: {
      overdue: buckets.overdue.length,
      due: buckets.due.length,
      upcoming: buckets.upcoming.length,
      snoozed: buckets.snoozed.length,
    },
  };
}

export async function snoozeScreenprintingReorder(slug: string, signalId: string, input: { snoozedUntil: string; reason?: string | null }) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const reorderSignal = reorderSignalFromRow(await repository.snoozeReorderSignal(organization.id, signalId, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "reorder_updated",
    entityType: "reorder_signal",
    entityId: reorderSignal.id,
    payload: { operation: "snoozed", snoozedUntil: input.snoozedUntil },
  });
  return reorderSignal;
}

export async function renderScreenprintingEmailDraft(slug: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const templateKey = firstString(input.templateKey) ?? "reorder_follow_up";
  const template = context.config.emailTemplates.find((candidate) => candidate.templateKey === templateKey) ?? context.config.emailTemplates[0];
  const accountName = firstString(input.accountName) ?? "your organization";
  const contactName = firstString(input.contactName) ?? "there";
  const senderName = firstString(input.senderName) ?? context.workspace.organization?.name ?? context.workspace.workspace.displayName;
  const tokens = { accountName, contactName, senderName };
  const render = (value: string) =>
    Object.entries(tokens).reduce((output, [key, tokenValue]) => output.replaceAll(`{{${key}}}`, tokenValue), value);
  const subject = render(template.subjectTemplate);
  const body = render(template.bodyTemplate);
  const draft = {
    id: hashId(["email_draft", slug, templateKey, accountName, contactName, body]),
    to: firstString(input.to) ?? null,
    subject,
    body,
    copyText: `${subject}\n\n${body}`,
    templateKey,
    sent: false,
  };

  if (context.organization) {
    await recordScreenprintingAuditEvent({
      organizationId: context.organization.id,
      action: "email_draft_recorded",
      entityType: "email_draft",
      entityId: draft.id,
      payload: { operation: "rendered", templateKey, sendsEmail: false },
    });
  }

  return draft;
}

export async function markScreenprintingEmailDraftSent(slug: string, draftId: string) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const activity = await recordScreenprintingActivity({
    organizationId: organization.id,
    activityType: "screenprinting_email_draft_marked_sent",
    summary: "Email draft marked sent outside the app.",
    metadata: { draftId, sendsEmail: false },
  });
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "email_draft_recorded",
    entityType: "email_draft",
    entityId: draftId,
    payload: { operation: "marked_sent", sendsEmail: false },
  });
  return activity;
}

async function listSocialAccountsForContext(context: Awaited<ReturnType<typeof resolveContext>>) {
  const rows = context.organization ? await repository.listSocialAccounts(context.organization.id) : [];
  if (rows.length) {
    return rows.map(socialAccountFromRow);
  }
  if (context.organization) {
    return [];
  }
  const adapter = createManualSocialAdapter({ tenantSlug: context.slug });
  return [...(await adapter.listOwnedAccounts()), ...(await adapter.listWatchedAccounts())].map((account) => ({
    id: account.id,
    platform: account.platform,
    handle: account.handle,
    displayName: account.displayName,
    ownership: account.ownership,
    source: account.source,
    category: account.category,
    priority: account.priority,
    status: account.status,
    accountId: null,
    contactId: null,
    schoolOrOrgKey: null,
    profileUrl: null,
    followerCount: account.followerCount,
    lastSyncedAt: null,
    metadata: account.metadata,
  }));
}

async function listSocialPostsForContext(context: Awaited<ReturnType<typeof resolveContext>>) {
  const rows = context.organization ? await repository.listSocialPosts(context.organization.id) : [];
  if (rows.length) {
    return rows.map(socialPostFromRow);
  }
  if (context.organization) {
    return [];
  }
  const adapter = createManualSocialAdapter({ tenantSlug: context.slug });
  return (await adapter.fetchPosts()).map((post) => ({
    id: post.id,
    socialAccountId: post.socialAccountId,
    externalPostId: post.externalPostId,
    postType: post.postType,
    caption: post.caption,
    permalink: post.permalink,
    mediaUrl: null,
    status: post.status,
    publishedAt: post.publishedAt,
    scheduledFor: null,
    metrics: post.metrics,
    campaignId: null,
    accountId: null,
    metadata: post.metadata,
  }));
}

async function listSocialThreadsForContext(context: Awaited<ReturnType<typeof resolveContext>>) {
  const rows = context.organization ? await repository.listSocialThreads(context.organization.id) : [];
  if (rows.length) {
    return rows.map(socialThreadFromRow);
  }
  if (context.organization) {
    return [];
  }
  const adapter = createManualSocialAdapter({ tenantSlug: context.slug });
  return (await adapter.fetchThreads()).map((thread) => ({
    id: thread.id,
    platform: thread.platform,
    threadType: thread.threadType,
    socialAccountId: null,
    socialPostId: null,
    participantHandle: thread.participantHandle,
    accountId: null,
    contactId: null,
    opportunityId: null,
    status: thread.status,
    ownerMemberId: null,
    lastMessageAt: thread.lastMessageAt,
    metadata: thread.metadata,
  }));
}

export async function getScreenprintingSocialDashboard(slug: string) {
  const context = await resolveContext(slug);
  const [accounts, posts, alerts] = await Promise.all([
    listSocialAccountsForContext(context),
    listSocialPostsForContext(context),
    listScreenprintingAlerts(slug),
  ]);
  return {
    metrics: {
      trackedAccounts: accounts.length,
      activeAccounts: accounts.filter((account) => account.status === "active").length,
      totalPosts: posts.length,
      newPosts: posts.filter((post) => post.publishedAt && new Date(post.publishedAt).getTime() > Date.now() - 30 * 86_400_000).length,
      unreadAlerts: alerts.counts.unread ?? 0,
      totalEngagement: posts.reduce(
        (sum, post) =>
          sum +
          numberOrZero(post.metrics.likes as number | string | null | undefined) +
          numberOrZero(post.metrics.comments as number | string | null | undefined) +
          numberOrZero(post.metrics.shares as number | string | null | undefined),
        0,
      ),
    },
    activity: {
      posts: posts.slice(0, 10),
      likes: [],
      comments: [],
      views: [],
    },
    recentAlerts: alerts.alerts.slice(0, 5),
    coverageBreakdown: Object.entries(
      accounts.reduce<Record<string, number>>((counts, account) => {
        counts[account.category ?? "uncategorized"] = (counts[account.category ?? "uncategorized"] ?? 0) + 1;
        return counts;
      }, {}),
    ).map(([category, count]) => ({ category, count })),
  };
}

export async function listScreenprintingSocialAccounts(slug: string) {
  const context = await resolveContext(slug);
  const accounts = await listSocialAccountsForContext(context);
  return { accounts, facets: {}, pagination: { page: 1, pageSize: accounts.length, total: accounts.length } };
}

export async function createScreenprintingSocialAccount(slug: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const socialAccount = socialAccountFromRow(await repository.createSocialAccount(organization.id, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "social_account_updated",
    entityType: "social_account",
    entityId: socialAccount.id,
    payload: { operation: "manual_created", providerWriteBack: false },
  });
  return socialAccount;
}

export async function scanScreenprintingSocialAccounts(slug: string) {
  const context = await resolveContext(slug);
  const adapter = createManualSocialAdapter({ tenantSlug: context.slug });
  return {
    discovered: [...(await adapter.listOwnedAccounts()), ...(await adapter.listWatchedAccounts())],
    created: 0,
    updated: 0,
    warnings: ["Live social provider scanning is unavailable; manual import fallback is active."],
  };
}

export async function getScreenprintingSocialAccount(slug: string, socialAccountId: string) {
  const context = await resolveContext(slug);
  const [accounts, posts, threads] = await Promise.all([
    listSocialAccountsForContext(context),
    listSocialPostsForContext(context),
    listSocialThreadsForContext(context),
  ]);
  const socialAccount = accounts.find((account) => account.id === socialAccountId);
  if (!socialAccount) {
    throw new ScreenprintingServiceError("social_account_not_found", 404);
  }
  return {
    socialAccount,
    weeklyTrends: [],
    posts: posts.filter((post) => post.socialAccountId === socialAccountId),
    syncHistory: [],
    linkedEntities: threads.filter((thread) => thread.socialAccountId === socialAccountId),
  };
}

export async function updateScreenprintingSocialAccount(slug: string, socialAccountId: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const socialAccount = socialAccountFromRow(await repository.updateSocialAccount(organization.id, socialAccountId, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "social_account_updated",
    entityType: "social_account",
    entityId: socialAccount.id,
    payload: { operation: "updated", providerWriteBack: false },
  });
  return socialAccount;
}

export async function listScreenprintingSocialPosts(slug: string) {
  const context = await resolveContext(slug);
  const posts = await listSocialPostsForContext(context);
  return { posts, pagination: { page: 1, pageSize: posts.length, total: posts.length } };
}

export async function getScreenprintingSocialPost(slug: string, postId: string) {
  const context = await resolveContext(slug);
  const posts = await listSocialPostsForContext(context);
  const post = posts.find((candidate) => candidate.id === postId);
  if (!post) {
    throw new ScreenprintingServiceError("social_post_not_found", 404);
  }
  return {
    post,
    comments: [],
    linkedCampaign: null,
    linkedAccount: null,
    permissions: {
      canReply: context.config.featureFlags.comments_replies,
      reason: context.config.featureFlags.comments_replies ? null : "comments_replies_feature_disabled",
    },
  };
}

export async function createScreenprintingSocialComment(slug: string, _postId: string) {
  const context = await resolveContext(slug);
  if (!context.config.featureFlags.comments_replies) {
    throw new ScreenprintingServiceError("comments_replies_feature_disabled", 403);
  }
  throw new ScreenprintingServiceError("live_social_writeback_disabled", 403, "Social write-back is disabled for the MVP.");
}

export async function getScreenprintingSocialCalendar(slug: string) {
  const context = await resolveContext(slug);
  const posts = await listSocialPostsForContext(context);
  return {
    items: posts.map((post) => ({
      id: post.id,
      type: post.status === "planned" || post.status === "scheduled" ? "planned_post" : "published_post",
      title: post.caption?.slice(0, 80) || "Social post",
      status: post.status,
      scheduledFor: post.scheduledFor ?? post.publishedAt,
      owner: null,
      campaign: null,
      socialAccount: post.socialAccountId,
      assets: [],
    })),
  };
}

export async function listScreenprintingCampaigns(slug: string) {
  const context = await resolveContext(slug);
  const rows = context.organization ? await repository.listCampaigns(context.organization.id) : [];
  return { campaigns: rows.map(campaignFromRow) };
}

export async function createScreenprintingCampaign(slug: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  return campaignFromRow(await repository.createCampaign(organization.id, input));
}

export async function listScreenprintingAlerts(slug: string) {
  const context = await resolveContext(slug);
  const rows = context.organization ? await repository.listAlerts(context.organization.id) : [];
  const alerts = rows.length
    ? rows.map(alertFromRow)
    : context.organization
      ? []
      : (await listSocialPostsForContext(context))
        .filter((post) => Array.isArray(post.metadata.alertCandidates) && post.metadata.alertCandidates.length)
        .map((post) => ({
          id: hashId(["fixture_alert", post.id]),
          alertRuleId: null,
          module: "social",
          eventType: "engagement_spike",
          title: "Engagement spike detected",
          body: post.caption,
          severity: "medium",
          status: "unread",
          ownerMemberId: null,
          accountId: post.accountId,
          opportunityId: null,
          socialAccountId: post.socialAccountId,
          socialPostId: post.id,
          metadata: { threshold: "3%", postId: post.id },
          createdAt: post.publishedAt ?? new Date().toISOString(),
        }));
  return {
    alerts,
    counts: {
      unread: alerts.filter((alert) => alert.status === "unread").length,
      read: alerts.filter((alert) => alert.status === "read").length,
      resolved: alerts.filter((alert) => alert.status === "resolved").length,
    },
  };
}

export async function updateScreenprintingAlert(slug: string, alertId: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const alert = alertFromRow(await repository.updateAlert(organization.id, alertId, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "alert_updated",
    entityType: "alert_instance",
    entityId: alert.id,
    payload: { status: alert.status },
  });
  return alert;
}

export async function markAllScreenprintingAlertsRead(slug: string) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const updated = await repository.markAllAlertsRead(organization.id);
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "alert_updated",
    entityType: "alert_instance",
    entityId: "bulk",
    payload: { operation: "mark_all_read", updated },
  });
  return updated;
}

export async function listScreenprintingSocialThreads(slug: string) {
  const context = await resolveContext(slug);
  const threads = await listSocialThreadsForContext(context);
  return { threads };
}

export async function createScreenprintingSocialThread(slug: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const thread = socialThreadFromRow(await repository.createSocialThread(organization.id, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "social_thread_logged",
    entityType: "social_thread",
    entityId: thread.id,
    payload: { operation: "manual_created", providerWriteBack: false },
  });
  return thread;
}

export async function listScreenprintingIdentityResolutions(slug: string) {
  const context = await resolveContext(slug);
  const rows = context.organization ? await repository.listIdentityResolutions(context.organization.id) : [];
  const suggestions = rows.length
    ? rows.map(identityFromRow)
    : context.organization
      ? []
      : (fixture.social_threads ?? [])
        .filter((thread) => thread.tenant_slug === slug)
        .flatMap((thread) =>
          (thread.suggested_links ?? []).map((suggestion) => ({
            id: hashId(["fixture_identity", thread.source_id, suggestion.target_name]),
            sourceType: "social_thread",
            sourceRef: {
              threadId: thread.source_id,
              platform: thread.platform,
              handle: thread.handle ?? null,
            },
            targetType: suggestion.target_type ?? "account",
            targetId: null,
            status: "suggested",
            confidence: suggestion.confidence ?? 0.5,
            reason: (suggestion.evidence ?? ["Manual review suggested"]).join(", "),
            metadata: { targetName: suggestion.target_name ?? null, fixture: true },
            reviewedAt: null,
          })),
        );
  return { suggestions };
}

export async function updateScreenprintingIdentityResolution(slug: string, suggestionId: string, input: Record<string, unknown>) {
  const context = await resolveContext(slug);
  const organization = requireOrganization(context);
  const suggestion = identityFromRow(await repository.updateIdentityResolution(organization.id, suggestionId, input));
  await recordScreenprintingAuditEvent({
    organizationId: organization.id,
    action: "identity_resolution_updated",
    entityType: "identity_resolution",
    entityId: suggestion.id,
    payload: { status: suggestion.status, destructiveMerge: false },
  });
  return { suggestion, createdLinks: [] };
}

export async function getScreenprintingWorkspaceSummary(slug: string) {
  const context = await resolveContext(slug);
  const [salesDashboard, orders, opportunities, reorders, socialDashboard, socialAccounts, socialPosts, threads, identity, campaigns] =
    await Promise.all([
      getScreenprintingSalesDashboard(slug),
      listScreenprintingOrders(slug, { pageSize: 25 }),
      listScreenprintingOpportunities(slug),
      listScreenprintingReorders(slug),
      getScreenprintingSocialDashboard(slug),
      listScreenprintingSocialAccounts(slug),
      listScreenprintingSocialPosts(slug),
      listScreenprintingSocialThreads(slug),
      listScreenprintingIdentityResolutions(slug),
      listScreenprintingCampaigns(slug),
    ]);

  return {
    organization: context.organization,
    workspace: context.workspace.workspace,
    config: context.config,
    featureFlags: resolveScreenprintingFeatureFlags(context.config),
    salesDashboard,
    orders,
    opportunities,
    reorders,
    socialDashboard,
    socialAccounts,
    socialPosts,
    threads,
    identity,
    campaigns,
  };
}
