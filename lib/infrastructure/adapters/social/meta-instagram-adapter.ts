import type {
  SocialConnectionModeState,
  SocialPermissionState,
  SocialProviderReadiness,
} from "@/lib/application/screenprinting/adapters";
import type { IntegrationInstallation } from "@/lib/domain/runtime";

const DEFAULT_META_GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION ?? "v24.0";

const WEBHOOK_TOPICS = ["comments", "live_comments", "mentions", "messages", "messaging_seen", "message_reactions"];

const instagramBusinessLoginScopes = [
  {
    scope: "instagram_business_basic",
    label: "Basic account and media access",
    requiredFor: "Owned Instagram professional account discovery and profile/media reads",
    required: true,
  },
  {
    scope: "instagram_business_manage_insights",
    label: "Insights",
    requiredFor: "Post, story, and account metrics",
    required: true,
  },
  {
    scope: "instagram_business_manage_comments",
    label: "Comments",
    requiredFor: "Read, moderate, and reply to comments when write-back is enabled",
    required: false,
  },
  {
    scope: "instagram_business_manage_messages",
    label: "Messages",
    requiredFor: "Read and respond to Instagram conversations when write-back is enabled",
    required: false,
  },
  {
    scope: "instagram_business_content_publish",
    label: "Content publishing",
    requiredFor: "Post publishing after tenant feature flag approval",
    required: false,
  },
] satisfies SocialConnectionModeState["requiredScopes"];

const facebookLoginScopes = [
  {
    scope: "pages_show_list",
    label: "Page list",
    requiredFor: "Find Pages the user manages",
    required: true,
  },
  {
    scope: "pages_read_engagement",
    label: "Page engagement",
    requiredFor: "Read Page-linked Instagram professional account context",
    required: true,
  },
  {
    scope: "instagram_basic",
    label: "Instagram basic",
    requiredFor: "Discover and read Page-linked Instagram professional accounts",
    required: true,
  },
  {
    scope: "instagram_manage_insights",
    label: "Instagram insights",
    requiredFor: "Post, story, and account metrics",
    required: true,
  },
  {
    scope: "instagram_manage_comments",
    label: "Instagram comments",
    requiredFor: "Read, moderate, and reply to comments when write-back is enabled",
    required: false,
  },
  {
    scope: "instagram_manage_messages",
    label: "Instagram messages",
    requiredFor: "Read and respond to Instagram conversations when write-back is enabled",
    required: false,
  },
  {
    scope: "instagram_content_publish",
    label: "Content publishing",
    requiredFor: "Post publishing after tenant feature flag approval",
    required: false,
  },
] satisfies SocialConnectionModeState["requiredScopes"];

export const metaInstagramConnectionModes: SocialConnectionModeState[] = [
  {
    key: "instagram_business_login",
    label: "Business Login for Instagram",
    recommended: true,
    hostUrl: "graph.instagram.com",
    loginType: "Business Login for Instagram",
    tokenType: "Instagram user access token",
    pageLinkRequired: false,
    requiredScopes: instagramBusinessLoginScopes.filter((scope) => scope.required),
    optionalScopes: instagramBusinessLoginScopes.filter((scope) => !scope.required),
    endpoints: [
      {
        label: "Connected account profile",
        method: "GET",
        host: "graph.instagram.com",
        path: "/me?fields=id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
        purpose: "Validate the owned professional Instagram account and seed social_account metadata.",
      },
      {
        label: "Owned media",
        method: "GET",
        host: "graph.instagram.com",
        path: "/{ig-user-id}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
        purpose: "Import posts, reels, and eligible media records for the connected account.",
      },
      {
        label: "Insights",
        method: "GET",
        host: "graph.instagram.com",
        path: "/{ig-user-id}/insights",
        purpose: "Read account and media metrics after insights permission is granted.",
      },
      {
        label: "Comments",
        method: "GET",
        host: "graph.instagram.com",
        path: "/{ig-media-id}/comments",
        purpose: "Read comments for inbox/review workflows after comments permission is granted.",
      },
      {
        label: "Messages",
        method: "POST",
        host: "graph.instagram.com",
        path: "/me/messages",
        purpose: "Reply/send path after messaging permissions and product write-back flag are enabled.",
      },
    ],
    setupNotes: [
      "Use this mode for direct Instagram professional account onboarding when a Facebook Page link is not required.",
      "Request the new instagram_business_* scope names; older business_* scope names are deprecated.",
      "Publishing and replies are available after the tenant enables the matching feature flags and grants the required scopes.",
    ],
  },
  {
    key: "facebook_login_business",
    label: "Facebook Login for Business",
    recommended: false,
    hostUrl: "graph.facebook.com",
    loginType: "Facebook Login for Business",
    tokenType: "Facebook user/Page access token",
    pageLinkRequired: true,
    requiredScopes: facebookLoginScopes.filter((scope) => scope.required),
    optionalScopes: facebookLoginScopes.filter((scope) => !scope.required),
    endpoints: [
      {
        label: "Managed Pages and linked Instagram accounts",
        method: "GET",
        host: "graph.facebook.com",
        path: "/me/accounts?fields=id,name,access_token,tasks,instagram_business_account{id,ig_id,username,name,profile_picture_url,followers_count,follows_count,media_count}",
        purpose: "Discover multiple owned Instagram professional accounts linked through Meta Business Suite Pages.",
      },
      {
        label: "Owned media",
        method: "GET",
        host: "graph.facebook.com",
        path: "/{ig-user-id}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
        purpose: "Import posts, reels, and eligible media records for Page-linked Instagram accounts.",
      },
      {
        label: "Insights",
        method: "GET",
        host: "graph.facebook.com",
        path: "/{ig-user-id}/insights",
        purpose: "Read account and media metrics after insights permission is granted.",
      },
      {
        label: "App webhook subscription",
        method: "POST",
        host: "graph.facebook.com",
        path: "/{page-id}/subscribed_apps?subscribed_fields=comments,live_comments,messages,message_reactions,messaging_seen",
        purpose: "Subscribe the app to Page/Instagram webhook events once the Page access token has the needed tasks.",
      },
    ],
    setupNotes: [
      "Use this mode when owned Instagram accounts are managed in Meta Business Suite through linked Facebook Pages.",
      "Only Instagram Business or Creator accounts are supported; consumer Instagram accounts are not accessible.",
      "The first sync must iterate managed Pages and upsert each linked instagram_business_account non-destructively.",
    ],
  },
];

type MetaGraphMode = SocialConnectionModeState["key"];

export class MetaInstagramApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "MetaInstagramApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface MetaInstagramDiscoveredAccount {
  platform: "instagram";
  handle: string;
  displayName: string | null;
  externalAccountId: string;
  followerCount: number | null;
  profileUrl: string | null;
  metadata: Record<string, unknown>;
}

function hostForMode(mode: MetaGraphMode) {
  return mode === "facebook_login_business" ? "https://graph.facebook.com" : "https://graph.instagram.com";
}

async function metaGraphRequest<T>(input: {
  mode: MetaGraphMode;
  apiVersion: string;
  path: string;
  accessToken: string;
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
  form?: Record<string, string>;
}) {
  const url = new URL(`${hostForMode(input.mode)}/${input.apiVersion}${input.path}`);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.accessToken}`,
  };
  let body: BodyInit | undefined;
  if (input.form) {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(input.form)) {
      if (value) {
        form.set(key, value);
      }
    }
    body = form;
  } else if (input.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(input.body);
  }

  const response = await fetch(url, {
    method: input.method ?? "GET",
    headers,
    body,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? JSON.stringify((payload as { error?: unknown }).error)
      : `Meta Graph request failed with ${response.status}`;
    throw new MetaInstagramApiError(message, response.status, payload);
  }
  return payload as T;
}

export async function publishInstagramMedia(input: {
  mode: MetaGraphMode;
  apiVersion: string;
  accessToken: string;
  igUserId: string;
  caption: string | null;
  mediaUrl: string;
  postType: string;
}) {
  const isVideo = input.postType === "video" || input.postType === "reel";
  const container = await metaGraphRequest<{ id: string }>({
    mode: input.mode,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    method: "POST",
    path: `/${encodeURIComponent(input.igUserId)}/media`,
    form: {
      caption: input.caption ?? "",
      ...(isVideo ? { video_url: input.mediaUrl } : { image_url: input.mediaUrl }),
      ...(input.postType === "reel" ? { media_type: "REELS" } : input.postType === "video" ? { media_type: "VIDEO" } : {}),
    },
  });
  const published = await metaGraphRequest<{ id: string }>({
    mode: input.mode,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    method: "POST",
    path: `/${encodeURIComponent(input.igUserId)}/media_publish`,
    form: {
      creation_id: container.id,
    },
  });
  return {
    containerId: container.id,
    mediaId: published.id,
  };
}

export async function replyToInstagramComment(input: {
  mode: MetaGraphMode;
  apiVersion: string;
  accessToken: string;
  commentId: string;
  message: string;
}) {
  return metaGraphRequest<{ id: string }>({
    mode: input.mode,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    method: "POST",
    path: `/${encodeURIComponent(input.commentId)}/replies`,
    body: { message: input.message },
  });
}

export async function sendInstagramMessage(input: {
  mode: MetaGraphMode;
  apiVersion: string;
  accessToken: string;
  igUserId: string;
  recipientId?: string | null;
  commentId?: string | null;
  message: string;
}) {
  const recipient = input.commentId ? { comment_id: input.commentId } : { id: input.recipientId };
  return metaGraphRequest<{ recipient_id: string; message_id: string }>({
    mode: input.mode,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    method: "POST",
    path: `/${encodeURIComponent(input.igUserId)}/messages`,
    body: {
      recipient,
      message: { text: input.message },
    },
  });
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function discoverOwnedInstagramAccounts(input: {
  mode: MetaGraphMode;
  apiVersion: string;
  accessToken: string;
}) {
  if (input.mode === "facebook_login_business") {
    const payload = await metaGraphRequest<{ data?: unknown[] }>({
      mode: input.mode,
      apiVersion: input.apiVersion,
      accessToken: input.accessToken,
      path: "/me/accounts?fields=id,name,access_token,tasks,instagram_business_account{id,ig_id,username,name,profile_picture_url,followers_count,follows_count,media_count}",
    });
    return (payload.data ?? []).flatMap((page): MetaInstagramDiscoveredAccount[] => {
      const pageRecord = recordValue(page);
      const instagramAccount = recordValue(pageRecord.instagram_business_account);
      const handle = stringValue(instagramAccount.username);
      const externalAccountId = stringValue(instagramAccount.id) ?? stringValue(instagramAccount.ig_id);
      if (!handle || !externalAccountId) {
        return [];
      }
      return [
        {
          platform: "instagram",
          handle,
          displayName: stringValue(instagramAccount.name) ?? handle,
          externalAccountId,
          followerCount: numberValue(instagramAccount.followers_count),
          profileUrl: `https://www.instagram.com/${handle}/`,
          metadata: {
            provider: "meta",
            connectionMode: input.mode,
            pageId: stringValue(pageRecord.id),
            pageName: stringValue(pageRecord.name),
            pageTasks: Array.isArray(pageRecord.tasks) ? pageRecord.tasks : [],
            rawProfile: instagramAccount,
          },
        },
      ];
    });
  }

  const profile = await metaGraphRequest<Record<string, unknown>>({
    mode: input.mode,
    apiVersion: input.apiVersion,
    accessToken: input.accessToken,
    path: "/me?fields=id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count",
  });
  const handle = stringValue(profile.username);
  const externalAccountId = stringValue(profile.user_id) ?? stringValue(profile.id);
  if (!handle || !externalAccountId) {
    return [];
  }
  return [
    {
      platform: "instagram",
      handle,
      displayName: stringValue(profile.name) ?? handle,
      externalAccountId,
      followerCount: numberValue(profile.followers_count),
      profileUrl: `https://www.instagram.com/${handle}/`,
      metadata: {
        provider: "meta",
        connectionMode: input.mode,
        rawProfile: profile,
      },
    },
  ];
}

function configFields(installation: IntegrationInstallation | null) {
  const fields = installation?.config?.fields;
  return fields && typeof fields === "object" && !Array.isArray(fields) ? (fields as Record<string, unknown>) : {};
}

function configSecretKeys(installation: IntegrationInstallation | null) {
  const keys = installation?.config?.secretFieldKeys;
  return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === "string") : [];
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function preferredModeFor(value: unknown): SocialConnectionModeState["key"] {
  return value === "facebook_login_business" ? "facebook_login_business" : "instagram_business_login";
}

export function buildMetaInstagramReadiness(input: {
  installation: IntegrationInstallation | null;
  accountCounts: SocialProviderReadiness["accountCounts"];
  featureFlags?: {
    social_publishing?: boolean;
    comments_replies?: boolean;
    messages?: boolean;
  };
}): SocialProviderReadiness {
  const fields = configFields(input.installation);
  const secretFieldKeys = configSecretKeys(input.installation);
  const graphApiVersion = typeof fields.graphApiVersion === "string" && fields.graphApiVersion.trim()
    ? fields.graphApiVersion.trim()
    : DEFAULT_META_GRAPH_API_VERSION;
  const preferredMode = preferredModeFor(fields.authMode);
  const mode = metaInstagramConnectionModes.find((candidate) => candidate.key === preferredMode) ?? metaInstagramConnectionModes[0];
  const grantedScopes = stringList(fields.grantedScopes);
  const requiredScopes = mode.requiredScopes.map((scope) => scope.scope);
  const optionalScopes = mode.optionalScopes.map((scope) => scope.scope);
  const missingPermissions = grantedScopes.length
    ? requiredScopes.filter((scope) => !grantedScopes.includes(scope))
    : requiredScopes;
  const hasAccessToken = secretFieldKeys.includes("accessToken");
  const hasCommentScope = preferredMode === "instagram_business_login"
    ? grantedScopes.includes("instagram_business_manage_comments")
    : grantedScopes.includes("instagram_manage_comments");
  const hasMessageScope = preferredMode === "instagram_business_login"
    ? grantedScopes.includes("instagram_business_manage_messages")
    : grantedScopes.includes("instagram_manage_messages");
  const hasPublishScope = preferredMode === "instagram_business_login"
    ? grantedScopes.includes("instagram_business_content_publish")
    : grantedScopes.includes("instagram_content_publish");
  const configured = Boolean(input.installation);
  const canReadCore = configured && hasAccessToken && missingPermissions.length === 0;
  const authorizationUrl = typeof fields.authorizationUrl === "string" && fields.authorizationUrl.trim()
    ? fields.authorizationUrl.trim()
    : null;

  const permissionState: SocialPermissionState = {
    provider: "meta",
    authMode: preferredMode,
    connectionMode: preferredMode,
    requiredScopes,
    optionalScopes,
    grantedScopes,
    graphApiBaseUrl: `https://graph.facebook.com/${graphApiVersion}`,
    instagramGraphApiBaseUrl: `https://graph.instagram.com/${graphApiVersion}`,
    authorizationUrl,
    ownedAccountDiscovery: canReadCore ? "available" : hasAccessToken ? "needs_scope" : "needs_token",
    watchlistDiscovery: "manual_import",
    webhookTopics: WEBHOOK_TOPICS,
    canReadAccounts: canReadCore,
    canReadPosts: canReadCore,
    canReadComments: canReadCore && hasCommentScope,
    canReadMessages: canReadCore && hasMessageScope,
    canPublish: canReadCore && hasPublishScope && Boolean(input.featureFlags?.social_publishing),
    canReplyToComments: canReadCore && hasCommentScope && Boolean(input.featureFlags?.comments_replies),
    canReplyToMessages: canReadCore && hasMessageScope && Boolean(input.featureFlags?.messages),
    missingPermissions,
    manualFallbackAvailable: true,
  };

  const capabilities = {
    ownedAccountDiscovery: permissionState.ownedAccountDiscovery === "available",
    watchedAccountManualImport: true,
    watchedAccountApiEnrichment: canReadCore,
    readPosts: canReadCore,
    readInsights: canReadCore,
    readComments: permissionState.canReadComments,
    replyToComments: Boolean(permissionState.canReplyToComments),
    readMessages: permissionState.canReadMessages,
    replyToMessages: Boolean(permissionState.canReplyToMessages),
    publishPosts: permissionState.canPublish,
  };

  return {
    provider: "meta",
    platform: "instagram",
    graphApiVersion,
    configured,
    installationId: input.installation?.id ?? null,
    installationStatus: input.installation?.status ?? null,
    displayName: input.installation?.displayName ?? "Meta Business / Instagram",
    externalAccountId: input.installation?.externalAccountId ?? null,
    preferredMode,
    permissionState,
    modes: metaInstagramConnectionModes,
    webhookTopics: WEBHOOK_TOPICS,
    requiredSetup: [
      "Create or select a Meta Business app and add the Instagram product.",
      "Use Business Login for Instagram for direct professional account onboarding, or Facebook Login for Business when accounts are Page-linked in Meta Business Suite.",
      "Request the required read scopes before first sync; comments/messages/publishing stay optional and feature-gated.",
      "Configure a webhook callback before enabling live comment or message ingestion.",
    ],
    limitations: [
      "Watched account rows can be tracked immediately through manual/imported handles. API enrichment only runs where Meta permits it, such as permissioned professional account metadata, owned-account mentions, comments, and other connected-provider evidence.",
      "Consumer Instagram accounts are not supported by the business management APIs.",
      "Publishing, comment replies, and message replies require owned accounts, stored access tokens, the matching Meta scopes, and tenant feature flags.",
    ],
    accountCounts: input.accountCounts,
    capabilities,
    providerWriteBackAvailable: capabilities.replyToComments || capabilities.replyToMessages || capabilities.publishPosts,
    publishingAvailable: capabilities.publishPosts,
    manualFallbackAvailable: true,
  };
}
