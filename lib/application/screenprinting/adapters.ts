import type { ExternalProvider, SyncStatus } from "@/lib/domain/runtime";

export interface OrderingAdapterCursorState {
  provider: ExternalProvider;
  scope: string;
  status: SyncStatus;
  nextCursor: string | null;
  hasMore: boolean;
  rateLimited: boolean;
  retryAfterSeconds: number | null;
  metadata: Record<string, unknown>;
}

export interface OrderingPlatformStatus {
  id: string;
  name: string;
  type: string;
  color: string | null;
  position: number | null;
}

export interface OrderingPlatformOrder {
  customerName: string;
  status: string | null;
  total: number | null;
  orderDate: string | null;
  externalOrderId?: string | null;
  externalCustomerId?: string | null;
  orderNumber?: string | null;
  eventName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  quantity?: number | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  paidInFull?: boolean | null;
  amountPaid?: number | null;
  amountOutstanding?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  source?: ExternalProvider;
}

export interface OrderingPlatformCustomer {
  externalCustomerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  sourcePayload: Record<string, unknown>;
}

export interface OrderingPlatformContact {
  externalContactId: string | null;
  externalCustomerId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  sourcePayload: Record<string, unknown>;
}

export interface OrderingFetchOrdersInput {
  pageLimit?: number;
  pageSize?: number;
  after?: string | null;
  pageDelayMs?: number;
  inProductionAfter?: string | null;
  inProductionBefore?: string | null;
}

export interface OrderingFetchOrdersResult<TOrder extends OrderingPlatformOrder = OrderingPlatformOrder> {
  orders: TOrder[];
  nextCursor: string | null;
  hasNextPage: boolean;
  pagesFetched: number;
  rateLimited: boolean;
  retryAfterSeconds: number | null;
}

export interface OrderingPlatformAdapter<TOrder extends OrderingPlatformOrder = OrderingPlatformOrder> {
  provider: ExternalProvider;
  mode: "read_only";
  listStatuses(): Promise<OrderingPlatformStatus[]>;
  fetchOrders(input?: OrderingFetchOrdersInput): Promise<OrderingFetchOrdersResult<TOrder>>;
  fetchCustomers(input?: { query?: string | null; limit?: number }): Promise<OrderingPlatformCustomer[]>;
  fetchContacts(input?: { query?: string | null; limit?: number }): Promise<OrderingPlatformContact[]>;
  sourceOrderUrl(externalOrderId: string): string | null;
  sourceCustomerUrl(externalCustomerId: string): string | null;
  readCursorState(input: { scope: string; cursorPayload?: Record<string, unknown> | null }): OrderingAdapterCursorState;
}

export interface SocialPermissionState {
  provider?: string;
  authMode?: "manual" | "instagram_business_login" | "facebook_login_business";
  connectionMode?: "manual_import" | "instagram_business_login" | "facebook_login_business";
  requiredScopes?: string[];
  optionalScopes?: string[];
  grantedScopes?: string[];
  graphApiBaseUrl?: string;
  instagramGraphApiBaseUrl?: string;
  authorizationUrl?: string | null;
  ownedAccountDiscovery?: "available" | "needs_token" | "needs_scope" | "manual_only";
  watchlistDiscovery?: "manual_import" | "limited_by_meta_permissions";
  webhookTopics?: string[];
  canReadAccounts: boolean;
  canReadPosts: boolean;
  canReadComments: boolean;
  canReadMessages: boolean;
  canPublish: boolean;
  canReplyToComments?: boolean;
  canReplyToMessages?: boolean;
  missingPermissions: string[];
  manualFallbackAvailable: boolean;
}

export interface SocialProviderScope {
  scope: string;
  label: string;
  requiredFor: string;
  required: boolean;
}

export interface SocialProviderEndpoint {
  label: string;
  method: "GET" | "POST" | "DELETE";
  host: "graph.instagram.com" | "graph.facebook.com";
  path: string;
  purpose: string;
}

export interface SocialConnectionModeState {
  key: "instagram_business_login" | "facebook_login_business";
  label: string;
  recommended: boolean;
  hostUrl: "graph.instagram.com" | "graph.facebook.com";
  loginType: "Business Login for Instagram" | "Facebook Login for Business";
  tokenType: "Instagram user access token" | "Facebook user/Page access token";
  pageLinkRequired: boolean;
  requiredScopes: SocialProviderScope[];
  optionalScopes: SocialProviderScope[];
  endpoints: SocialProviderEndpoint[];
  setupNotes: string[];
}

export interface SocialProviderReadiness {
  provider: "meta";
  platform: "instagram";
  graphApiVersion: string;
  configured: boolean;
  installationId: string | null;
  installationStatus: string | null;
  displayName: string;
  externalAccountId: string | null;
  preferredMode: SocialConnectionModeState["key"];
  permissionState: SocialPermissionState;
  modes: SocialConnectionModeState[];
  webhookTopics: string[];
  requiredSetup: string[];
  limitations: string[];
  accountCounts: {
    owned: number;
    watched: number;
    ignored: number;
  };
  capabilities: {
    ownedAccountDiscovery: boolean;
    watchedAccountManualImport: boolean;
    watchedAccountApiEnrichment: boolean;
    readPosts: boolean;
    readInsights: boolean;
    readComments: boolean;
    replyToComments: boolean;
    readMessages: boolean;
    replyToMessages: boolean;
    publishPosts: boolean;
  };
  providerWriteBackAvailable: boolean;
  publishingAvailable: boolean;
  manualFallbackAvailable: true;
}

export interface SocialPlatformAccount {
  id: string;
  platform: string;
  handle: string;
  displayName: string | null;
  ownership: "owned" | "watched" | "ignored";
  source: "api" | "manual" | "csv_import";
  category: string | null;
  priority: string | null;
  status: "active" | "paused" | "needs_auth" | "archived";
  followerCount: number | null;
  metadata: Record<string, unknown>;
}

export interface SocialPlatformPost {
  id: string;
  socialAccountId: string;
  externalPostId: string | null;
  postType: "post" | "reel" | "story" | "video" | "manual";
  caption: string | null;
  permalink: string | null;
  status: "published" | "scheduled" | "planned" | "draft" | "imported" | "deleted";
  publishedAt: string | null;
  metrics: Record<string, number>;
  metadata: Record<string, unknown>;
}

export interface SocialPlatformThread {
  id: string;
  platform: string;
  threadType: "comment" | "dm" | "manual";
  participantHandle: string | null;
  status: "open" | "replied" | "needs_review" | "closed" | "ignored";
  lastMessageAt: string | null;
  metadata: Record<string, unknown>;
}

export interface SocialPlatformAdapter {
  provider: string;
  mode: "manual" | "api";
  readPermissionState(): SocialPermissionState;
  listOwnedAccounts(): Promise<SocialPlatformAccount[]>;
  listWatchedAccounts(): Promise<SocialPlatformAccount[]>;
  importManualAccount(input: {
    platform: string;
    handle: string;
    ownership: "owned" | "watched" | "ignored";
    category?: string | null;
    priority?: string | null;
  }): Promise<SocialPlatformAccount>;
  fetchPosts(input?: { socialAccountId?: string | null }): Promise<SocialPlatformPost[]>;
  fetchThreads(input?: { socialAccountId?: string | null }): Promise<SocialPlatformThread[]>;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string | null;
  metadata: Record<string, unknown>;
}

export interface CatalogSkuMatch {
  productId: string;
  sku: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface CatalogCostQuote {
  sku: string;
  quantity: number;
  unitCost: number | null;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface CatalogInventory {
  sku: string;
  available: number | null;
  metadata: Record<string, unknown>;
}

export interface CatalogAdapter {
  provider: string;
  mode: "stub" | "read_only";
  searchProducts(input: { query: string; tenantConfig: Record<string, unknown> }): Promise<CatalogProduct[]>;
  matchSku(input: { sku: string; color?: string; size?: string; tenantConfig: Record<string, unknown> }): Promise<CatalogSkuMatch | null>;
  getBlankCost(input: { sku: string; quantity: number; tenantConfig: Record<string, unknown> }): Promise<CatalogCostQuote>;
  getInventory(input: { sku: string; tenantConfig: Record<string, unknown> }): Promise<CatalogInventory>;
}

export const disabledCatalogAdapter: CatalogAdapter = {
  provider: "not_configured",
  mode: "stub",
  async searchProducts() {
    return [];
  },
  async matchSku() {
    return null;
  },
  async getBlankCost(input) {
    return {
      sku: input.sku,
      quantity: input.quantity,
      unitCost: null,
      currency: "USD",
      metadata: { unavailableReason: "catalog_costs_feature_disabled" },
    };
  },
  async getInventory(input) {
    return {
      sku: input.sku,
      available: null,
      metadata: { unavailableReason: "catalog_inventory_adapter_not_configured" },
    };
  },
};
