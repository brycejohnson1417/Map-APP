export type MembershipRole = "owner" | "admin" | "manager" | "member" | "guest";

export type ExternalProvider =
  | "notion"
  | "nabis"
  | "google_calendar"
  | "google_maps"
  | "hubspot"
  | "salesforce"
  | "airtable"
  | "csv_import";

export type SyncStatus = "idle" | "queued" | "running" | "success" | "error";

export type SyncJobKind =
  | "notion_pages"
  | "notion_comments"
  | "orders_accounts"
  | "orders_events"
  | "calendar_pull"
  | "calendar_push"
  | "read_model_refresh"
  | "reconciliation";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  clerkUserId: string;
  email: string;
  fullName: string | null;
  role: MembershipRole;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationInstallation {
  id: string;
  organizationId: string;
  provider: ExternalProvider;
  externalAccountId: string | null;
  displayName: string;
  config: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJob {
  id: string;
  organizationId: string;
  installationId: string | null;
  kind: SyncJobKind;
  status: SyncStatus;
  dedupeKey: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  lastError: string | null;
  availableAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRuntimeSnapshot {
  organization: Organization;
  integrations: IntegrationInstallation[];
  recentSyncJobs: SyncJob[];
}

export interface QueueSyncJobInput {
  organizationId: string;
  installationId?: string | null;
  kind: SyncJobKind;
  dedupeKey?: string | null;
  payload?: Record<string, unknown>;
}

export type TerritoryFilterFlag = "missing_referral_source" | "missing_sample_delivery";

export interface TerritoryAccountPin {
  id: string;
  name: string;
  status: string | null;
  leadStatus: string | null;
  referralSource: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  salesRepNames: string[];
  lastContactedAt: string | null;
  lastOrderDate: string | null;
  lastSampleDeliveryDate: string | null;
  daysOverdue: number | null;
}

export interface TerritoryRuntimeDashboard {
  organization: Organization;
  counts: {
    accounts: number;
    geocodedPins: number;
    orders: number;
    contacts: number;
    territoryBoundaries: number;
    territoryMarkers: number;
    noReferralSource: number;
    noLastSampleDeliveryDate: number;
  };
  repFacets: Array<{ name: string; count: number }>;
  pins: TerritoryAccountPin[];
  appliedFilters: {
    search: string | null;
    flag: TerritoryFilterFlag | null;
    rep: string | null;
  };
}
