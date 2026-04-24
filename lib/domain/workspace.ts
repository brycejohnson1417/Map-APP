import type { ExternalProvider, FraterniteesLeadGrade } from "@/lib/domain/runtime";

export type WorkspaceTerritoryColorMode = "rep" | "status" | "orders" | "score";

export type WorkspacePrimitiveId =
  | "workspace_shell"
  | "runtime_surface"
  | "connector_adapter"
  | "score_model"
  | "scorecard"
  | "dnc_rule"
  | "account_directory"
  | "sort_filter_set"
  | "trend_module"
  | "territory_pin_layer"
  | "filter_registry"
  | "geocoding_policy"
  | "change_request";

export interface PackageManifest {
  id: string;
  version: number;
  name: string;
  description: string;
  primitives: WorkspacePrimitiveId[];
  surfaces: string[];
  status: "active" | "planned";
}

export interface WorkspaceConnectorFieldDefinition {
  key: string;
  label: string;
  type: "text" | "email" | "secret" | "textarea" | "url";
  required: boolean;
  placeholder?: string;
}

export interface WorkspaceConnectorDefinition {
  provider: ExternalProvider;
  label: string;
  description: string;
  required: boolean;
  selfServe: boolean;
  supportsPreview: boolean;
  supportsFirstSync: boolean;
  fields: WorkspaceConnectorFieldDefinition[];
}

export interface WorkspaceNavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export interface FraterniteesScoreModelConfig {
  weights: {
    closeRate: number;
    orderCount: number;
    consistency: number;
    revenue: number;
    recentRevenue: number;
    recency: number;
  };
  caps: {
    revenueTarget: number;
    recentRevenueTarget: number;
    orderCountTarget: number;
    consistencyMonthsTarget: number;
  };
  penalties: {
    lostOrder: number;
    maxLostOrderPenalty: number;
    hardLoss: number;
    maxHardLossPenalty: number;
    volatility: number;
  };
  gradeThresholds: {
    aPlus: number;
    a: number;
    b: number;
    c: number;
    d: number;
  };
  gradeGuards: {
    aPlus: {
      minCloseRate: number;
      minClosedOrders: number;
      maxLostOrders: number;
    };
    a: {
      minCloseRate: number;
      minClosedOrders: number;
    };
  };
  dncRule: {
    lostOrdersThreshold: number;
    cooldownYears: number;
  };
  highTicket: {
    threshold: number;
    minCloseRate: number;
    lossesAfterHighTicket: number;
  };
  recency: {
    hotDays: number;
    warmDays: number;
    coolDays: number;
    points: {
      hot: number;
      warm: number;
      cool: number;
    };
  };
  trend: {
    currentMonths: number;
    comparisonMonths: number;
  };
}

export interface WorkspaceDefinition {
  id: string;
  version: number;
  kind: string;
  displayName: string;
  templateLabel: string;
  description: string;
  selfServe: boolean;
  emailDomains: string[];
  defaultOrgSlug: string;
  defaultRedirectPath: string;
  branding: {
    heroEyebrow: string;
    heroTitle: string;
    heroDescription: string;
  };
  navigation: WorkspaceNavigationItem[];
  packages: string[];
  connectors: WorkspaceConnectorDefinition[];
  modules: {
    accounts?: {
      variant: string;
      title?: string;
      pageSize: number;
      cacheTtlSeconds?: number;
      gradeOptions?: Array<FraterniteesLeadGrade | "All Grades" | "Unscored">;
      sortOptions?: Array<{ value: string; label: string }>;
      summaryCards?: string[];
    };
    accountDetail?: {
      variant: string;
      sections: string[];
      trendWindowMonths?: number;
      comparisonWindowMonths?: number;
      heroDescription?: string;
      recentOrdersHeading?: string;
      updatedLabel?: string;
    };
    territory?: {
      variant: string;
      includeUnmappedAccounts: boolean;
      filtersAlwaysAvailable: boolean;
      enabledFlags: string[];
      leadGradeFilter: boolean;
      defaultColorMode?: WorkspaceTerritoryColorMode;
      colorModes?: WorkspaceTerritoryColorMode[];
    };
    integrations?: {
      variant: string;
      allowRoutePlanning: boolean;
    };
  };
  geocoding?: {
    placeholderAddressPatterns?: string[];
    suppressedAddresses?: Array<{
      addressLine1: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      reason: string;
    }>;
    missingAddressReason?: string;
  };
  scoring?: {
    fraterniteesLeadV1?: FraterniteesScoreModelConfig;
  };
  changeRequests: {
    enabled: boolean;
    defaultClassification: "config" | "package" | "primitive" | "core";
    classifications: Array<"config" | "package" | "primitive" | "core">;
    allowAttachments: boolean;
  };
  onboarding: {
    enabled: boolean;
    summary: string;
    firstSyncProvider?: ExternalProvider;
  };
}

export interface WorkspaceTemplateSummary {
  id: string;
  displayName: string;
  templateLabel: string;
  description: string;
  selfServe: boolean;
  defaultOrgSlug: string;
  emailDomains: string[];
  branding: WorkspaceDefinition["branding"];
  connectors: WorkspaceConnectorDefinition[];
}
