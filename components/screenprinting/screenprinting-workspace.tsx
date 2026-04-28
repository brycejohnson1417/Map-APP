"use client";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  Heart,
  Inbox,
  Instagram,
  LayoutDashboard,
  Link2,
  Mail,
  MessageCircle,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Target,
  Trophy,
  Upload,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { getScreenprintingWorkspaceSummary } from "@/lib/application/screenprinting/screenprinting-service";

type ScreenprintingWorkspaceSummary = Awaited<ReturnType<typeof getScreenprintingWorkspaceSummary>>;
type SalesView = "dashboard" | "opportunities" | "accounts" | "reorders" | "goals" | "orders";
type SocialView = "dashboard" | "accounts" | "account-detail" | "posts" | "alerts" | "calendar" | "conversations" | "campaigns" | "import";
type ModuleView = "sales" | "social" | "admin";
type SalesOrder = ScreenprintingWorkspaceSummary["orders"]["orders"][number];
type SavedView = ScreenprintingWorkspaceSummary["orders"]["savedViews"][number];
type SocialAccount = ScreenprintingWorkspaceSummary["socialAccounts"]["accounts"][number];
type SocialPost = ScreenprintingWorkspaceSummary["socialPosts"]["posts"][number];
type ReorderSignal = ScreenprintingWorkspaceSummary["reorders"]["buckets"]["overdue"][number];
type Opportunity = ScreenprintingWorkspaceSummary["opportunities"]["pipelines"][number]["stages"][number]["opportunities"][number];
type IdentitySuggestion = ScreenprintingWorkspaceSummary["identity"]["suggestions"][number];
type ManagerGoal = ScreenprintingWorkspaceSummary["managerGoals"]["goals"][number];
type ScreenprintingConfig = ScreenprintingWorkspaceSummary["config"];
type EditableConfigSection =
  | "statusMappings"
  | "paymentMappings"
  | "tagMappings"
  | "fieldTrust"
  | "reorderRules"
  | "emailTemplates"
  | "socialAccountCategories"
  | "alertRules"
  | "featureFlags";
type ArrayConfigSection = Exclude<EditableConfigSection, "featureFlags">;
type ConfigDraftState = Pick<ScreenprintingConfig, EditableConfigSection>;
type ConfigPreviewState = {
  section: EditableConfigSection;
  affectedOrders: number;
  affectedAccounts: number;
  affectedDashboards: string[];
  dirtyRecords: number;
  warnings: string[];
  previewToken: string;
} | null;
type SocialComposerDraft = {
  socialAccountId: string;
  postType: string;
  caption: string;
  mediaUrl: string;
  scheduledFor: string;
  location: string;
  collaborators: string;
  tags: string;
};

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compactMoneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const numberFormatter = new Intl.NumberFormat("en-US");

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatMoney(value: number | null | undefined, compact = false) {
  return (compact ? compactMoneyFormatter : moneyFormatter).format(value ?? 0);
}

function formatNumber(value: number | null | undefined, digits = 0) {
  return numberFormatter.format(Number((value ?? 0).toFixed(digits)));
}

function formatPercent(value: number | null | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function labelFromKey(value: string | null | undefined) {
  if (!value) {
    return "Unmapped";
  }
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function metricValue(metrics: Record<string, unknown> | null | undefined, key: string) {
  const value = metrics?.[key];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function metadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isFixtureValue(value: unknown) {
  return Boolean(value && typeof value === "object" && "fixture" in value && (value as { fixture?: unknown }).fixture === true);
}

function Button({
  children,
  icon: Icon,
  onClick,
  disabled,
  active,
  title,
  variant = "secondary",
  type = "button",
}: {
  children: ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
}) {
  const variants = {
    primary: "border-blue-700 bg-blue-700 text-white hover:bg-blue-800",
    secondary: "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800",
    ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    danger: "border-red-200 bg-white text-red-700 hover:bg-red-50",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        variants[variant],
        active && "border-blue-700 bg-blue-50 text-blue-800",
        disabled && "cursor-not-allowed opacity-50 hover:border-slate-200 hover:bg-white hover:text-slate-700",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "blue" | "green" | "amber" | "red" | "pink" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-700",
    pink: "border-pink-200 bg-pink-50 text-pink-700",
  };
  return <span className={cx("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

function Section({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
          {sublabel ? <p className="mt-1 text-sm text-slate-500">{sublabel}</p> : null}
        </div>
        <span className={cx("inline-flex h-10 w-10 items-center justify-center rounded-md", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-500">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-slate-200">{children}</div>;
}

function DataSourceBadge({ source, metadata }: { source?: string | null; metadata?: Record<string, unknown> | null }) {
  if (isFixtureValue(metadata)) {
    return <Pill tone="amber">Demo fixture</Pill>;
  }
  if (source === "manual") {
    return <Pill tone="slate">Manual import</Pill>;
  }
  if (source) {
    return <Pill tone="green">{labelFromKey(source)}</Pill>;
  }
  return null;
}

function LinkButton({
  href,
  children,
  icon: Icon,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const variants = {
    primary: "border-slate-950 bg-slate-950 !text-white hover:bg-slate-800",
    secondary: "border-slate-200 bg-white !text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:!text-blue-800",
    ghost: "border-transparent bg-transparent !text-slate-600 hover:bg-slate-100 hover:!text-slate-950",
  };
  return (
    <a
      href={href}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        variants[variant],
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </a>
  );
}

function HeroStat({ label, value, sublabel }: { label: string; value: ReactNode; sublabel?: ReactNode }) {
  return (
    <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase text-white/65">{label}</p>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {sublabel ? <p className="mt-1 text-xs text-white/65">{sublabel}</p> : null}
    </div>
  );
}

function ActionTile({
  icon: Icon,
  title,
  detail,
  count,
  tone = "blue",
  children,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  count: ReactNode;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
  children?: ReactNode;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cx("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1", tones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
          </div>
        </div>
        <div className="text-right text-2xl font-semibold tabular-nums text-slate-950">{count}</div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function flattenOpportunities(summary: ScreenprintingWorkspaceSummary) {
  return summary.opportunities.pipelines.flatMap((pipeline) => pipeline.stages.flatMap((stage) => stage.opportunities));
}

function topReorderSignals(summary: ScreenprintingWorkspaceSummary) {
  return [...summary.reorders.buckets.overdue, ...summary.reorders.buckets.due].slice(0, 6);
}

function customerNextAction(customer: ScreenprintingWorkspaceSummary["salesDashboard"]["topCustomers"][number]) {
  if (customer.orderCount <= 1) {
    return "Qualify for repeat order";
  }
  if (!customer.lastOrderAt) {
    return "Review order history";
  }
  return "Check reorder timing";
}

function syncAgeLabel(value: string | null | undefined) {
  if (!value) {
    return "No sync yet";
  }
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return shortDate(value);
  }
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "Yesterday";
  }
  return `${days} days ago`;
}

function safeApiMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Action failed.";
}

function dateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function initialModuleViewFromUrl(): ModuleView {
  if (typeof window === "undefined") {
    return "sales";
  }
  return new URLSearchParams(window.location.search).get("module") === "social" ? "social" : "sales";
}

function initialSocialViewFromUrl(): SocialView {
  if (typeof window === "undefined") {
    return "dashboard";
  }
  const value = new URLSearchParams(window.location.search).get("social");
  return value === "accounts" ||
    value === "account-detail" ||
    value === "posts" ||
    value === "alerts" ||
    value === "calendar" ||
    value === "conversations" ||
    value === "campaigns" ||
    value === "import"
    ? value
    : "dashboard";
}

export function ScreenprintingWorkspace({ summary, orgSlug }: { summary: ScreenprintingWorkspaceSummary; orgSlug: string }) {
  const [moduleView, setModuleView] = useState<ModuleView>(() => initialModuleViewFromUrl());
  const [salesView, setSalesView] = useState<SalesView>("dashboard");
  const [socialView, setSocialView] = useState<SocialView>(() => initialSocialViewFromUrl());
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(summary.socialAccounts.accounts);
  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState(summary.socialAccounts.accounts[0]?.id ?? null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [draft, setDraft] = useState<{ id?: string; to: string | null; subject: string; body: string; source: "api" | "local" } | null>(null);
  const [newSocialAccount, setNewSocialAccount] = useState({
    handle: "",
    platform: "instagram",
    ownership: "watched",
    category: "",
    priority: "medium",
    externalAccountId: "",
    metaPageId: "",
    metaBusinessId: "",
    profileUrl: "",
    followerCount: "",
  });
  const [newCampaign, setNewCampaign] = useState({ name: "", campaignType: "drop", startsOn: "", endsOn: "", goal: "" });
  const [newThread, setNewThread] = useState({ participantHandle: "", threadType: "dm", summary: "" });
  const [commentText, setCommentText] = useState("");
  const [orderFilters, setOrderFilters] = useState({
    q: "",
    statusBucket: "all",
    paymentBucket: "all",
    managerName: "all",
    teamName: "all",
    syncState: "all",
  });
  const [savedViewName, setSavedViewName] = useState("");
  const [newOpportunity, setNewOpportunity] = useState({ title: "", value: "", customerName: "", stageKey: "new_lead" });
  const [goalDrafts, setGoalDrafts] = useState<Record<string, { revenueGoal: string; ordersGoal: string; storesGoal: string }>>(() =>
    Object.fromEntries(
      summary.managerGoals.goals.map((goal) => [
        goal.managerName,
        {
          revenueGoal: String(goal.revenueGoal ?? 0),
          ordersGoal: String(goal.ordersGoal ?? 0),
          storesGoal: String(goal.storesGoal ?? 0),
        },
      ]),
    ),
  );
  const [postTypeFilter, setPostTypeFilter] = useState("all");
  const [alertStatusFilter, setAlertStatusFilter] = useState("unread");
  const [accountFilters, setAccountFilters] = useState({ q: "", platform: "all", category: "all", ownership: "all", status: "all" });
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState({
    socialAccountId: summary.socialAccounts.accounts[0]?.id ?? "",
    postType: "post",
    caption: "",
    mediaUrl: "",
    scheduledFor: "",
    location: "",
    collaborators: "",
    tags: "",
  });
  const [threadReplies, setThreadReplies] = useState<Record<string, string>>({});
  const [dashboardDraft, setDashboardDraft] = useState({
    name: "",
    widgets: ["sales_pulse", "reorder_queue", "social_alerts"],
  });
  const [configDraft, setConfigDraft] = useState<ConfigDraftState>(() => ({
    statusMappings: summary.config.statusMappings,
    paymentMappings: summary.config.paymentMappings,
    tagMappings: summary.config.tagMappings,
    fieldTrust: summary.config.fieldTrust,
    reorderRules: summary.config.reorderRules,
    emailTemplates: summary.config.emailTemplates,
    socialAccountCategories: summary.config.socialAccountCategories,
    alertRules: summary.config.alertRules,
    featureFlags: summary.config.featureFlags,
  }));
  const [configPreview, setConfigPreview] = useState<ConfigPreviewState>(null);

  const sales = summary.salesDashboard.metrics;
  const social = summary.socialDashboard.metrics;
  const topCustomers = summary.salesDashboard.topCustomers ?? [];
  const syncStatus = summary.salesDashboard.printavoSyncStatus;
  const orders = summary.orders.orders;
  const savedViews = summary.orders.savedViews ?? [];
  const socialConnection = summary.socialConnection;
  const selectedSocialAccount = socialAccounts.find((account) => account.id === selectedSocialAccountId) ?? socialAccounts[0] ?? null;
  const socialPosts = summary.socialPosts.posts;
  const selectedAccountPosts = selectedSocialAccount ? socialPosts.filter((post) => post.socialAccountId === selectedSocialAccount.id) : socialPosts;
  const socialThreads = summary.threads.threads;
  const campaigns = summary.campaigns.campaigns;
  const alerts = summary.socialDashboard.recentAlerts.length ? summary.socialDashboard.recentAlerts : summary.socialPosts.posts
    .filter((post) => Array.isArray(post.metadata?.alertCandidates) && post.metadata.alertCandidates.length)
    .map((post) => ({
      id: `local-${post.id}`,
      alertRuleId: null,
      module: "social",
      eventType: "engagement_spike",
      title: "Engagement spike candidate",
      body: post.caption,
      severity: "medium",
      status: "unread",
      ownerMemberId: null,
      accountId: post.accountId,
      opportunityId: null,
      socialAccountId: post.socialAccountId,
      socialPostId: post.id,
      metadata: { source: "post_metadata" },
      createdAt: post.publishedAt,
    }));
  const workspaceName = summary.organization?.name ?? summary.workspace.displayName;
  const isFraternitees = orgSlug === "fraternitees";
  const operatorLabel = isFraternitees ? "FraterniTees sales ops" : `${workspaceName} ops`;
  const orgQuery = encodeURIComponent(orgSlug);
  const allOpportunities = flattenOpportunities(summary);
  const activeOpportunities = allOpportunities.filter((opportunity) => opportunity.status !== "won").slice(0, 8);
  const reorderActions = topReorderSignals(summary);
  const unreadAlerts = alerts.filter((alert) => alert.status === "unread");
  const socialMetrics = {
    ...social,
    trackedAccounts: socialAccounts.length,
    activeAccounts: socialAccounts.filter((account) => account.status === "active").length,
  };

  const apiBase = `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/screenprinting`;

  async function runAction(label: string, path: string, init: RequestInit = {}, reload = true) {
    setNotice({ tone: "info", message: `${label}...` });
    try {
      const response = await fetch(path, {
        ...init,
        headers: {
          "content-type": "application/json",
          ...(init.headers as Record<string, string> | undefined),
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        const detail = payload?.error?.message ?? payload?.error ?? response.statusText;
        throw new Error(response.status === 401 ? `${label} requires a FraterniTees tenant session.` : String(detail));
      }
      setNotice({ tone: "success", message: `${label} completed.` });
      if (reload) {
        window.setTimeout(() => window.location.reload(), 650);
      }
      return payload;
    } catch (error) {
      setNotice({ tone: "error", message: safeApiMessage(error) });
      return null;
    }
  }

  async function copyText(value: string, message = "Copied.") {
    await navigator.clipboard.writeText(value);
    setNotice({ tone: "success", message });
  }

  async function createDraft(signal?: ReorderSignal) {
    const accountName = metadataString(signal?.metadata?.["customerName"]) ?? topCustomers[0]?.name ?? "Customer";
    const contactName = metadataString(signal?.metadata?.["contactName"]) ?? accountName;
    const payload = await runAction(
      "Create email draft",
      `${apiBase}/sales/email-drafts`,
      {
        method: "POST",
        body: JSON.stringify({
          templateKey: "reorder_follow_up",
          accountName,
          contactName,
          senderName: summary.organization?.name ?? summary.workspace.displayName,
        }),
      },
      false,
    );
    if (payload?.draft) {
      setDraft({ ...payload.draft, source: "api" });
      return;
    }

    const template = summary.config.emailTemplates.find((candidate) => candidate.templateKey === "reorder_follow_up") ?? summary.config.emailTemplates[0];
    if (template) {
      const subject = template.subjectTemplate.replaceAll("{{accountName}}", accountName).replaceAll("{{contactName}}", contactName);
      const body = template.bodyTemplate
        .replaceAll("{{accountName}}", accountName)
        .replaceAll("{{contactName}}", contactName)
        .replaceAll("{{senderName}}", summary.organization?.name ?? summary.workspace.displayName);
      setDraft({ to: null, subject, body, source: "local" });
    }
  }

  async function addOpportunityFromSignal(signal: ReorderSignal) {
    const customerName = metadataString(signal.metadata?.["customerName"]) ?? "Reorder follow-up";
    const lastOrderTotal = Number(signal.metadata?.["lastOrderTotal"]);
    await runAction(
      "Add opportunity",
      `${apiBase}/sales/opportunities`,
      {
        method: "POST",
        body: JSON.stringify({
          title: `${customerName} reorder`,
          value: Number.isFinite(lastOrderTotal) ? lastOrderTotal : null,
          sourceOrderId: signal.sourceOrderId,
          sourceType: "reorder_signal",
          stageKey: "new_lead",
          metadata: {
            customerName,
            reorderSignalId: signal.id,
            expectedReorderDate: signal.expectedReorderDate,
            derivedSignal: Boolean(signal.metadata?.["derived"]),
          },
        }),
      },
    );
  }

  async function snoozeReorder(signal: ReorderSignal, days = 30) {
    await runAction(
      "Snooze reorder",
      `${apiBase}/sales/reorders/${signal.id}/snooze`,
      {
        method: "POST",
        body: JSON.stringify({
          snoozedUntil: dateAfterDays(days),
          reason: `${days}-day operator snooze`,
        }),
      },
    );
  }

  function applySavedView(savedView: SavedView) {
    const filters = savedView.filters ?? {};
    setOrderFilters({
      q: typeof filters.q === "string" ? filters.q : "",
      statusBucket: typeof filters.statusBucket === "string" ? filters.statusBucket : "all",
      paymentBucket: typeof filters.paymentBucket === "string" ? filters.paymentBucket : "all",
      managerName: typeof filters.managerName === "string" ? filters.managerName : "all",
      teamName: typeof filters.teamName === "string" ? filters.teamName : "all",
      syncState: typeof filters.syncState === "string" ? filters.syncState : "all",
    });
    setNotice({ tone: "success", message: `Applied saved view: ${savedView.name}.` });
  }

  async function saveOrderView() {
    const name = savedViewName.trim();
    if (!name) {
      setNotice({ tone: "error", message: "Saved view name is required." });
      return;
    }
    await runAction("Create saved view", `${apiBase}/sales/saved-views`, {
      method: "POST",
      body: JSON.stringify({
        module: "sales_orders",
        name,
        filters: orderFilters,
        columns: ["customer", "job", "total", "status", "payment", "manager", "date"],
        sort: { key: "orderCreatedAt", direction: "desc" },
      }),
    });
  }

  async function createOpportunityFromForm() {
    if (!newOpportunity.title.trim()) {
      setNotice({ tone: "error", message: "Opportunity title is required." });
      return;
    }
    const value = Number(newOpportunity.value);
    await runAction("Create opportunity", `${apiBase}/sales/opportunities`, {
      method: "POST",
      body: JSON.stringify({
        title: newOpportunity.title,
        value: Number.isFinite(value) ? value : null,
        stageKey: newOpportunity.stageKey,
        sourceType: "manual",
        metadata: {
          customerName: newOpportunity.customerName || null,
          providerWriteBack: false,
        },
      }),
    });
  }

  async function updateOpportunityStage(opportunity: Opportunity, stageKey: string) {
    await runAction("Update opportunity", `${apiBase}/sales/opportunities/${opportunity.id}`, {
      method: "PATCH",
      body: JSON.stringify({ stageKey }),
    });
  }

  async function saveManagerGoals() {
    const goals = Object.entries(goalDrafts).map(([managerName, values]) => ({
      managerName,
      revenueGoal: Number(values.revenueGoal) || 0,
      ordersGoal: Number(values.ordersGoal) || 0,
      storesGoal: Number(values.storesGoal) || 0,
    }));
    await runAction("Save manager goals", `${apiBase}/sales/manager-goals`, {
      method: "POST",
      body: JSON.stringify({ period: summary.managerGoals.period, goals }),
    });
  }

  async function saveSocialDraft() {
    if (!composerDraft.socialAccountId) {
      setNotice({ tone: "error", message: "Pick a social account before saving a draft." });
      return;
    }
    if (!composerDraft.caption.trim()) {
      setNotice({ tone: "error", message: "Caption is required for a draft post." });
      return;
    }
    await runAction("Save draft post", `${apiBase}/social/posts`, {
      method: "POST",
      body: JSON.stringify({
        socialAccountId: composerDraft.socialAccountId,
        postType: composerDraft.postType,
        caption: composerDraft.caption,
        mediaUrl: composerDraft.mediaUrl || null,
        scheduledFor: composerDraft.scheduledFor || null,
        location: composerDraft.location || null,
        collaborators: composerDraft.collaborators.split(",").map((item) => item.trim()).filter(Boolean),
        tags: composerDraft.tags.split(",").map((item) => item.trim()).filter(Boolean),
      }),
    });
  }

  function upsertSocialAccountLocal(account: SocialAccount) {
    setSocialAccounts((current) => {
      const withoutAccount = current.filter((candidate) => candidate.id !== account.id);
      return [account, ...withoutAccount].sort((left, right) => (right.lastSyncedAt ?? "").localeCompare(left.lastSyncedAt ?? ""));
    });
  }

  async function addSocialAccount() {
    if (!newSocialAccount.handle.trim()) {
      setNotice({ tone: "error", message: "Social handle is required." });
      return;
    }
    const payload = await runAction(
      "Add social account",
      `${apiBase}/social/accounts`,
      {
        method: "POST",
        body: JSON.stringify({
          ...newSocialAccount,
          handle: newSocialAccount.handle.replace(/^@/, ""),
          category: newSocialAccount.category || null,
          priority: newSocialAccount.priority || null,
          externalAccountId: newSocialAccount.externalAccountId || null,
          metaPageId: newSocialAccount.metaPageId || null,
          metaBusinessId: newSocialAccount.metaBusinessId || null,
          profileUrl: newSocialAccount.profileUrl || null,
          followerCount: newSocialAccount.followerCount || null,
        }),
      },
      false,
    );
    if (payload?.socialAccount) {
      upsertSocialAccountLocal(payload.socialAccount);
      setSelectedSocialAccountId(payload.socialAccount.id);
      setSocialView("account-detail");
      setNewSocialAccount({
        handle: "",
        platform: "instagram",
        ownership: "watched",
        category: "",
        priority: "medium",
        externalAccountId: "",
        metaPageId: "",
        metaBusinessId: "",
        profileUrl: "",
        followerCount: "",
      });
      setNotice({
        tone: "success",
        message: `@${payload.socialAccount.handle} is now on the watchlist. Review its mapping, priority, and ownership here.`,
      });
    }
  }

  async function patchSocialAccount(socialAccountId: string, patch: Record<string, unknown>) {
    const payload = await runAction(
      "Update social account",
      `${apiBase}/social/accounts/${socialAccountId}`,
      { method: "PATCH", body: JSON.stringify(patch) },
      false,
    );
    if (payload?.socialAccount) {
      upsertSocialAccountLocal(payload.socialAccount);
      setSelectedSocialAccountId(payload.socialAccount.id);
    }
  }

  async function saveCustomDashboard() {
    if (!dashboardDraft.name.trim()) {
      setNotice({ tone: "error", message: "Dashboard name is required." });
      return;
    }
    await runAction("Create dashboard", `${apiBase}/dashboards`, {
      method: "POST",
      body: JSON.stringify(dashboardDraft),
    });
  }

  async function sendThreadReply(thread: ScreenprintingWorkspaceSummary["threads"]["threads"][number]) {
    const message = threadReplies[thread.id]?.trim();
    if (!message) {
      setNotice({ tone: "error", message: "Reply message is required." });
      return;
    }
    await runAction("Send Instagram reply", `${apiBase}/social/threads/${thread.id}/reply`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  function setConfigItem<TSection extends ArrayConfigSection>(
    section: TSection,
    index: number,
    patch: Partial<ConfigDraftState[TSection][number]>,
  ) {
    setConfigDraft((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addConfigItem<TSection extends ArrayConfigSection>(section: TSection, item: ConfigDraftState[TSection][number]) {
    setConfigDraft((current) => ({
      ...current,
      [section]: [...current[section], item],
    }));
  }

  function removeConfigItem(section: ArrayConfigSection, index: number) {
    setConfigDraft((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function previewConfigSection(section: EditableConfigSection) {
    const payload = await runAction(
      "Preview config impact",
      `${apiBase}/config/preview`,
      {
        method: "POST",
        body: JSON.stringify({ section, draftChanges: configDraft[section] }),
      },
      false,
    );
    if (payload?.impact) {
      setConfigPreview({ section, ...payload.impact });
    }
  }

  async function saveConfigSection(section: EditableConfigSection) {
    const previewToken = configPreview?.section === section ? configPreview.previewToken : null;
    await runAction("Save config section", `${apiBase}/config`, {
      method: "PATCH",
      body: JSON.stringify({ section, changes: configDraft[section], previewToken }),
    });
  }

  const salesNav: Array<{ key: SalesView; label: string; icon: LucideIcon }> = [
    { key: "dashboard", label: "Today", icon: LayoutDashboard },
    { key: "opportunities", label: "Opportunities", icon: Target },
    { key: "accounts", label: "Accounts", icon: Building2 },
    { key: "reorders", label: "Reorders", icon: RefreshCw },
    { key: "goals", label: "Team goals", icon: Trophy },
    { key: "orders", label: "Orders", icon: ShoppingBag },
  ];
  const socialNav: Array<{ key: SocialView; label: string; icon: LucideIcon }> = [
    { key: "dashboard", label: "Signal overview", icon: LayoutDashboard },
    { key: "accounts", label: "Watched accounts", icon: Users },
    { key: "account-detail", label: "Account detail", icon: Instagram },
    { key: "posts", label: "Post insights", icon: FileText },
    { key: "alerts", label: "Alerts", icon: Bell },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "conversations", label: "Messages", icon: MessageCircle },
    { key: "campaigns", label: "Campaigns", icon: Target },
    { key: "import", label: "Import", icon: Upload },
  ];
  const adminNav = ["Mappings", "Statuses", "Tags", "Dashboards", "Alerts", "Email templates", "Feature flags", "UI audit"];

  function renderDataBanner() {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <div>
              <p className="font-semibold text-slate-950">Printavo is the source of truth. This workspace stays read-only.</p>
              <p className="mt-1 text-slate-500">
                {syncStatus
                  ? `${formatNumber(syncStatus.orders)} orders and ${formatNumber(syncStatus.accounts)} accounts synced. Last success: ${syncAgeLabel(syncStatus.lastSuccessfulSyncAt)}.`
                  : "No Printavo sync status is available for this tenant."}
              </p>
            </div>
          </div>
          <Button
            icon={RefreshCw}
            onClick={() =>
              runAction(
                "Printavo sync",
                `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/printavo/sync`,
                { method: "POST", body: JSON.stringify({ mode: "latest", pageLimit: 3, pageSize: 25 }) },
              )
            }
          >
            Sync Printavo
          </Button>
        </div>
      </div>
    );
  }

  function renderSalesDashboard() {
    const series = summary.salesDashboard.periodPerformance ?? [];
    const maxRevenue = Math.max(1, ...series.map((item) => item.revenue));
    const overdueCount = summary.reorders.buckets.overdue.length;
    const dueSoonCount = summary.reorders.buckets.due.length;
    const openOpportunityValue = activeOpportunities.reduce((sum, opportunity) => sum + (opportunity.value ?? 0), 0);
    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950 shadow-lg">
          <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="p-6 text-white md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                  Today
                </span>
                <span className="rounded-md bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/20">
                  Draft-only outreach
                </span>
                <span className="rounded-md bg-blue-400/15 px-2.5 py-1 text-xs font-semibold text-blue-100 ring-1 ring-blue-300/20">
                  Printavo read-only
                </span>
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                Who should FraterniTees work today?
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Start with overdue reorders, open quote follow-ups, watched social signals, and the customer accounts most likely to turn into repeat revenue.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="primary" icon={RefreshCw} onClick={() => setSalesView("reorders")}>Work reorders</Button>
                <Button icon={Target} onClick={() => setSalesView("opportunities")}>Review opportunities</Button>
                <LinkButton href={`/accounts?org=${orgQuery}`} icon={Building2}>Open account directory</LinkButton>
                <LinkButton href={`/territory?org=${orgQuery}`} icon={Target}>Map view</LinkButton>
              </div>
            </div>
            <div className="grid gap-3 border-t border-white/10 bg-white/[0.03] p-5 md:grid-cols-2 lg:border-l lg:border-t-0 lg:grid-cols-1">
              <HeroStat label="Revenue tracked" value={formatMoney(sales.revenue, true)} sublabel={`${formatNumber(sales.totalOrders)} Printavo orders`} />
              <HeroStat label="Due now" value={formatNumber(overdueCount + dueSoonCount)} sublabel={`${formatNumber(overdueCount)} overdue, ${formatNumber(dueSoonCount)} due soon`} />
              <HeroStat label="Open follow-up" value={formatMoney(openOpportunityValue, true)} sublabel={`${formatNumber(activeOpportunities.length)} opportunities`} />
              <HeroStat label="Unread social" value={formatNumber(unreadAlerts.length)} sublabel="Signals and replies" />
            </div>
          </div>
        </section>

        {renderDataBanner()}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionTile icon={RefreshCw} title="Reorder queue" detail="Customers whose expected reorder window is active." count={formatNumber(overdueCount + dueSoonCount)} tone={overdueCount ? "red" : "amber"}>
            <Button icon={ArrowRight} onClick={() => setSalesView("reorders")}>Open queue</Button>
          </ActionTile>
          <ActionTile icon={Target} title="Quote follow-up" detail="Open opportunities derived from quotes and review statuses." count={formatNumber(activeOpportunities.length)} tone="blue">
            <Button icon={ArrowRight} onClick={() => setSalesView("opportunities")}>Review pipeline</Button>
          </ActionTile>
          <ActionTile icon={Building2} title="Account focus" detail="Repeatable customer accounts sorted by order value." count={formatNumber(topCustomers.length)} tone="green">
            <LinkButton href={`/accounts?org=${orgQuery}`} icon={ExternalLink}>Account directory</LinkButton>
          </ActionTile>
          <ActionTile icon={Bell} title="Social signals" detail="Unread social alerts and monitored account activity." count={formatNumber(unreadAlerts.length)} tone={unreadAlerts.length ? "amber" : "slate"}>
            <Button icon={ArrowRight} onClick={() => {
              setModuleView("social");
              setSocialView("alerts");
            }}>
              Review alerts
            </Button>
          </ActionTile>
        </div>

        <Section
          title="Today's action queue"
          description="The working list. These are the accounts, quotes, and social signals that should drive today's sales motion."
          actions={
            <>
              <Button icon={Mail} onClick={() => createDraft(reorderActions[0])} disabled={!reorderActions.length}>Draft first email</Button>
              <Button icon={ShoppingBag} onClick={() => setSalesView("orders")}>View orders</Button>
            </>
          }
        >
          {reorderActions.length || activeOpportunities.length || unreadAlerts.length ? (
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">Reorders</p>
                  <Pill tone={overdueCount ? "red" : "amber"}>{formatNumber(reorderActions.length)} active</Pill>
                </div>
                {reorderActions.slice(0, 4).map((signal) => (
                  <div key={signal.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="font-semibold text-slate-950">{metadataString(signal.metadata?.["customerName"]) ?? signal.accountId}</p>
                    <p className="mt-1 text-sm text-slate-500">Expected {shortDate(signal.expectedReorderDate)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button icon={Mail} onClick={() => createDraft(signal)}>Draft</Button>
                      <Button icon={Clock3} onClick={() => snoozeReorder(signal)}>Snooze</Button>
                      <Button icon={Plus} onClick={() => addOpportunityFromSignal(signal)}>Opportunity</Button>
                    </div>
                  </div>
                ))}
                {!reorderActions.length ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No reorder accounts need attention right now.</p> : null}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">Quote follow-up</p>
                  <Pill tone="blue">{formatNumber(activeOpportunities.length)} open</Pill>
                </div>
                {activeOpportunities.slice(0, 4).map((opportunity) => (
                  <div key={opportunity.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{opportunity.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{metadataString(opportunity.metadata?.customerName) ?? labelFromKey(opportunity.stageKey)}</p>
                      </div>
                      <span className="font-semibold text-emerald-700">{opportunity.value ? formatMoney(opportunity.value) : "No value"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone={opportunity.metadata?.derived ? "blue" : "green"}>{opportunity.metadata?.derived ? "Read-only" : "Persisted"}</Pill>
                      <Pill tone="slate">{labelFromKey(opportunity.stageKey)}</Pill>
                    </div>
                  </div>
                ))
                }
                {!activeOpportunities.length ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No open Printavo quote follow-ups were found.</p> : null}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">Social signals</p>
                  <Pill tone={unreadAlerts.length ? "amber" : "slate"}>{formatNumber(unreadAlerts.length)} unread</Pill>
                </div>
                {(unreadAlerts.length ? unreadAlerts : alerts).slice(0, 4).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={alert.status === "unread" ? "amber" : "slate"}>{labelFromKey(alert.status)}</Pill>
                      <Pill tone="blue">{labelFromKey(alert.eventType)}</Pill>
                    </div>
                    <p className="mt-2 font-semibold text-slate-950">{alert.title}</p>
                    {alert.body ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{alert.body}</p> : null}
                  </div>
                ))}
                {!alerts.length ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No social alerts are active.</p> : null}
              </div>
            </div>
          ) : (
            <EmptyState title="No urgent actions" body="No active reorder, quote follow-up, or unread social signal is available from the current tenant data." />
          )}
        </Section>

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
          <Section
            title="Account watchlist"
            description="Top customers with the fields a rep needs before deciding whether to follow up."
            actions={<Button icon={Building2} onClick={() => setSalesView("accounts")}>View all accounts</Button>}
          >
            {topCustomers.length ? (
              <TableShell>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Account</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">Orders</th>
                      <th className="px-4 py-3 text-left">Last order</th>
                      <th className="px-4 py-3 text-left">Next action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {topCustomers.slice(0, 10).map((customer) => (
                      <tr key={`${customer.name}-${customer.lastOrderAt}`} className="hover:bg-blue-50/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-950">{customer.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{customer.managerName ?? "Unassigned"}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatMoney(customer.total)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatNumber(customer.orderCount)}</td>
                        <td className="px-4 py-3 text-slate-500">{shortDate(customer.lastOrderAt)}</td>
                        <td className="px-4 py-3"><Pill tone={customer.orderCount > 1 ? "green" : "amber"}>{customerNextAction(customer)}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            ) : (
              <EmptyState title="No customer account totals" body="Printavo orders are required before account revenue and repeat-order metrics can be computed." />
            )}
          </Section>

          <Section title="Team pulse" description="Attribution from Printavo manager fields. Treat missing manager data as needs-review.">
            <div className="grid gap-3">
              <MetricCard label="AOV" value={formatMoney(sales.averageOrderValue)} sublabel={`${formatNumber(sales.totalOrders)} total orders`} icon={Target} />
              <MetricCard label="Repeat customers" value={formatNumber(sales.repeatCustomers)} sublabel={formatPercent(sales.repeatCustomerRate)} icon={RefreshCw} tone="green" />
              <MetricCard label="Repeat revenue" value={formatMoney(sales.repeatRevenue, true)} icon={DollarSign} tone="green" />
            </div>
            <div className="mt-4 space-y-2">
              {summary.salesDashboard.managerPerformance?.slice(0, 5).map((manager) => (
                <div key={manager.managerName} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-700">{manager.managerName}</span>
                  <span className="font-semibold text-emerald-700">{formatMoney(manager.revenue)}</span>
                </div>
              ))}
              {!summary.salesDashboard.managerPerformance?.length ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No manager attribution is available.</p> : null}
            </div>
          </Section>
        </div>

        <Section
          title="Sales trend"
          description="Revenue, order, status, and payment metrics computed from synced FraterniTees Printavo rows."
          actions={<Button icon={ShoppingBag} onClick={() => setSalesView("orders")}>View orders</Button>}
        >
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Quoted" value={formatNumber(sales.quotedOrders)} icon={FileText} tone="blue" />
                <MetricCard label="In production" value={formatNumber(sales.inProductionOrders)} icon={Package} tone="amber" />
                <MetricCard label="Completed" value={formatNumber(sales.completedOrders)} icon={CheckCircle2} tone="green" />
                <MetricCard label="Cancelled" value={formatNumber(sales.cancelledOrders)} icon={AlertCircle} tone="slate" />
              </div>
              <div className="mt-5 rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-slate-950">Last 8 weekly buckets</p>
                  <Pill tone="slate">Revenue by order date</Pill>
                </div>
                {series.length ? (
                  <div className="grid h-56 items-end gap-2" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
                    {series.map((item) => (
                      <div key={item.label} className="flex h-full flex-col justify-end gap-2">
                        <div className="rounded-t-md bg-blue-600 transition-all" style={{ height: `${Math.max(4, (item.revenue / maxRevenue) * 100)}%` }} title={`${item.label}: ${formatMoney(item.revenue)}`} />
                        <p className="truncate text-center text-xs text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No period chart data" body="No dated Printavo orders were available for the selected tenant." />
                )}
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-semibold text-slate-950">Status mix</p>
              {summary.salesDashboard.statusBreakdown?.map((item) => (
                <div key={item.bucket} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                  <span className="font-semibold text-slate-700">{labelFromKey(item.bucket)}</span>
                  <Pill tone="blue">{formatNumber(item.count)}</Pill>
                </div>
              ))}
              {summary.salesDashboard.paymentBreakdown?.map((item) => (
                <div key={item.bucket} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                  <span className="font-semibold text-slate-700">{labelFromKey(item.bucket)}</span>
                  <Pill tone="green">{formatNumber(item.count)}</Pill>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    );
  }

  function renderOpportunities() {
    const stages = summary.opportunities.pipelines[0]?.stages ?? [];
    return (
      <Section
        title="Opportunities"
        description="Open sales opportunities are persisted when available; otherwise they are derived from quoted or needs-review Printavo orders and labeled read-only."
        actions={
          <Button icon={Plus} onClick={() => setNotice({ tone: "info", message: "Use the new opportunity form below. It saves to Map App only." })}>
            New opportunity
          </Button>
        }
      >
        <form
          className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.2fr_1fr_140px_170px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            createOpportunityFromForm();
          }}
        >
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Opportunity title" value={newOpportunity.title} onChange={(event) => setNewOpportunity((current) => ({ ...current, title: event.target.value }))} />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Customer or company" value={newOpportunity.customerName} onChange={(event) => setNewOpportunity((current) => ({ ...current, customerName: event.target.value }))} />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Value" value={newOpportunity.value} onChange={(event) => setNewOpportunity((current) => ({ ...current, value: event.target.value }))} />
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={newOpportunity.stageKey} onChange={(event) => setNewOpportunity((current) => ({ ...current, stageKey: event.target.value }))}>
            {stages.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
          </select>
          <Button type="submit" icon={Plus} variant="primary">Create</Button>
        </form>
        {stages.length ? (
          <div className="grid gap-4 xl:grid-cols-4">
            {stages.map((stage) => (
              <div key={stage.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{stage.label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{formatMoney(stage.value)}</p>
                  </div>
                  <Pill tone={stage.count ? "blue" : "slate"}>{stage.count}</Pill>
                </div>
                <div className="mt-3 space-y-3">
                  {stage.opportunities.length ? (
                    stage.opportunities
                      .slice(0, 8)
                      .map((opportunity) => (
                        <OpportunityCard
                          key={opportunity.id}
                          opportunity={opportunity}
                          onStageChange={(stageKey) => updateOpportunityStage(opportunity, stageKey)}
                        />
                      ))
                  ) : (
                    <p className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">No opportunities in this stage.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No opportunities yet" body="No persisted opportunities and no quoted Printavo rows were found." />
        )}
      </Section>
    );
  }

  function renderAccounts() {
    const cleanup = summary.accountCleanup;
    return (
      <div className="space-y-5">
        <Section title="Customer Accounts" description="Top customer accounts computed from synced Printavo order history." actions={<Button icon={RefreshCw} onClick={() => setSalesView("dashboard")}>Back to pulse</Button>}>
          {topCustomers.length ? (
            <TableShell>
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-left">Manager</th>
                    <th className="px-4 py-3 text-left">Last order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {topCustomers.slice(0, 80).map((customer) => (
                    <tr key={`${customer.name}-${customer.lastOrderAt}`} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 font-semibold text-slate-950">{customer.name}</td>
                      <td className="px-4 py-3"><Pill tone="green">{customer.category}</Pill></td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatMoney(customer.total)}</td>
                      <td className="px-4 py-3 text-right">{formatNumber(customer.orderCount)}</td>
                      <td className="px-4 py-3 text-slate-600">{customer.managerName ?? "Unassigned"}</td>
                      <td className="px-4 py-3 text-slate-500">{shortDate(customer.lastOrderAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : (
            <EmptyState title="No customer account totals" body="Printavo orders are required before account revenue and repeat-order metrics can be computed." />
          )}
        </Section>
        <div className="grid gap-5 xl:grid-cols-2">
          <Section
            title="Merge Suggestions"
            description="Non-destructive duplicate candidates. Nothing merges automatically."
          >
            {cleanup.mergeSuggestions.length ? (
              <div className="space-y-3">
                {cleanup.mergeSuggestions.map((suggestion) => (
                  <div key={suggestion.suggestionKey} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{suggestion.names.join(" / ")}</p>
                      <Pill tone="amber">Needs review</Pill>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{formatNumber(suggestion.orderCount)} orders - {formatMoney(suggestion.total)} lifetime order value</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Destructive merge: disabled</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No merge suggestions" body="No duplicate customer-name/account-id clusters were found in the current Printavo mirror." />
            )}
          </Section>
          <Section
            title="Unlinked Orders"
            description="Orders without a customer account link. Review before creating or linking organizations."
          >
            {cleanup.unlinkedOrders.length ? (
              <div className="space-y-3">
                {cleanup.unlinkedOrders.slice(0, 12).map((order) => (
                  <div key={order.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{order.customerName}</p>
                        <p className="mt-1 text-sm text-slate-500">{order.jobName ?? order.orderNumber}</p>
                      </div>
                      <span className="font-semibold text-emerald-700">{formatMoney(order.orderTotal)}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Pill tone="amber">Needs link</Pill>
                      {order.sourceUrl ? <LinkButton href={order.sourceUrl} icon={ExternalLink}>Printavo</LinkButton> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No unlinked orders" body="All visible Printavo mirror rows have customer account links or no orders are available." />
            )}
          </Section>
        </div>
      </div>
    );
  }

  function renderReorders() {
    const buckets: Array<{ key: keyof typeof summary.reorders.buckets; label: string; tone: "red" | "amber" | "blue" | "slate" }> = [
      { key: "overdue", label: "Overdue", tone: "red" },
      { key: "due", label: "Due soon", tone: "amber" },
      { key: "upcoming", label: "Upcoming", tone: "blue" },
      { key: "snoozed", label: "Snoozed", tone: "slate" },
    ];
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Total customers" value={formatNumber(sales.totalCustomers)} icon={Users} />
          <MetricCard label="Repeat" value={formatNumber(sales.repeatCustomers)} sublabel={formatPercent(sales.repeatCustomerRate)} icon={RefreshCw} tone="green" />
          <MetricCard label="Repeat revenue" value={formatMoney(sales.repeatRevenue, true)} icon={DollarSign} tone="green" />
          <MetricCard label="Due" value={formatNumber(sales.dueReorders)} sublabel="configured cycles" icon={Clock3} tone="amber" />
        </div>
        {buckets.map((bucket) => {
          const signals = summary.reorders.buckets[bucket.key];
          return (
            <Section key={bucket.key} title={`${bucket.label} Reorders`} description={`${signals.length} reorder signals in this bucket.`}>
              {signals.length ? (
                <div className="space-y-3">
                  {signals.slice(0, 25).map((signal) => (
                    <div key={signal.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{metadataString(signal.metadata?.["customerName"]) ?? signal.accountId}</p>
                          <Pill tone={bucket.tone}>{bucket.label}</Pill>
                          {signal.metadata?.["derived"] ? <Pill tone="blue">Derived from Printavo</Pill> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Expected {shortDate(signal.expectedReorderDate)}
                          {metadataString(signal.metadata?.["lastOrderName"]) ? ` after ${metadataString(signal.metadata?.["lastOrderName"])}` : ""}
                          {signal.snoozedUntil ? ` - snoozed until ${shortDate(signal.snoozedUntil)}` : ""}
                          {signal.lastActionAt ? ` - last action ${shortDate(signal.lastActionAt)}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button icon={Mail} onClick={() => createDraft(signal)}>Reach out</Button>
                        <Button icon={Clock3} onClick={() => snoozeReorder(signal)}>Snooze</Button>
                        <Button icon={Plus} onClick={() => addOpportunityFromSignal(signal)}>Add opportunity</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={`No ${bucket.label.toLowerCase()} signals`} body="This bucket is empty based on the tenant's reorder cycle configuration." />
              )}
            </Section>
          );
        })}
      </div>
    );
  }

  function renderGoals() {
    const goals = summary.managerGoals.goals;
    function updateGoal(managerName: string, key: keyof Pick<ManagerGoal, "revenueGoal" | "ordersGoal" | "storesGoal">, value: string) {
      setGoalDrafts((current) => ({
        ...current,
        [managerName]: {
          revenueGoal: current[managerName]?.revenueGoal ?? "0",
          ordersGoal: current[managerName]?.ordersGoal ?? "0",
          storesGoal: current[managerName]?.storesGoal ?? "0",
          [key]: value,
        },
      }));
    }
    return (
      <Section
        title="Manager Performance Targets"
        description={`Goals save per month in product-owned tenant dashboard storage. Current period: ${summary.managerGoals.period}.`}
        actions={
          <>
            <Button icon={RefreshCw} onClick={() => setGoalDrafts(Object.fromEntries(goals.map((goal) => [goal.managerName, { revenueGoal: "0", ordersGoal: "0", storesGoal: "0" }])))}>
              Reset draft
            </Button>
            <Button icon={CheckCircle2} variant="primary" onClick={saveManagerGoals}>Save goals</Button>
          </>
        }
      >
        {goals.length ? (
          <TableShell>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Manager</th>
                  <th className="px-4 py-3 text-right">Actual revenue</th>
                  <th className="px-4 py-3 text-right">Actual orders</th>
                  <th className="px-4 py-3 text-right">Revenue goal</th>
                  <th className="px-4 py-3 text-right">Orders goal</th>
                  <th className="px-4 py-3 text-right">Stores goal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goals.map((goal) => {
                  const draftValues = goalDrafts[goal.managerName] ?? {
                    revenueGoal: String(goal.revenueGoal ?? 0),
                    ordersGoal: String(goal.ordersGoal ?? 0),
                    storesGoal: String(goal.storesGoal ?? 0),
                  };
                  return (
                  <tr key={goal.managerName}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{goal.managerName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatMoney(goal.actualRevenue)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(goal.actualOrders)}</td>
                    <td className="px-4 py-3 text-right">
                      <input className="w-32 rounded-md border border-slate-200 px-3 py-2 text-right text-sm" inputMode="decimal" value={draftValues.revenueGoal} onChange={(event) => updateGoal(goal.managerName, "revenueGoal", event.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input className="w-24 rounded-md border border-slate-200 px-3 py-2 text-right text-sm" inputMode="numeric" value={draftValues.ordersGoal} onChange={(event) => updateGoal(goal.managerName, "ordersGoal", event.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input className="w-24 rounded-md border border-slate-200 px-3 py-2 text-right text-sm" inputMode="numeric" value={draftValues.storesGoal} onChange={(event) => updateGoal(goal.managerName, "storesGoal", event.target.value)} />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </TableShell>
        ) : (
          <EmptyState title="No manager actuals" body="Printavo manager fields are not currently available for this tenant's synced orders." />
        )}
      </Section>
    );
  }

  function renderOrders() {
    const managerOptions = Array.from(new Set(orders.map((order) => order.managerName ?? "Unassigned"))).sort();
    const teamOptions = Array.from(new Set(orders.map((order) => order.teamName ?? "Unassigned"))).sort();
    const filteredOrders = orders.filter((order) => {
      const query = orderFilters.q.trim().toLowerCase();
      const matchesQuery = query
        ? [order.customerName, order.jobName, order.orderNumber].filter(Boolean).join(" ").toLowerCase().includes(query)
        : true;
      const matchesStatus = orderFilters.statusBucket === "all" || order.statusBucket === orderFilters.statusBucket;
      const matchesPayment = orderFilters.paymentBucket === "all" || order.paymentBucket === orderFilters.paymentBucket;
      const matchesManager = orderFilters.managerName === "all" || (order.managerName ?? "Unassigned") === orderFilters.managerName;
      const matchesTeam = orderFilters.teamName === "all" || (order.teamName ?? "Unassigned") === orderFilters.teamName;
      const matchesSync =
        orderFilters.syncState === "all" ||
        (orderFilters.syncState === "synced" ? order.sourcePayloadAvailable : !order.sourcePayloadAvailable);
      return matchesQuery && matchesStatus && matchesPayment && matchesManager && matchesTeam && matchesSync;
    });
    const orderCounts = {
      all: orders.length,
      processed: orders.filter((order) => order.statusBucket === "completed").length,
      unprocessed: orders.filter((order) => order.statusBucket !== "completed" && order.statusBucket !== "cancelled").length,
      paid: orders.filter((order) => order.paymentBucket === "paid").length,
      unpaid: orders.filter((order) => order.paymentBucket === "unpaid").length,
      synced: orders.filter((order) => order.sourcePayloadAvailable).length,
      unsynced: orders.filter((order) => !order.sourcePayloadAvailable).length,
    };
    return (
      <Section
        title="Orders"
        description={`${formatNumber(summary.orders.pagination.total)} Printavo orders available. The cockpit filters the latest ${formatNumber(summary.orders.orders.length)} rows without writing back to Printavo.`}
        actions={
          <>
            <input
              className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Saved view name"
              value={savedViewName}
              onChange={(event) => setSavedViewName(event.target.value)}
            />
            <Button icon={SlidersHorizontal} onClick={saveOrderView}>Save view</Button>
          </>
        }
      >
        <div className="mb-4 grid gap-3 xl:grid-cols-[1.4fr_repeat(5,minmax(150px,1fr))]">
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              placeholder="Search customer, job, or order"
              value={orderFilters.q}
              onChange={(event) => setOrderFilters((current) => ({ ...current, q: event.target.value }))}
            />
          </label>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={orderFilters.statusBucket} onChange={(event) => setOrderFilters((current) => ({ ...current, statusBucket: event.target.value }))}>
            <option value="all">All statuses</option>
            {summary.orders.facets.statusBuckets.map((item) => <option key={item.name} value={item.name}>{labelFromKey(item.name)}</option>)}
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={orderFilters.paymentBucket} onChange={(event) => setOrderFilters((current) => ({ ...current, paymentBucket: event.target.value }))}>
            <option value="all">All payment</option>
            {summary.orders.facets.paymentBuckets.map((item) => <option key={item.name} value={item.name}>{labelFromKey(item.name)}</option>)}
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={orderFilters.managerName} onChange={(event) => setOrderFilters((current) => ({ ...current, managerName: event.target.value }))}>
            <option value="all">All managers</option>
            {managerOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={orderFilters.teamName} onChange={(event) => setOrderFilters((current) => ({ ...current, teamName: event.target.value }))}>
            <option value="all">All teams</option>
            {teamOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={orderFilters.syncState} onChange={(event) => setOrderFilters((current) => ({ ...current, syncState: event.target.value }))}>
            <option value="all">All sync states</option>
            <option value="synced">Synced payload</option>
            <option value="unsynced">Needs payload review</option>
          </select>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(orderCounts).map(([key, count]) => (
            <button
              key={key}
              type="button"
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50"
              onClick={() => {
                if (key === "all") setOrderFilters((current) => ({ ...current, statusBucket: "all", paymentBucket: "all", syncState: "all" }));
                if (key === "processed") setOrderFilters((current) => ({ ...current, statusBucket: "completed" }));
                if (key === "unprocessed") setOrderFilters((current) => ({ ...current, statusBucket: "needs_review" }));
                if (key === "paid") setOrderFilters((current) => ({ ...current, paymentBucket: "paid" }));
                if (key === "unpaid") setOrderFilters((current) => ({ ...current, paymentBucket: "unpaid" }));
                if (key === "synced" || key === "unsynced") setOrderFilters((current) => ({ ...current, syncState: key }));
              }}
            >
              {labelFromKey(key)} {formatNumber(count)}
            </button>
          ))}
          {savedViews.map((view) => (
            <button key={view.id} type="button" onClick={() => applySavedView(view)} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
              {view.name}
            </button>
          ))}
        </div>
        {filteredOrders.length ? (
          <TableShell>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Job</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Manager</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-semibold text-slate-950">{order.customerName}</td>
                    <td className="max-w-md px-4 py-3 text-slate-700">{order.jobName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatMoney(order.orderTotal)}</td>
                    <td className="px-4 py-3"><Pill tone={order.statusBucket === "cancelled" ? "red" : order.statusBucket === "completed" ? "green" : "blue"}>{order.status ?? "Unknown"}</Pill></td>
                    <td className="px-4 py-3"><Pill tone={order.paymentBucket === "paid" ? "green" : "amber"}>{order.paymentStatus ?? "Unknown"}</Pill></td>
                    <td className="px-4 py-3 text-slate-600">{order.managerName ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-slate-500">{shortDate(order.orderCreatedAt ?? order.productionDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button icon={Eye} onClick={() => setSelectedOrder(order)}>Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        ) : (
          <EmptyState title="No matching orders" body="No synced Printavo rows match the current cockpit filters. Clear the filters or save this view for later review." />
        )}
      </Section>
    );
  }

  function renderSocialDashboard() {
    return (
      <div className="space-y-5">
        <Section
          title="Social Monitor"
          description="Owned and watched social accounts, posts, alerts, messages, and calendar surfaces. Meta actions unlock when the connector, scopes, owned account IDs, and feature flags line up."
          actions={
            <>
              <Button icon={Send} onClick={() => setComposerOpen(true)} disabled={!socialAccounts.length}>Compose draft</Button>
              <Button icon={RefreshCw} onClick={() => runAction("Scan social accounts", `${apiBase}/social/accounts/scan`, { method: "POST" })}>Scan accounts</Button>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Tracked accounts" value={formatNumber(socialMetrics.trackedAccounts)} sublabel={`${formatNumber(socialMetrics.activeAccounts)} active`} icon={Users} />
            <MetricCard label="Posts" value={formatNumber(socialMetrics.totalPosts)} sublabel={`${formatNumber(socialMetrics.newPosts)} recent`} icon={FileText} />
            <MetricCard label="Unread alerts" value={formatNumber(socialMetrics.unreadAlerts)} icon={Bell} tone="amber" />
            <MetricCard label="Engagement" value={formatNumber(socialMetrics.totalEngagement)} sublabel="Likes + comments + shares" icon={Heart} tone="green" />
          </div>
        </Section>
        <MetaConnectionPanel connection={socialConnection} orgSlug={orgSlug} />
        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Recent Alerts" actions={<Button icon={Bell} onClick={() => setSocialView("alerts")}>View all</Button>}>
            {alerts.length ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{alert.title}</p>
                      <Pill tone={alert.status === "unread" ? "amber" : "slate"}>{alert.status}</Pill>
                    </div>
                    {alert.body ? <p className="mt-2 line-clamp-2 text-sm text-slate-500">{alert.body}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No actionable social alerts" body="No alert instances match this tenant's configured actionable social alert rules." />
            )}
          </Section>
          <Section title="Coverage Breakdown">
            {summary.socialDashboard.coverageBreakdown.length ? (
              <div className="space-y-3">
                {summary.socialDashboard.coverageBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                    <span className="font-semibold text-slate-700">{labelFromKey(item.category)}</span>
                    <Pill tone="blue">{formatNumber(item.count)}</Pill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No coverage categories" body="Add owned or watched accounts and assign tenant-defined categories to populate coverage." />
            )}
          </Section>
        </div>
      </div>
    );
  }

  function renderSocialAccounts() {
    const platformOptions = Array.from(new Set(socialAccounts.map((account) => account.platform))).sort();
    const categoryOptions = Array.from(new Set(socialAccounts.map((account) => account.category ?? "Unmapped"))).sort();
    const filteredAccounts = socialAccounts.filter((account) => {
      const query = accountFilters.q.trim().toLowerCase();
      const matchesQuery = query
        ? [account.displayName, account.handle].filter(Boolean).join(" ").toLowerCase().includes(query)
        : true;
      const matchesPlatform = accountFilters.platform === "all" || account.platform === accountFilters.platform;
      const matchesCategory = accountFilters.category === "all" || (account.category ?? "Unmapped") === accountFilters.category;
      const matchesOwnership = accountFilters.ownership === "all" || account.ownership === accountFilters.ownership;
      const matchesStatus = accountFilters.status === "all" || account.status === accountFilters.status;
      return matchesQuery && matchesPlatform && matchesCategory && matchesOwnership && matchesStatus;
    });
    return (
      <Section
        title="Tracked Accounts"
        description="Owned accounts can publish or reply after Meta authorization; watched accounts are monitored and mapped to customers or organizations."
        actions={
          <>
            <Button icon={Instagram} variant="primary" onClick={() => { window.location.href = `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/connectors/meta/oauth/start?mode=${encodeURIComponent(socialConnection.preferredMode)}`; }}>Connect Instagram</Button>
            <Button icon={Plus} onClick={() => setSocialView("import")}>Add account</Button>
          </>
        }
      >
        <div className="mb-4 grid gap-3 xl:grid-cols-[1.4fr_repeat(4,minmax(150px,1fr))]">
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search accounts" value={accountFilters.q} onChange={(event) => setAccountFilters((current) => ({ ...current, q: event.target.value }))} />
          </label>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={accountFilters.platform} onChange={(event) => setAccountFilters((current) => ({ ...current, platform: event.target.value }))}>
            <option value="all">All platforms</option>
            {platformOptions.map((item) => <option key={item} value={item}>{labelFromKey(item)}</option>)}
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={accountFilters.category} onChange={(event) => setAccountFilters((current) => ({ ...current, category: event.target.value }))}>
            <option value="all">All categories</option>
            {categoryOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={accountFilters.ownership} onChange={(event) => setAccountFilters((current) => ({ ...current, ownership: event.target.value }))}>
            <option value="all">All ownership</option>
            <option value="owned">Owned</option>
            <option value="watched">Watched</option>
            <option value="tracked">Tracked</option>
          </select>
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold" value={accountFilters.status} onChange={(event) => setAccountFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="needs_review">Needs review</option>
          </select>
        </div>
        {filteredAccounts.length ? (
          <TableShell>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">Platform</th>
                  <th className="px-4 py-3 text-left">Ownership</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-right">Followers</th>
                  <th className="px-4 py-3 text-left">Last synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="cursor-pointer hover:bg-blue-50/40"
                    onClick={() => {
                      setSelectedSocialAccountId(account.id);
                      setSocialView("account-detail");
                    }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{account.displayName ?? account.handle}</p>
                      <p className="text-sm text-slate-500">@{account.handle}</p>
                    </td>
                    <td className="px-4 py-3"><Pill tone="pink">{labelFromKey(account.platform)}</Pill></td>
                    <td className="px-4 py-3"><Pill tone={account.ownership === "owned" ? "green" : "blue"}>{labelFromKey(account.ownership)}</Pill></td>
                    <td className="px-4 py-3"><Pill tone="slate">{account.category ?? "Unmapped"}</Pill></td>
                    <td className="px-4 py-3"><Pill tone={account.priority === "high" ? "red" : account.priority === "medium" ? "amber" : "slate"}>{account.priority ?? "Unscored"}</Pill></td>
                    <td className="px-4 py-3 text-right">{formatNumber(account.followerCount)}</td>
                    <td className="px-4 py-3 text-slate-500">{shortDate(account.lastSyncedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        ) : (
          <EmptyState title="No matching social accounts" body="No owned or watched account matches the current filters." action={<Button icon={Plus} onClick={() => setSocialView("import")}>Add first account</Button>} />
        )}
      </Section>
    );
  }

  function renderSocialAccountDetail() {
    if (!selectedSocialAccount) {
      return <EmptyState title="Select a social account" body="No owned or watched social account is currently selected." action={<Button icon={Plus} onClick={() => setSocialView("import")}>Add account</Button>} />;
    }
    const managedVia = metadataString(selectedSocialAccount.metadata?.managedVia);
    return (
      <div className="space-y-5">
        <Section
          title={selectedSocialAccount.displayName ?? selectedSocialAccount.handle}
          description={`@${selectedSocialAccount.handle}`}
          actions={
            <>
              {selectedSocialAccount.profileUrl ? <Button icon={ExternalLink} onClick={() => window.open(selectedSocialAccount.profileUrl ?? "", "_blank", "noopener,noreferrer")}>Profile</Button> : null}
              <Button icon={Send} onClick={() => {
                setComposerDraft((current) => ({ ...current, socialAccountId: selectedSocialAccount.id }));
                setComposerOpen(true);
              }}>
                Compose draft
              </Button>
              <Button icon={RefreshCw} onClick={() => runAction("Scan social accounts", `${apiBase}/social/accounts/scan`, { method: "POST" })}>Sync</Button>
            </>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Pill tone="pink">{labelFromKey(selectedSocialAccount.platform)}</Pill>
                <Pill tone={selectedSocialAccount.ownership === "owned" ? "green" : "blue"}>{labelFromKey(selectedSocialAccount.ownership)}</Pill>
                <Pill tone="amber">{selectedSocialAccount.priority ?? "Unscored priority"}</Pill>
                <DataSourceBadge source={selectedSocialAccount.source} metadata={selectedSocialAccount.metadata} />
              </div>
              {managedVia ? <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">Managed via {managedVia}</p> : null}
              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard label="Followers" value={formatNumber(selectedSocialAccount.followerCount)} icon={Users} />
                <MetricCard label="Posts" value={formatNumber(selectedAccountPosts.length)} icon={FileText} />
                <MetricCard label="Avg engagement" value={formatNumber(selectedAccountPosts.reduce((sum, post) => sum + metricValue(post.metrics, "engagementRate"), 0) / Math.max(1, selectedAccountPosts.length), 2)} icon={Heart} tone="green" />
                <MetricCard label="Last synced" value={<span className="text-base">{shortDate(selectedSocialAccount.lastSyncedAt)}</span>} icon={Clock3} tone="slate" />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="font-semibold text-slate-950">Organization mapping</p>
              <div className="mt-3 grid gap-3 text-sm">
                <label className="grid gap-1">
                  <span className="font-semibold text-slate-500">Category</span>
                  <select className="rounded-md border border-slate-200 px-3 py-2" value={selectedSocialAccount.category ?? ""} onChange={(event) => patchSocialAccount(selectedSocialAccount.id, { category: event.target.value || null })}>
                    <option value="">Unmapped</option>
                    <option value="partner">Partner</option>
                    <option value="athlete">Athlete</option>
                    <option value="school">School</option>
                    <option value="greek">Greek</option>
                    <option value="competitor">Competitor</option>
                    <option value="media">Media</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-slate-500">Priority</span>
                  <select className="rounded-md border border-slate-200 px-3 py-2" value={selectedSocialAccount.priority ?? ""} onChange={(event) => patchSocialAccount(selectedSocialAccount.id, { priority: event.target.value || null })}>
                    <option value="">Unscored</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-slate-500">Ownership</span>
                  <select className="rounded-md border border-slate-200 px-3 py-2" value={selectedSocialAccount.ownership} onChange={(event) => patchSocialAccount(selectedSocialAccount.id, { ownership: event.target.value })}>
                    <option value="owned">Owned</option>
                    <option value="watched">Watched</option>
                    <option value="tracked">Tracked</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-slate-500">School/org key</span>
                  <input
                    className="rounded-md border border-slate-200 px-3 py-2"
                    defaultValue={selectedSocialAccount.schoolOrOrgKey ?? ""}
                    placeholder="illinois, alpha-phi, local-business"
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value !== (selectedSocialAccount.schoolOrOrgKey ?? "")) {
                        void patchSocialAccount(selectedSocialAccount.id, { schoolOrOrgKey: value || null });
                      }
                    }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-slate-500">Customer/account ID</span>
                  <input
                    className="rounded-md border border-slate-200 px-3 py-2"
                    defaultValue={selectedSocialAccount.accountId ?? ""}
                    placeholder="Paste linked customer/account UUID"
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value !== (selectedSocialAccount.accountId ?? "")) {
                        void patchSocialAccount(selectedSocialAccount.id, { accountId: value || null });
                      }
                    }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-semibold text-slate-500">Contact ID</span>
                  <input
                    className="rounded-md border border-slate-200 px-3 py-2"
                    defaultValue={selectedSocialAccount.contactId ?? ""}
                    placeholder="Optional linked contact UUID"
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value !== (selectedSocialAccount.contactId ?? "")) {
                        void patchSocialAccount(selectedSocialAccount.id, { contactId: value || null });
                      }
                    }}
                  />
                </label>
                <p className="rounded-md bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                  These links are non-destructive. Changing them updates this social account row only; it does not merge customers, contacts, or organizations.
                </p>
              </div>
            </div>
          </div>
        </Section>
        {renderPosts(selectedAccountPosts)}
      </div>
    );
  }

  function renderPosts(inputPosts = socialPosts) {
    const filteredPosts = inputPosts.filter((post) => postTypeFilter === "all" || post.postType === postTypeFilter || post.status === postTypeFilter);
    const postTypes = Array.from(new Set(inputPosts.flatMap((post) => [post.postType, post.status]).filter(Boolean))).sort();
    return (
      <Section
        title="Posts"
        description="Synced posts, reels, stories, and draft content with available metrics. Missing metrics indicate provider permissions or manual-import limitations."
        actions={<Button icon={Send} onClick={() => setComposerOpen(true)} disabled={!socialAccounts.length}>Compose draft</Button>}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setPostTypeFilter("all")} className={cx("rounded-md border px-3 py-1.5 text-xs font-semibold", postTypeFilter === "all" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600")}>All {formatNumber(inputPosts.length)}</button>
          {postTypes.map((type) => (
            <button key={type} type="button" onClick={() => setPostTypeFilter(type)} className={cx("rounded-md border px-3 py-1.5 text-xs font-semibold", postTypeFilter === type ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600")}>
              {labelFromKey(type)} {formatNumber(inputPosts.filter((post) => post.postType === type || post.status === type).length)}
            </button>
          ))}
        </div>
        {filteredPosts.length ? (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div key={post.id} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  {post.mediaUrl ? <img src={post.mediaUrl} alt={post.caption ? `Post media: ${post.caption.slice(0, 80)}` : "Social post media"} className="h-full w-full rounded-md object-cover" /> : <FileText className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone="blue">{labelFromKey(post.postType)}</Pill>
                    <Pill tone={post.status === "published" ? "green" : "amber"}>{labelFromKey(post.status)}</Pill>
                    <DataSourceBadge metadata={post.metadata} />
                  </div>
                  <p className="mt-2 line-clamp-2 font-medium text-slate-800">{post.caption || "No caption synced"}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> {formatNumber(metricValue(post.metrics, "likes"))}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {formatNumber(metricValue(post.metrics, "comments"))}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {formatNumber(metricValue(post.metrics, "views"))}</span>
                    <span>{shortDate(post.publishedAt ?? post.scheduledFor)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.permalink ? <Button icon={ExternalLink} onClick={() => window.open(post.permalink ?? "", "_blank", "noopener,noreferrer")}>Open</Button> : null}
                  {post.status !== "published" ? (
                    <Button
                      icon={Send}
                      disabled={!socialConnection.capabilities.publishPosts}
                      title={socialConnection.capabilities.publishPosts ? "Publish through the connected owned Instagram account." : "Meta publishing requires connector token, publishing scope, feature flag, owned account ID, and a public media URL."}
                      onClick={() => runAction("Publish to Instagram", `${apiBase}/social/posts/${post.id}/publish`, { method: "POST" })}
                    >
                      Publish
                    </Button>
                  ) : null}
                  <Button icon={Eye} onClick={() => setSelectedPost(post)}>Insights</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No matching social posts" body="No post, reel, story, or draft content matches the selected post filter." />
        )}
      </Section>
    );
  }

  function renderAlerts() {
    const eventTypes = Array.from(new Set(alerts.map((alert) => alert.eventType))).sort();
    const filteredAlerts = alerts.filter((alert) => {
      if (alertStatusFilter === "all") return true;
      if (alertStatusFilter === "unread" || alertStatusFilter === "read" || alertStatusFilter === "resolved") {
        return alert.status === alertStatusFilter;
      }
      return alert.eventType === alertStatusFilter;
    });
    return (
      <Section
        title="Alerts"
        description="Actionable social alerts are generated from tenant-configured alert rules. Demo or metadata-derived candidates are labeled."
        actions={<Button icon={CheckCircle2} onClick={() => runAction("Mark all alerts read", `${apiBase}/social/alerts/mark-all-read`, { method: "POST" })}>Mark all read</Button>}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {["unread", "all", "read", "resolved"].map((status) => (
            <button key={status} type="button" onClick={() => setAlertStatusFilter(status)} className={cx("rounded-md border px-3 py-1.5 text-xs font-semibold", alertStatusFilter === status ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600")}>
              {labelFromKey(status)}
            </button>
          ))}
          {eventTypes.map((type) => (
            <button key={type} type="button" onClick={() => setAlertStatusFilter(type)} className={cx("rounded-md border px-3 py-1.5 text-xs font-semibold", alertStatusFilter === type ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600")}>
              {labelFromKey(type)}
            </button>
          ))}
        </div>
        {filteredAlerts.length ? (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={alert.eventType === "engagement_spike" ? "amber" : "blue"}>{labelFromKey(alert.eventType)}</Pill>
                    <Pill tone={alert.status === "unread" ? "blue" : "slate"}>{labelFromKey(alert.status)}</Pill>
                    {String(alert.id).startsWith("local-") ? <Pill tone="amber">Metadata candidate</Pill> : null}
                  </div>
                  <p className="mt-2 font-semibold text-slate-950">{alert.title}</p>
                  {alert.body ? <p className="mt-1 line-clamp-2 text-sm text-slate-500">{alert.body}</p> : null}
                </div>
                <Button icon={Eye} disabled={String(alert.id).startsWith("local-")} title={String(alert.id).startsWith("local-") ? "Metadata candidates are not persisted alerts." : undefined} onClick={() => runAction("Mark alert read", `${apiBase}/social/alerts/${alert.id}`, { method: "PATCH", body: JSON.stringify({ status: "read" }) })}>Mark read</Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No matching alerts" body="No persisted alerts or metadata alert candidates match the selected filter." />
        )}
      </Section>
    );
  }

  function renderCalendar() {
    const calendarItems = socialPosts
      .map((post) => ({ post, date: post.scheduledFor ?? post.publishedAt }))
      .filter((item): item is { post: SocialPost; date: string } => Boolean(item.date))
      .sort((left, right) => left.date.localeCompare(right.date));
    return (
      <Section title="Content Calendar" description="Calendar tracks scheduled, draft, and published content. Publish actions stay gated by owned-account Meta authorization.">
        {calendarItems.length ? (
          <div className="space-y-3">
            {calendarItems.map(({ post, date }) => (
              <div key={post.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{shortDate(date)}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.caption || "No caption synced"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill tone={post.status === "published" ? "green" : "amber"}>{labelFromKey(post.status)}</Pill>
                  <Button icon={Eye} onClick={() => setSelectedPost(post)}>Insights</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No calendar items" body="No scheduled or published social posts have dates available yet." />
        )}
      </Section>
    );
  }

  function renderConversations() {
    return (
      <Section title="Messages and Comments" description="Instagram messages/comments can be mapped to customers, contacts, organizations, and opportunities. Replies require live platform authorization.">
        <form
          className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[180px_160px_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newThread.participantHandle.trim()) {
              setNotice({ tone: "error", message: "Participant handle is required." });
              return;
            }
            runAction("Log social thread", `${apiBase}/social/threads`, {
              method: "POST",
              body: JSON.stringify({
                platform: "instagram",
                threadType: newThread.threadType,
                participantHandle: newThread.participantHandle.replace(/^@/, ""),
                summary: newThread.summary,
              }),
            });
          }}
        >
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="@handle"
            value={newThread.participantHandle}
            onChange={(event) => setNewThread((current) => ({ ...current, participantHandle: event.target.value }))}
          />
          <select
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            value={newThread.threadType}
            onChange={(event) => setNewThread((current) => ({ ...current, threadType: event.target.value }))}
          >
            <option value="dm">DM</option>
            <option value="comment">Comment</option>
            <option value="mention">Mention</option>
            <option value="manual">Manual note</option>
          </select>
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Summary, request, or mapping note"
            value={newThread.summary}
            onChange={(event) => setNewThread((current) => ({ ...current, summary: event.target.value }))}
          />
          <Button type="submit" icon={Plus} variant="primary">Log thread</Button>
        </form>
        {socialThreads.length ? (
          <div className="space-y-3">
            {socialThreads.map((thread) => (
              <div key={thread.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">@{thread.participantHandle ?? "unknown"}</p>
                    <p className="mt-1 text-sm text-slate-500">{labelFromKey(thread.platform)} {labelFromKey(thread.threadType)} - {shortDate(thread.lastMessageAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={thread.accountId ? "green" : "amber"}>{thread.accountId ? "Customer linked" : "Needs mapping"}</Pill>
                    <Button icon={Link2} onClick={() => setModuleView("admin")}>Map</Button>
                  </div>
                </div>
                {thread.metadata?.summary ? <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{String(thread.metadata.summary)}</p> : null}
                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Reply through connected Instagram account"
                    value={threadReplies[thread.id] ?? ""}
                    onChange={(event) => setThreadReplies((current) => ({ ...current, [thread.id]: event.target.value }))}
                  />
                  <Button
                    icon={Send}
                    disabled={!socialConnection.capabilities.replyToMessages || !threadReplies[thread.id]?.trim()}
                    title={socialConnection.capabilities.replyToMessages ? "Send through Meta Graph API." : "Messages require Meta token, message scope, feature flag, owned account, and Instagram recipient ID."}
                    onClick={() => sendThreadReply(thread)}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No message or comment threads" body="No Instagram DM/comment threads are synced or manually logged yet. Add a thread manually after tenant session login or connect Meta permissions." />
        )}
      </Section>
    );
  }

  function renderCampaigns() {
    return (
      <Section title="Campaign Planning" description="Tenant campaigns group posts, target organizations, assets, and sales outcomes." actions={<Button icon={Plus} onClick={() => setNotice({ tone: "info", message: "Fill the campaign form below to create a persisted campaign." })}>New campaign</Button>}>
        <form
          className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newCampaign.name.trim()) {
              setNotice({ tone: "error", message: "Campaign name is required." });
              return;
            }
            runAction("Create campaign", `${apiBase}/social/campaigns`, { method: "POST", body: JSON.stringify(newCampaign) });
          }}
        >
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Campaign name" value={newCampaign.name} onChange={(event) => setNewCampaign((current) => ({ ...current, name: event.target.value }))} />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Type" value={newCampaign.campaignType} onChange={(event) => setNewCampaign((current) => ({ ...current, campaignType: event.target.value }))} />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" type="date" value={newCampaign.startsOn} onChange={(event) => setNewCampaign((current) => ({ ...current, startsOn: event.target.value }))} />
          <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" type="date" value={newCampaign.endsOn} onChange={(event) => setNewCampaign((current) => ({ ...current, endsOn: event.target.value }))} />
          <Button type="submit" icon={Plus} variant="primary">Create</Button>
        </form>
        {campaigns.length ? (
          <TableShell>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Dates</th>
                  <th className="px-4 py-3 text-left">Goal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-semibold text-slate-950">{campaign.name}</td>
                    <td className="px-4 py-3"><Pill tone="blue">{labelFromKey(campaign.campaignType)}</Pill></td>
                    <td className="px-4 py-3"><Pill tone={campaign.status === "active" ? "green" : "amber"}>{labelFromKey(campaign.status)}</Pill></td>
                    <td className="px-4 py-3 text-slate-600">{shortDate(campaign.startsOn)} - {shortDate(campaign.endsOn)}</td>
                    <td className="px-4 py-3 text-slate-600">{campaign.goal ?? "No goal set"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        ) : (
          <EmptyState title="No campaigns yet" body="No campaigns are currently persisted for this tenant. Creating one above writes to the tenant-scoped campaign table." />
        )}
      </Section>
    );
  }

  function renderImport() {
    return (
      <Section title="Import and Account Setup" description="Use manual import for watched accounts or scan connected Meta accounts after authorization. All rows remain tenant-scoped.">
        <div className="grid gap-5 lg:grid-cols-2">
          <form
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void addSocialAccount();
            }}
          >
            <h3 className="font-semibold text-slate-950">Watchlist or owned account import</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Watched handles can be tracked without ownership. Owned accounts can include Instagram user/Page IDs now so Meta sync and publishing work as soon as the connector is authorized.</p>
            <div className="mt-4 grid gap-3">
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="@handle" value={newSocialAccount.handle} onChange={(event) => setNewSocialAccount((current) => ({ ...current, handle: event.target.value }))} />
              <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={newSocialAccount.platform} onChange={(event) => setNewSocialAccount((current) => ({ ...current, platform: event.target.value }))}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="x">X / Twitter</option>
              </select>
              <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={newSocialAccount.ownership} onChange={(event) => setNewSocialAccount((current) => ({ ...current, ownership: event.target.value }))}>
                <option value="watched">Watched</option>
                <option value="owned">Owned</option>
              </select>
              <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={newSocialAccount.priority} onChange={(event) => setNewSocialAccount((current) => ({ ...current, priority: event.target.value }))}>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Category, e.g. greek, school, athlete, competitor" value={newSocialAccount.category} onChange={(event) => setNewSocialAccount((current) => ({ ...current, category: event.target.value }))} />
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Instagram user ID for owned accounts" value={newSocialAccount.externalAccountId} onChange={(event) => setNewSocialAccount((current) => ({ ...current, externalAccountId: event.target.value }))} />
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Meta Page ID if Page-linked" value={newSocialAccount.metaPageId} onChange={(event) => setNewSocialAccount((current) => ({ ...current, metaPageId: event.target.value }))} />
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Meta Business ID" value={newSocialAccount.metaBusinessId} onChange={(event) => setNewSocialAccount((current) => ({ ...current, metaBusinessId: event.target.value }))} />
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Profile URL" value={newSocialAccount.profileUrl} onChange={(event) => setNewSocialAccount((current) => ({ ...current, profileUrl: event.target.value }))} />
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" inputMode="numeric" placeholder="Follower count" value={newSocialAccount.followerCount} onChange={(event) => setNewSocialAccount((current) => ({ ...current, followerCount: event.target.value }))} />
              <Button type="submit" icon={Plus} variant="primary">Add account</Button>
            </div>
          </form>
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">Connected account scan</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Scan uses the tenant's Meta connector when a token and required scopes are present. Watched-account API enrichment is kept separate from owned-account discovery because Meta limits arbitrary public profile access.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={Instagram} variant="primary" onClick={() => { window.location.href = `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/connectors/meta/oauth/start?mode=${encodeURIComponent(socialConnection.preferredMode)}`; }}>Connect Instagram</Button>
              <Button icon={RefreshCw} onClick={() => runAction("Scan social accounts", `${apiBase}/social/accounts/scan`, { method: "POST" })}>Scan Meta accounts</Button>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  function renderIdentitySuggestions() {
    const suggestions = summary.identity.suggestions;
    async function updateSuggestion(suggestion: IdentitySuggestion, status: "approved" | "rejected") {
      await runAction(
        `${status === "approved" ? "Approve" : "Reject"} identity suggestion`,
        `${apiBase}/identity-resolution/${suggestion.id}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
    }

    return (
      <Section
        title="Identity Resolution"
        description="Non-destructive suggestions for linking Instagram accounts, messages, comments, customers, contacts, organizations, and opportunities. Approval never merges records or writes back to Printavo."
      >
        {suggestions.length ? (
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const sourceRef = suggestion.sourceRef && typeof suggestion.sourceRef === "object" ? suggestion.sourceRef as Record<string, unknown> : {};
              const targetName = metadataString(suggestion.metadata?.targetName) ?? suggestion.targetId ?? "Unlinked target";
              return (
                <div key={suggestion.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone={suggestion.status === "suggested" ? "amber" : suggestion.status === "approved" ? "green" : "slate"}>{labelFromKey(suggestion.status)}</Pill>
                        <Pill tone="blue">{Math.round((suggestion.confidence ?? 0) * 100)}% confidence</Pill>
                        {isFixtureValue(suggestion.metadata) ? <Pill tone="amber">Demo fixture</Pill> : null}
                      </div>
                      <p className="mt-2 font-semibold text-slate-950">
                        {labelFromKey(suggestion.sourceType)} {sourceRef.handle ? `@${String(sourceRef.handle)}` : ""}{" -> "}{labelFromKey(suggestion.targetType)} {targetName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{suggestion.reason ?? "No reason recorded."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        icon={CheckCircle2}
                        disabled={suggestion.status === "approved" || isFixtureValue(suggestion.metadata)}
                        title={isFixtureValue(suggestion.metadata) ? "Demo fixture suggestions cannot be persisted." : undefined}
                        onClick={() => updateSuggestion(suggestion, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        icon={X}
                        variant="danger"
                        disabled={suggestion.status === "rejected" || isFixtureValue(suggestion.metadata)}
                        title={isFixtureValue(suggestion.metadata) ? "Demo fixture suggestions cannot be persisted." : undefined}
                        onClick={() => updateSuggestion(suggestion, "rejected")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No identity suggestions yet"
            body="Once social accounts, messages, comments, or watched handles exist, this surface will show tenant-scoped suggestions for linking them to customers or organizations."
          />
        )}
      </Section>
    );
  }

  function renderAdmin() {
    return (
      <div className="space-y-5">
        <Section title="Tenant Setup Guide" description="Use this checklist before treating FraterniTees or a new Screenprinting tenant as configured. Each item below has a matching editor or review queue on this page.">
          <div className="grid gap-3 lg:grid-cols-3">
            <SupportTile
              title="1. Connect providers"
              detail="Save Printavo read-only credentials, then add Meta auth mode, app/business IDs, granted scopes, and access token from Integrations."
              actions={["Open Integrations", "Scan Meta accounts", "Check connection readiness"]}
            />
            <SupportTile
              title="2. Confirm mappings"
              detail="Map Printavo statuses, payment states, tags, dirty fields, reorder cycles, and alert thresholds before reporting becomes authoritative."
              actions={["Preview impact", "Save section", "Review history"]}
            />
            <SupportTile
              title="3. Review identities"
              detail="Approve or reject social/customer suggestions without merging source records. Use watched account import when an account is not owned."
              actions={["Add watched account", "Approve link", "Reject suggestion"]}
            />
          </div>
        </Section>
        <Section title="Onboarding Help" description="Tenant admins can use this as the setup playbook. Each decision should be reviewed here before the tenant relies on the data operationally.">
          <div className="grid gap-4 lg:grid-cols-2">
            <HelpDocCard
              title="Provider connection"
              steps={[
                "Use Integrations to save Printavo read-only credentials and Meta / Instagram connector fields.",
                "For Meta, pick Business Login for Instagram for direct professional accounts or Facebook Login for Business for Page-linked Business Suite accounts.",
                "Return to Social Monitor and run Scan Meta accounts. If the scan is gated, the connection panel lists the missing token or scopes.",
              ]}
            />
            <HelpDocCard
              title="Mapping review"
              steps={[
                "Edit status, payment, tag, field-trust, reorder, and alert settings in Tenant Configuration.",
                "Click Preview impact before saving to see affected orders, dirty rows, and dashboard surfaces.",
                "Save one section at a time after review so the change history stays readable and revertable.",
              ]}
            />
            <HelpDocCard
              title="Owned vs watched accounts"
              steps={[
                "Owned accounts are accounts the tenant can authorize through Meta. They can publish, reply, sync posts, and receive enriched data when scopes allow.",
                "Watched accounts do not require ownership. Add them manually for competitors, partner stores, athletes, schools, and media handles.",
                "Watched-account API enrichment remains limited to what Meta or another provider legally exposes; manual tracking stays first-class.",
              ]}
            />
            <HelpDocCard
              title="Review queues"
              steps={[
                "Use Identity Resolution to approve or reject links between social accounts, comments, messages, customers, contacts, and organizations.",
                "Use Account cleanup and dirty field warnings before treating reports as authoritative.",
                "No approval destructively merges Printavo customers, organizations, contacts, or social identities.",
              ]}
            />
          </div>
        </Section>
        <Section title="Tenant Configuration" description="Editable tenant-controlled settings. Preview each section, then save it through the tenant-scoped config API.">
          <div className="space-y-6">
            {configPreview ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">Preview: {labelFromKey(configPreview.section)}</p>
                    <p className="mt-1">
                      {formatNumber(configPreview.affectedOrders)} affected orders, {formatNumber(configPreview.affectedAccounts)} affected accounts,
                      {" "}{formatNumber(configPreview.dirtyRecords)} dirty records.
                    </p>
                    {configPreview.affectedDashboards.length ? <p className="mt-1">Dashboards touched: {configPreview.affectedDashboards.join(", ")}</p> : null}
                    {configPreview.warnings.length ? <p className="mt-1 text-amber-800">{configPreview.warnings.join(" ")}</p> : null}
                  </div>
                  <Pill tone="blue">Token {configPreview.previewToken}</Pill>
                </div>
              </div>
            ) : null}
            <ConfigActionBar section="statusMappings" label="Status mappings" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-2">
              {configDraft.statusMappings.map((item, index) => (
                <div key={`${item.sourceValue}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1.2fr_1fr_160px_120px_auto]">
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.sourceValue} onChange={(event) => setConfigItem("statusMappings", index, { sourceValue: event.target.value })} placeholder="Printavo status" />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.targetBucket} onChange={(event) => setConfigItem("statusMappings", index, { targetBucket: event.target.value })} placeholder="Bucket" />
                  <TrustSelect value={item.trustLevel} onChange={(value) => setConfigItem("statusMappings", index, { trustLevel: value })} />
                  <EnabledSelect value={item.enabled} onChange={(value) => setConfigItem("statusMappings", index, { enabled: value })} />
                  <Button icon={X} variant="ghost" onClick={() => removeConfigItem("statusMappings", index)}>Remove</Button>
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("statusMappings", { sourceValue: "", targetBucket: "needs_review", trustLevel: "needs_review", enabled: true, priority: 100 })}>Add status mapping</Button>
            </div>

            <ConfigActionBar section="paymentMappings" label="Payment mappings" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-2">
              {configDraft.paymentMappings.map((item, index) => (
                <div key={`${item.sourceValue}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1.2fr_1fr_160px_120px_auto]">
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.sourceValue} onChange={(event) => setConfigItem("paymentMappings", index, { sourceValue: event.target.value })} placeholder="Printavo payment state" />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.targetBucket} onChange={(event) => setConfigItem("paymentMappings", index, { targetBucket: event.target.value })} placeholder="Bucket" />
                  <TrustSelect value={item.trustLevel} onChange={(value) => setConfigItem("paymentMappings", index, { trustLevel: value })} />
                  <EnabledSelect value={item.enabled} onChange={(value) => setConfigItem("paymentMappings", index, { enabled: value })} />
                  <Button icon={X} variant="ghost" onClick={() => removeConfigItem("paymentMappings", index)}>Remove</Button>
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("paymentMappings", { sourceValue: "", targetBucket: "needs_review", trustLevel: "needs_review", enabled: true, priority: 100 })}>Add payment mapping</Button>
            </div>

            <ConfigActionBar section="tagMappings" label="Tag/category mappings" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-2">
              {configDraft.tagMappings.map((item, index) => (
                <div key={`${item.sourceValue}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1.2fr_1fr_160px_120px_auto]">
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.sourceValue} onChange={(event) => setConfigItem("tagMappings", index, { sourceValue: event.target.value })} placeholder="Printavo tag" />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.category} onChange={(event) => setConfigItem("tagMappings", index, { category: event.target.value })} placeholder="Category" />
                  <TrustSelect value={item.trustLevel} onChange={(value) => setConfigItem("tagMappings", index, { trustLevel: value })} />
                  <EnabledSelect value={item.enabled} onChange={(value) => setConfigItem("tagMappings", index, { enabled: value })} />
                  <Button icon={X} variant="ghost" onClick={() => removeConfigItem("tagMappings", index)}>Remove</Button>
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("tagMappings", { sourceValue: "", category: "needs_review", trustLevel: "needs_review", enabled: true, priority: 100 })}>Add tag mapping</Button>
            </div>

            <ConfigActionBar section="fieldTrust" label="Field trust review" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-2">
              {configDraft.fieldTrust.map((item, index) => (
                <div key={`${item.fieldKey}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_160px_150px_1.4fr_auto]">
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.fieldKey} onChange={(event) => setConfigItem("fieldTrust", index, { fieldKey: event.target.value })} placeholder="Field key" />
                  <TrustSelect value={item.trustLevel} onChange={(value) => setConfigItem("fieldTrust", index, { trustLevel: value })} />
                  <EnabledSelect trueLabel="Authoritative" falseLabel="Review" value={item.authoritative} onChange={(value) => setConfigItem("fieldTrust", index, { authoritative: value })} />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.warning ?? ""} onChange={(event) => setConfigItem("fieldTrust", index, { warning: event.target.value || null })} placeholder="Warning shown to operators" />
                  <Button icon={X} variant="ghost" onClick={() => removeConfigItem("fieldTrust", index)}>Remove</Button>
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("fieldTrust", { fieldKey: "", trustLevel: "needs_review", authoritative: false, warning: null })}>Add field trust rule</Button>
            </div>

            <ConfigActionBar section="reorderRules" label="Reorder rules" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-2">
              {configDraft.reorderRules.map((item, index) => (
                <div key={`${item.ruleKey}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_1fr_120px_140px_120px_auto]">
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.ruleKey} onChange={(event) => setConfigItem("reorderRules", index, { ruleKey: event.target.value })} placeholder="Rule key" />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.category} onChange={(event) => setConfigItem("reorderRules", index, { category: event.target.value })} placeholder="Category" />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" inputMode="numeric" value={item.cycleDays} onChange={(event) => setConfigItem("reorderRules", index, { cycleDays: Number(event.target.value) || 1 })} placeholder="Cycle days" />
                  <PrioritySelect value={item.priority} onChange={(value) => setConfigItem("reorderRules", index, { priority: value })} />
                  <EnabledSelect value={item.enabled} onChange={(value) => setConfigItem("reorderRules", index, { enabled: value })} />
                  <Button icon={X} variant="ghost" onClick={() => removeConfigItem("reorderRules", index)}>Remove</Button>
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("reorderRules", { ruleKey: "", category: "general", cycleDays: 365, priority: "medium", enabled: true })}>Add reorder rule</Button>
            </div>

            <ConfigActionBar section="emailTemplates" label="Email templates" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-3">
              {configDraft.emailTemplates.map((item, index) => (
                <div key={`${item.templateKey}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-2 lg:grid-cols-[1fr_1fr_120px_auto]">
                    <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.templateKey} onChange={(event) => setConfigItem("emailTemplates", index, { templateKey: event.target.value })} placeholder="Template key" />
                    <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.name} onChange={(event) => setConfigItem("emailTemplates", index, { name: event.target.value })} placeholder="Name" />
                    <EnabledSelect value={item.enabled} onChange={(value) => setConfigItem("emailTemplates", index, { enabled: value })} />
                    <Button icon={X} variant="ghost" onClick={() => removeConfigItem("emailTemplates", index)}>Remove</Button>
                  </div>
                  <input className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.subjectTemplate} onChange={(event) => setConfigItem("emailTemplates", index, { subjectTemplate: event.target.value })} placeholder="Subject template" />
                  <textarea className="mt-2 min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm" value={item.bodyTemplate} onChange={(event) => setConfigItem("emailTemplates", index, { bodyTemplate: event.target.value })} placeholder="Body template" />
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("emailTemplates", { templateKey: "", name: "", subjectTemplate: "{{accountName}} follow-up", bodyTemplate: "Hi {{contactName}},", enabled: true })}>Add email template</Button>
            </div>

            <ConfigActionBar section="socialAccountCategories" label="Social account categories" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-2">
              {configDraft.socialAccountCategories.map((item, index) => (
                <div key={`${item.key}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_1fr_140px_auto]">
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.key} onChange={(event) => setConfigItem("socialAccountCategories", index, { key: event.target.value })} placeholder="Category key" />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.label} onChange={(event) => setConfigItem("socialAccountCategories", index, { label: event.target.value })} placeholder="Label" />
                  <PrioritySelect value={item.priority} onChange={(value) => setConfigItem("socialAccountCategories", index, { priority: value })} />
                  <Button icon={X} variant="ghost" onClick={() => removeConfigItem("socialAccountCategories", index)}>Remove</Button>
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("socialAccountCategories", { key: "", label: "", priority: "medium" })}>Add social category</Button>
            </div>

            <ConfigActionBar section="alertRules" label="Alert rules" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="space-y-2">
              {configDraft.alertRules.map((item, index) => (
                <div key={`${item.ruleKey}-${index}`} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_1fr_120px_140px_120px_auto]">
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.ruleKey} onChange={(event) => setConfigItem("alertRules", index, { ruleKey: event.target.value })} placeholder="Rule key" />
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.name} onChange={(event) => setConfigItem("alertRules", index, { name: event.target.value })} placeholder="Name" />
                  <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.module} onChange={(event) => setConfigItem("alertRules", index, { module: event.target.value as "sales" | "social" })}>
                    <option value="sales">Sales</option>
                    <option value="social">Social</option>
                  </select>
                  <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={item.eventType} onChange={(event) => setConfigItem("alertRules", index, { eventType: event.target.value })} placeholder="Event type" />
                  <EnabledSelect value={item.enabled} onChange={(value) => setConfigItem("alertRules", index, { enabled: value })} />
                  <Button icon={X} variant="ghost" onClick={() => removeConfigItem("alertRules", index)}>Remove</Button>
                </div>
              ))}
              <Button icon={Plus} onClick={() => addConfigItem("alertRules", { ruleKey: "", name: "", module: "social", eventType: "new_post", severity: "medium", threshold: {}, enabled: true })}>Add alert rule</Button>
            </div>

            <ConfigActionBar section="featureFlags" label="Feature flags" onPreview={previewConfigSection} onSave={saveConfigSection} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(configDraft.featureFlags).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <span>{labelFromKey(key)}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(event) =>
                      setConfigDraft((current) => ({
                        ...current,
                        featureFlags: { ...current.featureFlags, [key]: event.target.checked },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </Section>
        {renderIdentitySuggestions()}
        <Section title="Custom Dashboards" description="Create tenant-scoped dashboards from approved widget primitives. Saved views and goals use the same product-owned storage.">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <form
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveCustomDashboard();
              }}
            >
              <h3 className="font-semibold text-slate-950">New dashboard</h3>
              <input className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Dashboard name" value={dashboardDraft.name} onChange={(event) => setDashboardDraft((current) => ({ ...current, name: event.target.value }))} />
              <div className="mt-4 grid gap-2">
                {[
                  ["sales_pulse", "Sales pulse"],
                  ["reorder_queue", "Reorder queue"],
                  ["opportunity_pipeline", "Opportunity pipeline"],
                  ["order_cockpit", "Order cockpit"],
                  ["social_alerts", "Social alerts"],
                  ["post_library", "Post library"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={dashboardDraft.widgets.includes(key)}
                      onChange={(event) =>
                        setDashboardDraft((current) => ({
                          ...current,
                          widgets: event.target.checked ? [...current.widgets, key] : current.widgets.filter((item) => item !== key),
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
              <Button type="submit" icon={Plus} variant="primary">Create dashboard</Button>
            </form>
            <div className="space-y-3">
              {summary.customDashboards.dashboards.length ? (
                summary.customDashboards.dashboards.map((dashboard) => (
                  <div key={dashboard.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-950">{dashboard.name}</p>
                      <Pill tone={dashboard.isDefault ? "green" : "blue"}>{dashboard.isDefault ? "Default" : "Custom"}</Pill>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.isArray(dashboard.definition.widgets)
                        ? dashboard.definition.widgets.map((widget) => <Pill key={String(widget)} tone="slate">{labelFromKey(String(widget))}</Pill>)
                        : null}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No custom dashboards" body="Create a dashboard from the widget library to save role-specific views for the tenant." />
              )}
            </div>
          </div>
        </Section>
        <Section title="UI Self-Audit Rules" description="Rules for future Codex/browser iterations on this workspace.">
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            {[
              "No fake KPI fallback values. Use real tenant data or a visible unavailable state.",
              "Every button must call an endpoint, open a local workflow, copy text, or be disabled with a reason.",
              "Demo fixture data must be labeled Demo fixture wherever it appears.",
              "Use browser screenshots after UI changes and fix visible spacing, overflow, and empty-state issues.",
              "Avoid generic placeholder copy. Use screenprinting, Printavo, Instagram, customer, order, and reorder language.",
              "Printavo write-back remains disabled until explicitly approved.",
            ].map((rule) => (
              <div key={rule} className="rounded-md border border-slate-200 bg-slate-50 p-3">{rule}</div>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  const salesRenderer: Record<SalesView, () => ReactNode> = {
    dashboard: renderSalesDashboard,
    opportunities: renderOpportunities,
    accounts: renderAccounts,
    reorders: renderReorders,
    goals: renderGoals,
    orders: renderOrders,
  };
  const socialRenderer: Record<SocialView, () => ReactNode> = {
    dashboard: renderSocialDashboard,
    accounts: renderSocialAccounts,
    "account-detail": renderSocialAccountDetail,
    posts: () => renderPosts(socialPosts),
    alerts: renderAlerts,
    calendar: renderCalendar,
    conversations: renderConversations,
    campaigns: renderCampaigns,
    import: renderImport,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="blue">{operatorLabel}</Pill>
              <Pill tone="green">Printavo read-only</Pill>
              <Pill tone="pink">Social signals</Pill>
              {summary.organization ? null : <Pill tone="amber">Demo workspace</Pill>}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{workspaceName} command center</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              A working desk for repeat orders, quote follow-up, account focus, and social signals. Platform settings are still here, but they no longer lead the experience.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button active={moduleView === "sales"} icon={BarChart3} onClick={() => setModuleView("sales")}>Today & sales</Button>
            <Button active={moduleView === "social"} icon={MessageSquare} onClick={() => setModuleView("social")}>Social signals</Button>
            <Button active={moduleView === "admin"} icon={Settings2} onClick={() => setModuleView("admin")}>Settings & mappings</Button>
          </div>
        </header>

        {notice ? (
          <div className={cx("mb-5 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm", notice.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800", notice.tone === "error" && "border-red-200 bg-red-50 text-red-800", notice.tone === "info" && "border-blue-200 bg-blue-50 text-blue-800")}>
            <span>{notice.message}</span>
            <button type="button" onClick={() => setNotice(null)} className="rounded-md p-1 hover:bg-white/60" aria-label="Dismiss notice"><X className="h-4 w-4" /></button>
          </div>
        ) : null}

        <div className="mb-4 overflow-x-auto pb-1 lg:hidden">
          <div className="flex min-w-max gap-2">
            {(moduleView === "sales" ? salesNav : moduleView === "social" ? socialNav : adminNav.map((item) => ({ key: item, label: item, icon: Settings2 }))).map(({ key, label, icon: Icon }) => {
              const active = moduleView === "sales" ? salesView === key : moduleView === "social" ? socialView === key : false;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (moduleView === "sales") {
                      setSalesView(key as SalesView);
                    } else if (moduleView === "social") {
                      setSocialView(key as SocialView);
                    } else {
                      setNotice({ tone: "info", message: `${label} configuration is shown in the Admin panel.` });
                    }
                  }}
                  className={cx(
                    "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
                    active ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden rounded-lg border border-slate-200 bg-white p-3 lg:block">
            <div className="mb-3 flex items-center gap-3 px-2 py-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-700 text-white">
                {moduleView === "sales" ? <BarChart3 className="h-5 w-5" /> : moduleView === "social" ? <MessageSquare className="h-5 w-5" /> : <Settings2 className="h-5 w-5" />}
              </span>
              <div>
                <p className="font-semibold text-slate-950">{moduleView === "sales" ? "Today" : moduleView === "social" ? "Signals" : "Settings"}</p>
                <p className="text-sm text-slate-500">{moduleView === "sales" ? "Work queue" : moduleView === "social" ? "Watchlist monitor" : "Mappings and tenant controls"}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {(moduleView === "sales" ? salesNav : moduleView === "social" ? socialNav : []).map(({ key, label, icon: Icon }) => {
                const active = moduleView === "sales" ? salesView === key : socialView === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => (moduleView === "sales" ? setSalesView(key as SalesView) : setSocialView(key as SocialView))}
                    className={cx("flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold transition", active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}
                  >
                    <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span>
                    {key === "alerts" && social.unreadAlerts ? <span className="rounded-full bg-blue-700 px-2 py-0.5 text-xs text-white">{social.unreadAlerts > 9 ? "9+" : social.unreadAlerts}</span> : null}
                  </button>
                );
              })}
              {moduleView === "admin" ? (
                adminNav.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setNotice({ tone: "info", message: `${item} configuration is shown in the Admin Config panel.` })}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Settings2 className="h-4 w-4" />
                    {item}
                  </button>
                ))
              ) : null}
            </nav>
          </aside>
          <main className="min-w-0 space-y-5">
            {moduleView === "sales" ? salesRenderer[salesView]() : moduleView === "social" ? socialRenderer[socialView]() : renderAdmin()}
          </main>
        </div>
      </div>

      {selectedPost ? <SocialPostDrawer post={selectedPost} account={socialAccounts.find((account) => account.id === selectedPost.socialAccountId)} connection={socialConnection} commentText={commentText} setCommentText={setCommentText} onClose={() => setSelectedPost(null)} runAction={runAction} apiBase={apiBase} /> : null}
      {selectedOrder ? <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
      {draft ? (
        <EmailDraftModal
          draft={draft}
          onClose={() => setDraft(null)}
          onCopy={() => copyText(`${draft.subject}\n\n${draft.body}`, "Email draft copied.")}
          onMarkSent={() =>
            draft.id
              ? runAction("Mark email draft sent", `${apiBase}/sales/email-drafts/${draft.id}/mark-sent`, { method: "POST" })
              : setNotice({ tone: "error", message: "Only API-rendered drafts can be marked sent." })
          }
        />
      ) : null}
      {composerOpen ? (
        <SocialComposerModal
          draft={composerDraft}
          accounts={socialAccounts}
          setDraft={setComposerDraft}
          onClose={() => setComposerOpen(false)}
          onSave={saveSocialDraft}
        />
      ) : null}
    </div>
  );
}

function OpportunityCard({ opportunity, onStageChange }: { opportunity: Opportunity; onStageChange: (stageKey: string) => void }) {
  const isDerived = Boolean(opportunity.metadata?.derived);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{opportunity.title}</p>
          <p className="mt-1 text-sm text-slate-500">{metadataString(opportunity.metadata?.customerName) ?? "No customer mapped"}</p>
        </div>
        <p className="font-semibold text-emerald-700">{opportunity.value ? formatMoney(opportunity.value) : "No value"}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Pill tone={isDerived ? "blue" : "green"}>{isDerived ? "Derived read-only" : "Persisted"}</Pill>
        <Pill tone="slate">{labelFromKey(opportunity.sourceType)}</Pill>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["contacted", "proposal_sent", "won"].map((stageKey) => (
          <Button
            key={stageKey}
            disabled={isDerived}
            title={isDerived ? "Derived opportunities must be persisted before stage changes." : undefined}
            onClick={() => onStageChange(stageKey)}
          >
            {labelFromKey(stageKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SupportTile({ title, detail, actions }: { title: string; detail: string; actions: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => <Pill key={action} tone="blue">{action}</Pill>)}
      </div>
    </div>
  );
}

function HelpDocCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {steps.map((step, index) => (
          <li key={step} className="grid grid-cols-[24px_1fr] gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-semibold text-blue-700">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function ConfigActionBar({
  section,
  label,
  onPreview,
  onSave,
}: {
  section: EditableConfigSection;
  label: string;
  onPreview: (section: EditableConfigSection) => void;
  onSave: (section: EditableConfigSection) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="font-semibold text-slate-950">{label}</h3>
        <p className="mt-1 text-sm text-slate-500">Preview the impact before saving this section.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon={Eye} onClick={() => onPreview(section)}>Preview impact</Button>
        <Button icon={CheckCircle2} variant="primary" onClick={() => onSave(section)}>Save {label}</Button>
      </div>
    </div>
  );
}

function TrustSelect({ value, onChange }: { value: ScreenprintingConfig["fieldTrust"][number]["trustLevel"]; onChange: (value: ScreenprintingConfig["fieldTrust"][number]["trustLevel"]) => void }) {
  return (
    <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value as ScreenprintingConfig["fieldTrust"][number]["trustLevel"])}>
      <option value="trusted">Trusted</option>
      <option value="needs_review">Needs review</option>
      <option value="review">Review</option>
      <option value="dirty">Dirty</option>
      <option value="ignored">Ignored</option>
    </select>
  );
}

function PrioritySelect({ value, onChange }: { value: "low" | "medium" | "high"; onChange: (value: "low" | "medium" | "high") => void }) {
  return (
    <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value as "low" | "medium" | "high")}>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  );
}

function EnabledSelect({
  value,
  onChange,
  trueLabel = "Enabled",
  falseLabel = "Disabled",
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={value ? "true" : "false"} onChange={(event) => onChange(event.target.value === "true")}>
      <option value="true">{trueLabel}</option>
      <option value="false">{falseLabel}</option>
    </select>
  );
}

function MetaConnectionPanel({ connection, orgSlug }: { connection: ScreenprintingWorkspaceSummary["socialConnection"]; orgSlug: string }) {
  const activeMode = connection.modes.find((mode) => mode.key === connection.preferredMode) ?? connection.modes[0];
  const capabilityRows = [
    ["Owned account scan", connection.capabilities.ownedAccountDiscovery],
    ["Watchlist import", connection.capabilities.watchedAccountManualImport],
    ["Watchlist API enrichment", connection.capabilities.watchedAccountApiEnrichment],
    ["Post sync + insights", connection.capabilities.readPosts && connection.capabilities.readInsights],
    ["Comment replies", connection.capabilities.replyToComments],
    ["Message replies", connection.capabilities.replyToMessages],
    ["Publishing", connection.capabilities.publishPosts],
  ] as const;

  return (
    <Section
      title="Meta / Instagram connection"
      description={`${activeMode?.label ?? "Meta Graph"} uses ${activeMode?.hostUrl ?? "Graph API"} with ${activeMode?.tokenType ?? "access tokens"}. Watched accounts can be added now; API enrichment depends on Meta-permitted professional account data and owned-account interactions.`}
      actions={
        <>
          <Button icon={Instagram} variant="primary" onClick={() => { window.location.href = `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/connectors/meta/oauth/start?mode=${encodeURIComponent(connection.preferredMode)}`; }}>Connect Instagram</Button>
          <Button icon={Settings2} onClick={() => { window.location.href = `/integrations?org=${encodeURIComponent(orgSlug)}`; }}>Settings</Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={connection.configured ? "green" : "amber"}>{connection.configured ? "Connector saved" : "Needs connector"}</Pill>
            <Pill tone={connection.providerWriteBackAvailable ? "green" : "slate"}>{connection.providerWriteBackAvailable ? "Live actions ready" : "Setup required"}</Pill>
            <Pill tone={connection.publishingAvailable ? "green" : "amber"}>{connection.publishingAvailable ? "Publishing ready" : "Publishing gated"}</Pill>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <div className="flex justify-between gap-3"><span>Mode</span><span className="font-semibold text-slate-900">{activeMode?.loginType ?? labelFromKey(connection.preferredMode)}</span></div>
            <div className="flex justify-between gap-3"><span>Graph version</span><span className="font-semibold text-slate-900">{connection.graphApiVersion}</span></div>
            <div className="flex justify-between gap-3"><span>Owned accounts</span><span className="font-semibold text-slate-900">{connection.accountCounts.owned}</span></div>
            <div className="flex justify-between gap-3"><span>Watched accounts</span><span className="font-semibold text-slate-900">{connection.accountCounts.watched}</span></div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {capabilityRows.map(([label, enabled]) => (
            <div key={label} className={cx("rounded-lg border p-3 text-sm", enabled ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600")}>
              <div className="flex items-center gap-2 font-semibold">
                {enabled ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
      {connection.permissionState.missingPermissions.length ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Missing required scopes: {connection.permissionState.missingPermissions.join(", ")}.
        </p>
      ) : null}
    </Section>
  );
}

function OrderDetailModal({ order, onClose }: { order: SalesOrder; onClose: () => void }) {
  const [worksheet, setWorksheet] = useState({
    quantity: "24",
    priceEach: order.orderTotal ? String(Math.max(1, Math.round((order.orderTotal / 24) * 100) / 100)) : "0",
    blankCost: "0",
    decoCost: "0",
  });
  const quantity = Number(worksheet.quantity) || 0;
  const priceEach = Number(worksheet.priceEach) || 0;
  const blankCost = Number(worksheet.blankCost) || 0;
  const decoCost = Number(worksheet.decoCost) || 0;
  const estimateRevenue = quantity * priceEach;
  const estimateCost = quantity * (blankCost + decoCost);
  const estimateMargin = estimateRevenue - estimateCost;
  const estimateMarginRate = estimateRevenue > 0 ? estimateMargin / estimateRevenue : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Package className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl font-semibold text-slate-950">{order.jobName}</h2>
              <Pill tone="blue">#{order.orderNumber ?? order.externalOrderId}</Pill>
            </div>
            <p className="mt-1 text-sm text-slate-500">{order.customerName}</p>
          </div>
          <Button icon={X} onClick={onClose}>Close</Button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-5">
          <MetricCard label="Total" value={formatMoney(order.orderTotal)} icon={DollarSign} tone="green" />
          <MetricCard label="Status" value={<span className="text-base">{order.status ?? "Unknown"}</span>} icon={FileText} />
          <MetricCard label="Payment" value={<span className="text-base">{order.paymentStatus ?? "Unknown"}</span>} icon={CheckCircle2} tone="green" />
          <MetricCard label="Manager" value={<span className="text-base">{order.managerName ?? "Unassigned"}</span>} icon={Users} tone="slate" />
          <MetricCard label="Order date" value={<span className="text-base">{shortDate(order.orderCreatedAt ?? order.productionDate)}</span>} icon={Clock3} tone="slate" />
        </div>
        <div className="px-5 pb-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Profitability below is an operator worksheet, not synced actual cost. It stays out of Printavo and should be treated as needs-review until catalog and decorator cost data are configured.
          </div>
          <div className="mt-4 rounded-lg border border-slate-200">
            <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Quantity
                <input className="rounded-md border border-slate-200 px-3 py-2 text-right" inputMode="numeric" value={worksheet.quantity} onChange={(event) => setWorksheet((current) => ({ ...current, quantity: event.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Price each
                <input className="rounded-md border border-slate-200 px-3 py-2 text-right" inputMode="decimal" value={worksheet.priceEach} onChange={(event) => setWorksheet((current) => ({ ...current, priceEach: event.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Blank cost
                <input className="rounded-md border border-slate-200 px-3 py-2 text-right" inputMode="decimal" value={worksheet.blankCost} onChange={(event) => setWorksheet((current) => ({ ...current, blankCost: event.target.value }))} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Decoration cost
                <input className="rounded-md border border-slate-200 px-3 py-2 text-right" inputMode="decimal" value={worksheet.decoCost} onChange={(event) => setWorksheet((current) => ({ ...current, decoCost: event.target.value }))} />
              </label>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-4">
              <MetricCard label="Estimated revenue" value={formatMoney(estimateRevenue)} icon={DollarSign} tone="green" />
              <MetricCard label="Estimated cost" value={formatMoney(estimateCost)} icon={Package} tone="amber" />
              <MetricCard label="Estimated margin" value={formatMoney(estimateMargin)} icon={Trophy} tone={estimateMargin >= 0 ? "green" : "amber"} />
              <MetricCard label="Margin rate" value={formatPercent(estimateMarginRate)} icon={BarChart3} tone={estimateMargin >= 0 ? "green" : "amber"} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {order.sourceUrl ? <Button icon={ExternalLink} onClick={() => window.open(order.sourceUrl ?? "", "_blank", "noopener,noreferrer")}>Open in Printavo</Button> : null}
            <Button icon={Copy} onClick={() => navigator.clipboard.writeText(`${order.customerName}\n${order.jobName}\n${formatMoney(order.orderTotal)}`)}>Copy summary</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialPostDrawer({
  post,
  account,
  connection,
  commentText,
  setCommentText,
  onClose,
  runAction,
  apiBase,
}: {
  post: SocialPost;
  account?: SocialAccount;
  connection: ScreenprintingWorkspaceSummary["socialConnection"];
  commentText: string;
  setCommentText: (value: string) => void;
  onClose: () => void;
  runAction: (label: string, path: string, init?: RequestInit, reload?: boolean) => Promise<unknown>;
  apiBase: string;
}) {
  const [commentId, setCommentId] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <aside className="h-full w-full max-w-2xl overflow-auto bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Post insights</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{account?.displayName ?? account?.handle ?? "Social account"}</h2>
            <p className="text-sm text-slate-500">@{account?.handle ?? "unknown"}</p>
          </div>
          <Button icon={X} onClick={onClose}>Close</Button>
        </div>
        <div className="p-5">
          <div className="rounded-lg bg-slate-100 p-6">
            <p className="text-sm leading-6 text-slate-700">{post.caption || "No caption synced"}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Views" value={formatNumber(metricValue(post.metrics, "views"))} icon={Eye} />
            <MetricCard label="Reach" value={formatNumber(metricValue(post.metrics, "reach"))} icon={Users} />
            <MetricCard label="Replies" value={formatNumber(metricValue(post.metrics, "replies"))} icon={MessageCircle} />
            <MetricCard label="Likes" value={formatNumber(metricValue(post.metrics, "likes"))} icon={Heart} tone="green" />
            <MetricCard label="Comments" value={formatNumber(metricValue(post.metrics, "comments"))} icon={MessageSquare} tone="amber" />
            <MetricCard label="New follows" value={formatNumber(metricValue(post.metrics, "newFollows"))} icon={Plus} tone="green" />
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <p className="font-semibold text-slate-950">Comments and replies</p>
            <p className="mt-1 text-sm text-slate-500">Replies use Meta Graph API when the tenant has an owned account, comments scope, and the comments/replies feature flag.</p>
            <input className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={commentId} onChange={(event) => setCommentId(event.target.value)} placeholder="Instagram comment ID to reply to" />
            <textarea className="mt-3 min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={`Add a comment as @${account?.handle ?? "account"}...`} />
            <div className="mt-3 flex justify-end">
              <Button
                icon={Send}
                disabled={!connection.capabilities.replyToComments || !commentText.trim() || !commentId.trim()}
                title={connection.capabilities.replyToComments ? "Reply through Meta Graph API." : "Comment replies require Meta token, comments scope, feature flag, owned account, and an Instagram comment ID."}
                onClick={() =>
                  runAction(
                    "Reply to comment",
                    `${apiBase}/social/posts/${post.id}/comments`,
                    { method: "POST", body: JSON.stringify({ commentId, message: commentText }) },
                    false,
                  )
                }
              >
                Reply
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SocialComposerModal({
  draft,
  accounts,
  setDraft,
  onClose,
  onSave,
}: {
  draft: SocialComposerDraft;
  accounts: SocialAccount[];
  setDraft: Dispatch<SetStateAction<SocialComposerDraft>>;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Social composer</h2>
            <p className="text-sm text-slate-500">Creates a tenant-scoped draft. Drafts can publish when Meta permissions and owned-account IDs are configured.</p>
          </div>
          <Button icon={X} onClick={onClose}>Close</Button>
        </div>
        <div className="grid gap-4 p-5">
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Account
            <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={draft.socialAccountId} onChange={(event) => setDraft((current) => ({ ...current, socialAccountId: event.target.value }))}>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  @{account.handle} - {labelFromKey(account.ownership)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Type
              <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={draft.postType} onChange={(event) => setDraft((current) => ({ ...current, postType: event.target.value }))}>
                <option value="post">Post</option>
                <option value="reel">Reel</option>
                <option value="story">Story</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Schedule
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" type="datetime-local" value={draft.scheduledFor} onChange={(event) => setDraft((current) => ({ ...current, scheduledFor: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Location
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Optional" value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Public media URL
            <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="https://..." value={draft.mediaUrl} onChange={(event) => setDraft((current) => ({ ...current, mediaUrl: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Caption
            <textarea className="min-h-40 rounded-md border border-slate-200 p-3 text-sm" maxLength={2200} placeholder="Write the caption. Hashtags and mentions stay in draft." value={draft.caption} onChange={(event) => setDraft((current) => ({ ...current, caption: event.target.value }))} />
            <span className="text-xs text-slate-400">{draft.caption.length} / 2200</span>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Collaborators
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="@handle, @handle" value={draft.collaborators} onChange={(event) => setDraft((current) => ({ ...current, collaborators: event.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Tags
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="campaign, school, drop" value={draft.tags} onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))} />
            </label>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Saving the draft does not publish. Publishing is a separate Meta action so operators can review copy and assets first.
          </div>
          <div className="flex justify-end gap-2">
            <Button icon={X} onClick={onClose}>Cancel</Button>
            <Button icon={Send} variant="primary" onClick={onSave}>Save draft</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailDraftModal({
  draft,
  onClose,
  onCopy,
  onMarkSent,
}: {
  draft: { id?: string; to: string | null; subject: string; body: string; source: "api" | "local" };
  onClose: () => void;
  onCopy: () => void;
  onMarkSent: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Email draft</h2>
            <p className="text-sm text-slate-500">{draft.source === "api" ? "Rendered by tenant email template API." : "Rendered locally because API/audit session was unavailable."}</p>
          </div>
          <Button icon={X} onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-3 p-5">
          <label className="block text-sm font-semibold text-slate-500">To</label>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={draft.to ?? ""} readOnly placeholder="Copy into your email client" />
          <label className="block text-sm font-semibold text-slate-500">Subject</label>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" value={draft.subject} readOnly />
          <label className="block text-sm font-semibold text-slate-500">Body</label>
          <textarea className="min-h-72 w-full rounded-md border border-slate-200 p-3 text-sm" value={draft.body} readOnly />
          <div className="flex flex-wrap justify-end gap-2">
            <Button icon={Copy} onClick={onCopy}>Copy email</Button>
            <Button icon={ExternalLink} onClick={() => window.open(`mailto:${draft.to ?? ""}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`)}>Open email client</Button>
            <Button icon={CheckCircle2} variant="primary" disabled={!draft.id} onClick={onMarkSent}>Mark as sent</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
