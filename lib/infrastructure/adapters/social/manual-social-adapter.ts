import fixtureData from "@/fixtures/screenprinting/sample-screenprinting-data.json";
import type {
  SocialPermissionState,
  SocialPlatformAccount,
  SocialPlatformAdapter,
  SocialPlatformPost,
  SocialPlatformThread,
} from "@/lib/application/screenprinting/adapters";

type FixtureSocialAccount = {
  source_id: string;
  tenant_slug: string;
  platform: string;
  handle: string;
  ownership: "owned" | "watched" | "ignored";
  category?: string;
  priority?: string;
  status?: "active" | "paused" | "needs_auth" | "archived";
  followers?: number;
};

type FixtureSocialPost = {
  source_id: string;
  account_source_id: string;
  kind: SocialPlatformPost["postType"];
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
  kind: "message" | "comment" | "manual";
  body?: string;
  received_at?: string;
  suggested_links?: unknown[];
};

type FixtureBundle = {
  social_accounts?: FixtureSocialAccount[];
  social_posts?: FixtureSocialPost[];
  social_threads?: FixtureSocialThread[];
};

const fixture = fixtureData as FixtureBundle;

function accountToAdapterAccount(account: FixtureSocialAccount): SocialPlatformAccount {
  return {
    id: account.source_id,
    platform: account.platform,
    handle: account.handle,
    displayName: account.handle,
    ownership: account.ownership,
    source: "manual",
    category: account.category ?? null,
    priority: account.priority ?? null,
    status: account.status ?? "active",
    followerCount: account.followers ?? null,
    metadata: {
      fixtureTenantSlug: account.tenant_slug,
      sourceId: account.source_id,
    },
  };
}

function postToAdapterPost(post: FixtureSocialPost): SocialPlatformPost {
  return {
    id: post.source_id,
    socialAccountId: post.account_source_id,
    externalPostId: post.source_id,
    postType: post.kind,
    caption: post.caption ?? null,
    permalink: null,
    status: "published",
    publishedAt: post.posted_at ?? null,
    metrics: {
      likes: post.likes ?? 0,
      comments: post.comments ?? 0,
      shares: post.shares ?? 0,
      views: post.views ?? 0,
      engagementRate: post.engagement_rate ?? 0,
    },
    metadata: {
      alertCandidates: post.alert_candidates ?? [],
      source: "fixture_manual_import",
    },
  };
}

function threadToAdapterThread(thread: FixtureSocialThread): SocialPlatformThread {
  return {
    id: thread.source_id,
    platform: thread.platform,
    threadType: thread.kind === "message" ? "dm" : thread.kind,
    participantHandle: thread.handle ?? null,
    status: "needs_review",
    lastMessageAt: thread.received_at ?? null,
    metadata: {
      body: thread.body ?? null,
      suggestedLinks: thread.suggested_links ?? [],
      source: "fixture_manual_import",
    },
  };
}

export function createManualSocialAdapter(input: { tenantSlug: string }): SocialPlatformAdapter {
  const accounts = (fixture.social_accounts ?? [])
    .filter((account) => account.tenant_slug === input.tenantSlug)
    .map(accountToAdapterAccount);
  const accountIds = new Set(accounts.map((account) => account.id));
  const posts = (fixture.social_posts ?? [])
    .filter((post) => accountIds.has(post.account_source_id))
    .map(postToAdapterPost);
  const threads = (fixture.social_threads ?? [])
    .filter((thread) => thread.tenant_slug === input.tenantSlug)
    .map(threadToAdapterThread);

  return {
    provider: "manual_social_import",
    mode: "manual",
    readPermissionState(): SocialPermissionState {
      return {
        canReadAccounts: true,
        canReadPosts: true,
        canReadComments: false,
        canReadMessages: false,
        canPublish: false,
        missingPermissions: ["comments_api", "messages_api", "publishing_api"],
        manualFallbackAvailable: true,
      };
    },
    async listOwnedAccounts() {
      return accounts.filter((account) => account.ownership === "owned");
    },
    async listWatchedAccounts() {
      return accounts.filter((account) => account.ownership === "watched");
    },
    async importManualAccount(manualInput) {
      return {
        id: `manual:${manualInput.platform}:${manualInput.handle}`.toLowerCase(),
        platform: manualInput.platform,
        handle: manualInput.handle.replace(/^@/, ""),
        displayName: manualInput.handle.replace(/^@/, ""),
        ownership: manualInput.ownership,
        source: "manual",
        category: manualInput.category ?? null,
        priority: manualInput.priority ?? null,
        status: "active",
        followerCount: null,
        metadata: {
          tenantSlug: input.tenantSlug,
          createdVia: "manual_social_adapter",
        },
      };
    },
    async fetchPosts(postInput = {}) {
      return postInput.socialAccountId ? posts.filter((post) => post.socialAccountId === postInput.socialAccountId) : posts;
    },
    async fetchThreads() {
      return threads;
    },
  };
}
