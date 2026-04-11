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
