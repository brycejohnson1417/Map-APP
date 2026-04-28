import { createHash } from "node:crypto";
import { z } from "zod";
import fixtureData from "@/fixtures/screenprinting/sample-screenprinting-data.json";
import type { Organization } from "@/lib/domain/runtime";
import type { WorkspaceDefinition } from "@/lib/domain/workspace";

export const screenprintingConfigSections = [
  "statusMappings",
  "paymentMappings",
  "tagMappings",
  "fieldTrust",
  "categories",
  "reorderRules",
  "emailTemplates",
  "socialAccountCategories",
  "alertRules",
  "dashboards",
  "featureFlags",
] as const;

export type ScreenprintingConfigSection = (typeof screenprintingConfigSections)[number];

export const screenprintingFeatureKeys = [
  "sales",
  "social",
  "social_publishing",
  "comments_replies",
  "messages",
  "catalog_costs",
  "profitability",
] as const;

export type ScreenprintingFeatureKey = (typeof screenprintingFeatureKeys)[number];
export type ScreenprintingTrustLevel = "trusted" | "needs_review" | "review" | "dirty" | "ignored";

export interface ScreenprintingValueMapping {
  sourceValue: string;
  targetBucket: string;
  trustLevel: ScreenprintingTrustLevel;
  enabled: boolean;
  priority: number;
}

export interface ScreenprintingTagMapping {
  sourceValue: string;
  category: string;
  trustLevel: ScreenprintingTrustLevel;
  enabled: boolean;
  priority: number;
}

export interface ScreenprintingFieldTrust {
  fieldKey: string;
  trustLevel: ScreenprintingTrustLevel;
  authoritative: boolean;
  warning: string | null;
}

export interface ScreenprintingCategory {
  key: string;
  label: string;
  description: string | null;
}

export interface ScreenprintingReorderRule {
  ruleKey: string;
  category: string;
  cycleDays: number;
  priority: "low" | "medium" | "high";
  enabled: boolean;
}

export interface ScreenprintingEmailTemplate {
  templateKey: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  enabled: boolean;
}

export interface ScreenprintingSocialAccountCategory {
  key: string;
  label: string;
  priority: "low" | "medium" | "high";
}

export interface ScreenprintingAlertRule {
  ruleKey: string;
  name: string;
  module: "sales" | "social";
  eventType: string;
  severity: "low" | "medium" | "high";
  threshold: Record<string, unknown>;
  enabled: boolean;
}

export interface ScreenprintingDashboardDefinition {
  dashboardKey: string;
  name: string;
  module: "sales" | "social" | "accounts" | "territory";
  widgets: string[];
  isDefault: boolean;
}

export interface ScreenprintingConfig {
  statusMappings: ScreenprintingValueMapping[];
  paymentMappings: ScreenprintingValueMapping[];
  tagMappings: ScreenprintingTagMapping[];
  fieldTrust: ScreenprintingFieldTrust[];
  categories: ScreenprintingCategory[];
  reorderRules: ScreenprintingReorderRule[];
  emailTemplates: ScreenprintingEmailTemplate[];
  socialAccountCategories: ScreenprintingSocialAccountCategory[];
  alertRules: ScreenprintingAlertRule[];
  dashboards: ScreenprintingDashboardDefinition[];
  featureFlags: Record<ScreenprintingFeatureKey, boolean>;
}

export interface ScreenprintingConfigSource {
  tenantTypeVersion: number;
  workspaceVersion: number;
  organizationOverridesVersion: number;
  fixtureTenantSlug: string | null;
}

export interface ScreenprintingConfigChangeHistoryEntry {
  id: string;
  section: ScreenprintingConfigSection;
  changedAt: string;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  previewToken: string | null;
}

export interface ScreenprintingConfigDefinition<TValue = unknown> {
  key: ScreenprintingConfigSection;
  label: string;
  scope: "tenant_type" | "tenant";
  defaultValue: TValue;
  validate(value: unknown): TValue;
  preview(input: ScreenprintingImpactPreviewInput): ScreenprintingImpactPreview;
}

export interface ScreenprintingImpactPreviewInput {
  section: ScreenprintingConfigSection;
  draftChanges: unknown;
  currentConfig: ScreenprintingConfig;
  fixtureTenantSlug?: string | null;
  orderStatuses?: string[];
}

export interface ScreenprintingImpactPreview {
  affectedOrders: number;
  affectedAccounts: number;
  affectedDashboards: string[];
  dirtyRecords: number;
  warnings: string[];
  previewToken: string;
}

const trustLevelSchema = z.enum(["trusted", "needs_review", "review", "dirty", "ignored"]);
const enabledSchema = z.boolean().default(true);

const valueMappingSchema = z.object({
  sourceValue: z.string().trim().min(1),
  targetBucket: z.string().trim().min(1),
  trustLevel: trustLevelSchema.default("trusted"),
  enabled: enabledSchema,
  priority: z.number().int().min(0).default(100),
});

const tagMappingSchema = z.object({
  sourceValue: z.string().trim().min(1),
  category: z.string().trim().min(1),
  trustLevel: trustLevelSchema.default("trusted"),
  enabled: enabledSchema,
  priority: z.number().int().min(0).default(100),
});

const fieldTrustSchema = z.object({
  fieldKey: z.string().trim().min(1),
  trustLevel: trustLevelSchema.default("needs_review"),
  authoritative: z.boolean().default(false),
  warning: z.string().trim().min(1).nullable().default(null),
});

const categorySchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable().default(null),
});

const reorderRuleSchema = z.object({
  ruleKey: z.string().trim().min(1),
  category: z.string().trim().min(1),
  cycleDays: z.number().int().min(1).max(3650),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  enabled: enabledSchema,
});

const emailTemplateSchema = z.object({
  templateKey: z.string().trim().min(1),
  name: z.string().trim().min(1),
  subjectTemplate: z.string().trim().min(1),
  bodyTemplate: z.string().trim().min(1),
  enabled: enabledSchema,
});

const socialAccountCategorySchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const alertRuleSchema = z.object({
  ruleKey: z.string().trim().min(1),
  name: z.string().trim().min(1),
  module: z.enum(["sales", "social"]),
  eventType: z.string().trim().min(1),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
  threshold: z.record(z.string(), z.unknown()).default({}),
  enabled: enabledSchema,
});

const dashboardSchema = z.object({
  dashboardKey: z.string().trim().min(1),
  name: z.string().trim().min(1),
  module: z.enum(["sales", "social", "accounts", "territory"]),
  widgets: z.array(z.string().trim().min(1)).default([]),
  isDefault: z.boolean().default(false),
});

const featureFlagsSchema = z.object({
  sales: z.boolean().default(true),
  social: z.boolean().default(true),
  social_publishing: z.boolean().default(false),
  comments_replies: z.boolean().default(false),
  messages: z.boolean().default(false),
  catalog_costs: z.boolean().default(false),
  profitability: z.boolean().default(false),
});

const configSchema = z.object({
  statusMappings: z.array(valueMappingSchema),
  paymentMappings: z.array(valueMappingSchema),
  tagMappings: z.array(tagMappingSchema),
  fieldTrust: z.array(fieldTrustSchema),
  categories: z.array(categorySchema),
  reorderRules: z.array(reorderRuleSchema),
  emailTemplates: z.array(emailTemplateSchema),
  socialAccountCategories: z.array(socialAccountCategorySchema),
  alertRules: z.array(alertRuleSchema),
  dashboards: z.array(dashboardSchema),
  featureFlags: featureFlagsSchema,
});

const sectionSchemas: Record<ScreenprintingConfigSection, z.ZodType> = {
  statusMappings: z.array(valueMappingSchema),
  paymentMappings: z.array(valueMappingSchema),
  tagMappings: z.array(tagMappingSchema),
  fieldTrust: z.array(fieldTrustSchema),
  categories: z.array(categorySchema),
  reorderRules: z.array(reorderRuleSchema),
  emailTemplates: z.array(emailTemplateSchema),
  socialAccountCategories: z.array(socialAccountCategorySchema),
  alertRules: z.array(alertRuleSchema),
  dashboards: z.array(dashboardSchema),
  featureFlags: featureFlagsSchema,
};

export const defaultScreenprintingConfig: ScreenprintingConfig = configSchema.parse({
  statusMappings: [
    { sourceValue: "Quote", targetBucket: "quoted", trustLevel: "trusted", enabled: true, priority: 5 },
    { sourceValue: "Quote Sent", targetBucket: "quoted", trustLevel: "trusted", enabled: true, priority: 10 },
    { sourceValue: "Awaiting Approval", targetBucket: "quoted", trustLevel: "trusted", enabled: true, priority: 20 },
    { sourceValue: "Art - Awaiting Customer Approval", targetBucket: "quoted", trustLevel: "trusted", enabled: true, priority: 25 },
    { sourceValue: "In Production", targetBucket: "in_production", trustLevel: "trusted", enabled: true, priority: 30 },
    { sourceValue: "Order Placed Townsend", targetBucket: "in_production", trustLevel: "trusted", enabled: true, priority: 31 },
    { sourceValue: "Order Placed Night Shift", targetBucket: "in_production", trustLevel: "trusted", enabled: true, priority: 32 },
    { sourceValue: "Order Placed Make Life", targetBucket: "in_production", trustLevel: "trusted", enabled: true, priority: 33 },
    { sourceValue: "Order Placed Black Rock", targetBucket: "in_production", trustLevel: "trusted", enabled: true, priority: 34 },
    { sourceValue: "Order Placed Sage", targetBucket: "in_production", trustLevel: "trusted", enabled: true, priority: 35 },
    { sourceValue: "Art approved", targetBucket: "in_production", trustLevel: "trusted", enabled: true, priority: 36 },
    { sourceValue: "MAJOR RESALE ART", targetBucket: "in_production", trustLevel: "needs_review", enabled: true, priority: 37 },
    { sourceValue: "Insta Post Scheduled", targetBucket: "in_production", trustLevel: "needs_review", enabled: true, priority: 38 },
    { sourceValue: "Job Complete", targetBucket: "completed", trustLevel: "trusted", enabled: true, priority: 40 },
    { sourceValue: "Completed", targetBucket: "completed", trustLevel: "trusted", enabled: true, priority: 41 },
    { sourceValue: "Shipped by Night Shift", targetBucket: "completed", trustLevel: "trusted", enabled: true, priority: 42 },
    { sourceValue: "Job Complete: Bulk Order Picked Up", targetBucket: "completed", trustLevel: "trusted", enabled: true, priority: 43 },
    { sourceValue: "Picked Up", targetBucket: "completed", trustLevel: "trusted", enabled: true, priority: 50 },
    { sourceValue: "Cancelled", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 60 },
    { sourceValue: "Order Canceled", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 61 },
    { sourceValue: "Order Canceled - Not enough interest", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 62 },
    { sourceValue: "Order Canceled - New design", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 63 },
    { sourceValue: "Order Canceled - GHOST", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 64 },
    { sourceValue: "Order Canceled - Other company ", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 65 },
    { sourceValue: "Order Canceled - Event Cancelled", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 66 },
    { sourceValue: "Order Canceled - Design REJECTED", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 67 },
    { sourceValue: "Order Canceled - Art", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 68 },
    { sourceValue: "POSTPONED", targetBucket: "cancelled", trustLevel: "needs_review", enabled: true, priority: 69 },
    { sourceValue: "Lost", targetBucket: "cancelled", trustLevel: "trusted", enabled: true, priority: 70 },
  ],
  paymentMappings: [
    { sourceValue: "Paid", targetBucket: "paid", trustLevel: "trusted", enabled: true, priority: 10 },
    { sourceValue: "PAID", targetBucket: "paid", trustLevel: "trusted", enabled: true, priority: 11 },
    { sourceValue: "Partial Payment", targetBucket: "partial", trustLevel: "trusted", enabled: true, priority: 20 },
    { sourceValue: "PARTIAL_PAYMENT", targetBucket: "partial", trustLevel: "trusted", enabled: true, priority: 21 },
    { sourceValue: "Unpaid", targetBucket: "unpaid", trustLevel: "trusted", enabled: true, priority: 30 },
    { sourceValue: "UNPAID", targetBucket: "unpaid", trustLevel: "trusted", enabled: true, priority: 31 },
    { sourceValue: "Deposit Due", targetBucket: "unpaid", trustLevel: "needs_review", enabled: true, priority: 40 },
  ],
  tagMappings: [
    { sourceValue: "Greek", category: "greek", trustLevel: "trusted", enabled: true, priority: 10 },
    { sourceValue: "Repeat", category: "repeat", trustLevel: "trusted", enabled: true, priority: 20 },
    { sourceValue: "Needs Cleanup", category: "cleanup", trustLevel: "needs_review", enabled: true, priority: 30 },
  ],
  fieldTrust: [
    {
      fieldKey: "production_due_date",
      trustLevel: "trusted",
      authoritative: true,
      warning: null,
    },
    {
      fieldKey: "customer_due_date",
      trustLevel: "needs_review",
      authoritative: false,
      warning: "Customer due dates may be missing or stale until tenant cleanup is complete.",
    },
    {
      fieldKey: "tags",
      trustLevel: "needs_review",
      authoritative: false,
      warning: "Tags are useful for filtering but should not be the only reporting source.",
    },
  ],
  categories: [
    { key: "greek", label: "Greek life", description: "Fraternities, sororities, and campus organizations." },
    { key: "school", label: "School", description: "School, club, and team programs." },
    { key: "corp", label: "Corporate", description: "Businesses, staff apparel, and commercial accounts." },
  ],
  reorderRules: [{ ruleKey: "annual_greek_reorder", category: "greek", cycleDays: 365, priority: "high", enabled: true }],
  emailTemplates: [
    {
      templateKey: "reorder_follow_up",
      name: "Reorder follow-up",
      subjectTemplate: "Reorder timing for {{accountName}}",
      bodyTemplate:
        "Hi {{contactName}},\n\nI wanted to check whether {{accountName}} is planning another apparel run. I can help pull the prior order details and timing when you are ready.\n\nThanks,\n{{senderName}}",
      enabled: true,
    },
    {
      templateKey: "quote_follow_up",
      name: "Quote follow-up",
      subjectTemplate: "Checking on {{accountName}} quote",
      bodyTemplate:
        "Hi {{contactName}},\n\nFollowing up on the quote for {{accountName}}. Let me know if you want any changes before production timing fills up.\n\nThanks,\n{{senderName}}",
      enabled: true,
    },
  ],
  socialAccountCategories: [
    { key: "brand", label: "Brand", priority: "high" },
    { key: "customer", label: "Customer", priority: "medium" },
    { key: "prospect", label: "Prospect", priority: "medium" },
    { key: "partner", label: "Partner", priority: "low" },
  ],
  alertRules: [
    {
      ruleKey: "engagement_spike",
      name: "Engagement spike",
      module: "social",
      eventType: "engagement_spike",
      severity: "medium",
      threshold: { engagementRateMin: 0.03 },
      enabled: true,
    },
    {
      ruleKey: "due_reorder",
      name: "Due reorder",
      module: "sales",
      eventType: "due_reorder",
      severity: "high",
      threshold: { dueWithinDays: 14 },
      enabled: true,
    },
  ],
  dashboards: [
    {
      dashboardKey: "sales_overview",
      name: "Sales overview",
      module: "sales",
      widgets: ["revenue", "average_order_value", "due_reorders", "dirty_data_warnings"],
      isDefault: true,
    },
    {
      dashboardKey: "social_overview",
      name: "Social overview",
      module: "social",
      widgets: ["tracked_accounts", "new_posts", "unread_alerts", "engagement"],
      isDefault: true,
    },
  ],
  featureFlags: {
    sales: true,
    social: true,
    social_publishing: false,
    comments_replies: false,
    messages: false,
    catalog_costs: false,
    profitability: false,
  },
});

type FixtureTenant = {
  slug: string;
  config?: {
    printavo_status_mapping?: Record<string, string[]>;
    payment_mapping?: Record<string, string[]>;
    field_trust?: Record<string, ScreenprintingTrustLevel>;
    reorder_rules?: FixtureReorderRule[];
    features?: Partial<Record<ScreenprintingFeatureKey, boolean>>;
  };
};

type FixtureReorderRule = { category?: string; cycle_days?: number; priority?: "low" | "medium" | "high" };

type FixtureBundle = {
  tenants?: FixtureTenant[];
  printavo_like_orders?: Array<{ tenant_slug?: string; status?: string; organization_name?: string }>;
};

const fixture = fixtureData as FixtureBundle;

function cloneConfig(config: ScreenprintingConfig): ScreenprintingConfig {
  return structuredClone(config);
}

function normalizeBucket(bucket: string) {
  if (bucket === "production_completed") {
    return "completed";
  }

  return bucket;
}

function fixtureMappings(record: Record<string, string[]> | undefined, targetField: "status" | "payment") {
  const rows: ScreenprintingValueMapping[] = [];
  for (const [bucket, values] of Object.entries(record ?? {})) {
    values.forEach((sourceValue, index) => {
      rows.push({
        sourceValue,
        targetBucket: normalizeBucket(bucket),
        trustLevel: bucket === "dirty" ? "dirty" : "trusted",
        enabled: true,
        priority: index + rows.length + (targetField === "status" ? 1 : 100),
      });
    });
  }
  return rows;
}

function fixtureFieldTrust(record: Record<string, ScreenprintingTrustLevel> | undefined) {
  return Object.entries(record ?? {}).map(([fieldKey, trustLevel]) => ({
    fieldKey,
    trustLevel,
    authoritative: trustLevel === "trusted",
    warning: trustLevel === "trusted" ? null : `${fieldKey.replaceAll("_", " ")} needs review before authoritative reporting.`,
  }));
}

function fixtureReorderRules(rows: FixtureReorderRule[] | undefined) {
  return (rows ?? []).map((row) => ({
    ruleKey: `${row.category ?? "default"}_${row.cycle_days ?? 365}_day_reorder`,
    category: row.category ?? "default",
    cycleDays: row.cycle_days ?? 365,
    priority: row.priority ?? "medium",
    enabled: true,
  }));
}

function mergeArrayByKey<T, K extends keyof T>(base: T[], override: T[], key: K) {
  const byKey = new Map(base.map((entry) => [String(entry[key]), entry]));
  for (const entry of override) {
    byKey.set(String(entry[key]), entry);
  }
  return [...byKey.values()];
}

function deepMergeObject(base: Record<string, unknown>, override: Record<string, unknown>) {
  const output = structuredClone(base);
  for (const [key, value] of Object.entries(override)) {
    const current = output[key];
    if (
      current &&
      value &&
      typeof current === "object" &&
      typeof value === "object" &&
      !Array.isArray(current) &&
      !Array.isArray(value)
    ) {
      output[key] = deepMergeObject(current as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function normalizeLegacyConfig(raw: unknown): Partial<ScreenprintingConfig> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const record = raw as Record<string, unknown>;
  const normalized: Partial<ScreenprintingConfig> = {};

  if (record.printavo_status_mapping && typeof record.printavo_status_mapping === "object" && !Array.isArray(record.printavo_status_mapping)) {
    normalized.statusMappings = fixtureMappings(record.printavo_status_mapping as Record<string, string[]>, "status");
  }
  if (record.payment_mapping && typeof record.payment_mapping === "object" && !Array.isArray(record.payment_mapping)) {
    normalized.paymentMappings = fixtureMappings(record.payment_mapping as Record<string, string[]>, "payment");
  }
  if (record.field_trust && typeof record.field_trust === "object" && !Array.isArray(record.field_trust)) {
    normalized.fieldTrust = fixtureFieldTrust(record.field_trust as Record<string, ScreenprintingTrustLevel>);
  }
  if (Array.isArray(record.reorder_rules)) {
    normalized.reorderRules = fixtureReorderRules(record.reorder_rules as FixtureReorderRule[]);
  }
  if (record.features && typeof record.features === "object" && !Array.isArray(record.features)) {
    normalized.featureFlags = {
      ...defaultScreenprintingConfig.featureFlags,
      ...(record.features as Partial<Record<ScreenprintingFeatureKey, boolean>>),
    };
  }

  return normalized;
}

function mergeConfig(base: ScreenprintingConfig, override: Partial<ScreenprintingConfig>): ScreenprintingConfig {
  return configSchema.parse({
    ...base,
    ...override,
    statusMappings: override.statusMappings
      ? mergeArrayByKey(base.statusMappings, override.statusMappings, "sourceValue")
      : base.statusMappings,
    paymentMappings: override.paymentMappings
      ? mergeArrayByKey(base.paymentMappings, override.paymentMappings, "sourceValue")
      : base.paymentMappings,
    tagMappings: override.tagMappings ? mergeArrayByKey(base.tagMappings, override.tagMappings, "sourceValue") : base.tagMappings,
    fieldTrust: override.fieldTrust ? mergeArrayByKey(base.fieldTrust, override.fieldTrust, "fieldKey") : base.fieldTrust,
    categories: override.categories ? mergeArrayByKey(base.categories, override.categories, "key") : base.categories,
    reorderRules: override.reorderRules ? mergeArrayByKey(base.reorderRules, override.reorderRules, "ruleKey") : base.reorderRules,
    emailTemplates: override.emailTemplates
      ? mergeArrayByKey(base.emailTemplates, override.emailTemplates, "templateKey")
      : base.emailTemplates,
    socialAccountCategories: override.socialAccountCategories
      ? mergeArrayByKey(base.socialAccountCategories, override.socialAccountCategories, "key")
      : base.socialAccountCategories,
    alertRules: override.alertRules ? mergeArrayByKey(base.alertRules, override.alertRules, "ruleKey") : base.alertRules,
    dashboards: override.dashboards ? mergeArrayByKey(base.dashboards, override.dashboards, "dashboardKey") : base.dashboards,
    featureFlags: {
      ...base.featureFlags,
      ...override.featureFlags,
    },
  });
}

function readWorkspaceScreenprintingConfig(workspace: WorkspaceDefinition | null | undefined) {
  return normalizeConfigPartial(workspace?.screenprinting);
}

function readOrganizationScreenprintingConfig(organization: Pick<Organization, "settings"> | null | undefined) {
  const raw =
    organization?.settings?.screenprinting &&
    typeof organization.settings.screenprinting === "object" &&
    !Array.isArray(organization.settings.screenprinting)
      ? (organization.settings.screenprinting as Record<string, unknown>).config
      : null;
  return normalizeConfigPartial(raw);
}

function normalizeConfigPartial(raw: unknown): Partial<ScreenprintingConfig> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const legacy = normalizeLegacyConfig(raw);
  const merged = deepMergeObject(legacy as Record<string, unknown>, raw as Record<string, unknown>);
  const result = configSchema.partial().safeParse(merged);
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  }

  return result.data as Partial<ScreenprintingConfig>;
}

export function getFixtureTenantConfig(slug: string | null | undefined) {
  const tenant = fixture.tenants?.find((candidate) => candidate.slug === slug);
  return tenant?.config ? normalizeLegacyConfig(tenant.config) : {};
}

export function resolveScreenprintingConfig(input: {
  slug?: string | null;
  workspace?: WorkspaceDefinition | null;
  organization?: Pick<Organization, "settings"> | null;
}): { config: ScreenprintingConfig; source: ScreenprintingConfigSource } {
  let config = cloneConfig(defaultScreenprintingConfig);
  const fixtureConfig = getFixtureTenantConfig(input.slug);
  config = mergeConfig(config, fixtureConfig);
  config = mergeConfig(config, readWorkspaceScreenprintingConfig(input.workspace));
  config = mergeConfig(config, readOrganizationScreenprintingConfig(input.organization));

  return {
    config,
    source: {
      tenantTypeVersion: input.workspace?.tenantType?.id === "screenprinting" ? 1 : 0,
      workspaceVersion: input.workspace?.version ?? 0,
      organizationOverridesVersion:
        input.organization?.settings?.screenprinting &&
        typeof input.organization.settings.screenprinting === "object" &&
        !Array.isArray(input.organization.settings.screenprinting)
          ? Number((input.organization.settings.screenprinting as Record<string, unknown>).version ?? 1)
          : 0,
      fixtureTenantSlug: fixtureConfig && Object.keys(fixtureConfig).length ? input.slug ?? null : null,
    },
  };
}

export function validateScreenprintingConfigSection(section: ScreenprintingConfigSection, value: unknown) {
  const schema = sectionSchemas[section];
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  }

  return parsed.data;
}

export function applyScreenprintingConfigPatch(input: {
  currentConfig: ScreenprintingConfig;
  section: ScreenprintingConfigSection;
  changes: unknown;
}): ScreenprintingConfig {
  const sectionValue = validateScreenprintingConfigSection(input.section, input.changes);
  const nextConfig = cloneConfig(input.currentConfig);
  (nextConfig as unknown as Record<ScreenprintingConfigSection, unknown>)[input.section] = sectionValue;
  return configSchema.parse(nextConfig);
}

export function screenprintingConfigToSettingsPatch(config: ScreenprintingConfig, history: ScreenprintingConfigChangeHistoryEntry[]) {
  return {
    config,
    history,
    version: history.length,
    updatedAt: new Date().toISOString(),
  };
}

export function buildScreenprintingConfigHistoryEntry(input: {
  section: ScreenprintingConfigSection;
  actorEmail?: string | null;
  before: unknown;
  after: unknown;
  previewToken?: string | null;
}): ScreenprintingConfigChangeHistoryEntry {
  const changedAt = new Date().toISOString();
  return {
    id: createHash("sha256")
      .update(JSON.stringify([input.section, input.actorEmail ?? null, changedAt, input.before, input.after]))
      .digest("hex")
      .slice(0, 24),
    section: input.section,
    changedAt,
    actorEmail: input.actorEmail ?? null,
    before: input.before,
    after: input.after,
    previewToken: input.previewToken ?? null,
  };
}

export function readScreenprintingConfigHistory(organization: Pick<Organization, "settings"> | null | undefined) {
  const raw =
    organization?.settings?.screenprinting &&
    typeof organization.settings.screenprinting === "object" &&
    !Array.isArray(organization.settings.screenprinting)
      ? (organization.settings.screenprinting as Record<string, unknown>).history
      : null;
  return Array.isArray(raw) ? (raw as ScreenprintingConfigChangeHistoryEntry[]) : [];
}

export function createScreenprintingImpactPreview(input: ScreenprintingImpactPreviewInput): ScreenprintingImpactPreview {
  const statuses = input.orderStatuses?.length
    ? input.orderStatuses
    : (fixture.printavo_like_orders ?? [])
        .filter((order) => !input.fixtureTenantSlug || order.tenant_slug === input.fixtureTenantSlug)
        .map((order) => order.status)
        .filter((status): status is string => Boolean(status));
  const serializedDraft = JSON.stringify(input.draftChanges ?? null);
  const affectedOrders =
    input.section === "featureFlags"
      ? 0
      : statuses.filter((status) => serializedDraft.toLowerCase().includes(status.toLowerCase())).length;
  const dirtyValues = input.currentConfig.statusMappings.filter((mapping) => mapping.trustLevel === "dirty").map((mapping) => mapping.sourceValue);
  const dirtyRecords = statuses.filter((status) => dirtyValues.includes(status)).length;
  const affectedDashboards =
    input.section === "statusMappings" || input.section === "paymentMappings" || input.section === "fieldTrust"
      ? input.currentConfig.dashboards.filter((dashboard) => dashboard.isDefault).map((dashboard) => dashboard.dashboardKey)
      : [];
  const tokenSource = JSON.stringify([input.section, input.draftChanges, statuses, affectedDashboards]);

  return {
    affectedOrders,
    affectedAccounts: Math.min(affectedOrders, new Set(fixture.printavo_like_orders?.map((order) => order.organization_name)).size),
    affectedDashboards,
    dirtyRecords,
    warnings:
      input.section === "featureFlags" && JSON.stringify(input.draftChanges).includes("social_publishing")
        ? ["Publishing remains disabled unless a tenant explicitly enables it later."]
        : [],
    previewToken: createHash("sha256").update(tokenSource).digest("hex").slice(0, 20),
  };
}

export const screenprintingConfigDefinitions: ScreenprintingConfigDefinition[] = screenprintingConfigSections.map((section) => ({
  key: section,
  label: section.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase()),
  scope: "tenant",
  defaultValue: defaultScreenprintingConfig[section],
  validate: (value: unknown) => validateScreenprintingConfigSection(section, value),
  preview: (input) => createScreenprintingImpactPreview({ ...input, section }),
}));

export function mapStatusBucket(config: ScreenprintingConfig, status: string | null | undefined) {
  if (!status) {
    return "needs_review";
  }

  const normalized = status.trim().toLowerCase();
  const mapping = config.statusMappings
    .filter((candidate) => candidate.enabled)
    .sort((left, right) => left.priority - right.priority)
    .find((candidate) => candidate.sourceValue.toLowerCase() === normalized);

  if (mapping?.targetBucket) {
    return mapping.targetBucket;
  }

  if (/\b(completed?|picked up|shipped)\b/i.test(status)) {
    return "completed";
  }
  if (/\b(cancelled|canceled|lost|rejected|ghost|not enough interest|postponed)\b/i.test(status)) {
    return "cancelled";
  }
  if (/\b(quote|awaiting customer approval|estimate)\b/i.test(status)) {
    return "quoted";
  }
  if (/\b(in production|order placed|art approved|resale art|scheduled|link)\b/i.test(status)) {
    return "in_production";
  }

  return "needs_review";
}

export function mapPaymentBucket(config: ScreenprintingConfig, paymentStatus: string | null | undefined) {
  if (!paymentStatus) {
    return "needs_review";
  }

  const normalized = paymentStatus.trim().toLowerCase();
  const mapping = config.paymentMappings
    .filter((candidate) => candidate.enabled)
    .sort((left, right) => left.priority - right.priority)
    .find((candidate) => candidate.sourceValue.toLowerCase() === normalized);

  if (mapping?.targetBucket) {
    return mapping.targetBucket;
  }

  if (normalized === "partial_payment" || normalized.includes("partial")) {
    return "partial";
  }
  if (normalized.includes("paid") && !normalized.includes("unpaid")) {
    return "paid";
  }
  if (normalized.includes("unpaid") || normalized.includes("deposit")) {
    return "unpaid";
  }

  return "needs_review";
}
