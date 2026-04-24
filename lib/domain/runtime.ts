export type MembershipRole = "owner" | "admin" | "manager" | "member" | "guest";

export type ExternalProvider =
  | "notion"
  | "nabis"
  | "printavo"
  | "google_sheets"
  | "google_calendar"
  | "google_maps"
  | "hubspot"
  | "salesforce"
  | "airtable"
  | "csv_import";

export type SyncStatus = "idle" | "queued" | "running" | "success" | "error";

export type AuditEventType =
  | "sync_started"
  | "sync_succeeded"
  | "sync_failed"
  | "account_created"
  | "account_updated"
  | "boundary_created"
  | "boundary_updated"
  | "marker_created"
  | "marker_updated"
  | "integration_connected"
  | "integration_updated"
  | "integration_disconnected";

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

export interface SyncCursor {
  id: string;
  organizationId: string;
  installationId: string | null;
  provider: ExternalProvider;
  scope: string;
  cursorPayload: Record<string, unknown>;
  status: SyncStatus;
  lastSuccessfulSyncAt: string | null;
  lastAttemptedSyncAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorMemberId: string | null;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface SyncJobStatusCount {
  status: SyncStatus;
  count: number;
}

export interface OrganizationRuntimeSnapshot {
  organization: Organization;
  integrations: IntegrationInstallation[];
  recentSyncJobs: SyncJob[];
  syncCursors: SyncCursor[];
  syncJobStatusCounts: SyncJobStatusCount[];
  recentAuditEvents: AuditEvent[];
}

export interface QueueSyncJobInput {
  organizationId: string;
  installationId?: string | null;
  kind: SyncJobKind;
  dedupeKey?: string | null;
  payload?: Record<string, unknown>;
}

export interface RecordAuditEventInput {
  organizationId: string;
  actorMemberId?: string | null;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}

export type TerritoryFilterFlag =
  | "missing_referral_source"
  | "missing_sample_delivery"
  | "no_address_available"
  | "dnc_flagged";

export type FraterniteesLeadGrade = "A+" | "A" | "B" | "C" | "D" | "F" | "Unscored";

export interface FraterniteesLeadScoreSummary {
  score: number | null;
  grade: FraterniteesLeadGrade;
  priority: string | null;
  closeRate: number | null;
  closedOrders: number;
  lostOrders: number;
  openOrders: number;
  totalOrders: number;
  totalOpportunities: number;
  closedRevenue: number | null;
  medianClosedOrderValue: number | null;
  averageClosedOrderValue: number | null;
  maxOrderValue: number | null;
  monthsWithClosedOrdersLast12: number;
  averageMonthlyClosedRevenueLast12: number | null;
  ghostOrHardLosses: number;
  highTicketVolatility: boolean;
  dncRecommendedUntil: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
}

export interface TerritoryAccountPin {
  id: string;
  name: string;
  status: string | null;
  leadStatus: string | null;
  referralSource: string | null;
  vendorDayStatus?: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  salesRepNames: string[];
  lastContactedAt: string | null;
  lastOrderDate: string | null;
  lastSampleDeliveryDate: string | null;
  daysOverdue: number | null;
  fraterniteesLeadScore: FraterniteesLeadScoreSummary | null;
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
    noAddressAvailable: number;
    dncFlagged: number;
  };
  repFacets: Array<{ name: string; count: number }>;
  statusFacets: Array<{ name: string; count: number }>;
  referralSourceFacets: Array<{ name: string; count: number }>;
  vendorDayFacets: Array<{ name: string; count: number }>;
  leadGradeFacets: Array<{ name: string; count: number }>;
  pins: TerritoryAccountPin[];
  appliedFilters: {
    search: string | null;
    flag: TerritoryFilterFlag | null;
    rep: string | null;
    status: string | null;
    referralSource: string | null;
    vendorDayStatus: string | null;
    leadGrade: FraterniteesLeadGrade | null;
  };
}

export interface TerritoryBoundaryRuntime {
  id: string;
  name: string;
  description: string | null;
  color: string;
  borderWidth: number;
  isVisibleByDefault: boolean;
  coordinates: Array<[number, number]>;
  createdAt: string;
  updatedAt: string;
}

export interface TerritoryMarkerRuntime {
  id: string;
  name: string;
  description: string | null;
  markerType: string;
  address: string | null;
  latitude: number;
  longitude: number;
  color: string;
  icon: string;
  isVisibleByDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TerritoryOverlayRuntime {
  organization: Organization;
  boundaries: TerritoryBoundaryRuntime[];
  markers: TerritoryMarkerRuntime[];
}

export interface FraterniteesAccountDirectoryItem {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  leadPriority: string | null;
  leadScore: number | null;
  leadGrade: FraterniteesLeadGrade;
  closeRate: number | null;
  closedOrders: number;
  lostOrders: number;
  openOrders: number;
  totalOrders: number;
  totalOpportunities: number;
  closedRevenue: number | null;
  averageClosedOrderValue: number | null;
  medianClosedOrderValue: number | null;
  dncFlagged: boolean;
  lastOrderDate: string | null;
}

export interface FraterniteesAccountDirectorySummary {
  accounts: number;
  scoredAccounts: number;
  avgScoreNonDnc: number | null;
  dncFlaggedAccounts: number;
  orders: number;
}

export interface FraterniteesAccountDirectoryPage {
  organization: Organization;
  summary: FraterniteesAccountDirectorySummary;
  items: FraterniteesAccountDirectoryItem[];
  filters: {
    query: string;
    grade: FraterniteesLeadGrade | "All Grades";
    dncOnly: boolean;
    sort: "score" | "close_rate" | "order_count";
    page: number;
    pageSize: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startItem: number;
    endItem: number;
  };
}

export interface AccountIdentity {
  id: string;
  provider: ExternalProvider;
  externalEntityType: string;
  externalId: string;
  matchMethod: string;
  matchConfidence: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountContact {
  id: string;
  fullName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountActivity {
  id: string;
  contactId: string | null;
  activityType: string;
  summary: string;
  occurredAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AccountOrder {
  id: string;
  externalOrderId: string;
  orderNumber: string | null;
  status: string | null;
  paymentStatus: string | null;
  orderTotal: number | null;
  orderCreatedAt: string | null;
  deliveryDate: string | null;
  salesRepName: string | null;
  isInternalTransfer: boolean;
}

export interface AccountRuntimeDetail {
  organization: Organization;
  account: TerritoryAccountPin & {
    legalName: string | null;
    vendorDayStatus: string | null;
    licensedLocationId: string | null;
    licenseNumber: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    country: string | null;
    accountManagerNames: string[];
    lastSampleOrderDate: string | null;
    customerSinceDate: string | null;
    crmUpdatedAt: string | null;
    externalUpdatedAt: string | null;
    customFields: Record<string, unknown>;
  };
  identities: AccountIdentity[];
  contacts: AccountContact[];
  activities: AccountActivity[];
  recentOrders: AccountOrder[];
  allOrders: AccountOrder[];
  orderSummary: {
    totalOrders: number;
    totalRevenue: number;
    nonTransferOrders: number;
    lastOrderDate: string | null;
    customerSinceDate: string | null;
  };
}
