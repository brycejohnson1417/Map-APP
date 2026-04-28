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
import { useState, type ReactNode } from "react";
import type { getScreenprintingWorkspaceSummary } from "@/lib/application/screenprinting/screenprinting-service";

type ScreenprintingWorkspaceSummary = Awaited<ReturnType<typeof getScreenprintingWorkspaceSummary>>;
type SalesView = "dashboard" | "opportunities" | "accounts" | "reorders" | "goals" | "orders";
type SocialView = "dashboard" | "accounts" | "account-detail" | "posts" | "alerts" | "calendar" | "conversations" | "campaigns" | "import";
type ModuleView = "sales" | "social" | "admin";
type SalesOrder = ScreenprintingWorkspaceSummary["orders"]["orders"][number];
type SocialAccount = ScreenprintingWorkspaceSummary["socialAccounts"]["accounts"][number];
type SocialPost = ScreenprintingWorkspaceSummary["socialPosts"]["posts"][number];
type ReorderSignal = ScreenprintingWorkspaceSummary["reorders"]["buckets"]["overdue"][number];
type Opportunity = ScreenprintingWorkspaceSummary["opportunities"]["pipelines"][number]["stages"][number]["opportunities"][number];
type IdentitySuggestion = ScreenprintingWorkspaceSummary["identity"]["suggestions"][number];

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

export function ScreenprintingWorkspace({ summary, orgSlug }: { summary: ScreenprintingWorkspaceSummary; orgSlug: string }) {
  const [moduleView, setModuleView] = useState<ModuleView>("sales");
  const [salesView, setSalesView] = useState<SalesView>("dashboard");
  const [socialView, setSocialView] = useState<SocialView>("dashboard");
  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState(summary.socialAccounts.accounts[0]?.id ?? null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [draft, setDraft] = useState<{ to: string | null; subject: string; body: string; source: "api" | "local" } | null>(null);
  const [newSocialAccount, setNewSocialAccount] = useState({ handle: "", platform: "instagram", ownership: "watched", category: "" });
  const [newCampaign, setNewCampaign] = useState({ name: "", campaignType: "drop", startsOn: "", endsOn: "", goal: "" });
  const [newThread, setNewThread] = useState({ participantHandle: "", threadType: "dm", summary: "" });
  const [commentText, setCommentText] = useState("");

  const sales = summary.salesDashboard.metrics;
  const social = summary.socialDashboard.metrics;
  const topCustomers = summary.salesDashboard.topCustomers ?? [];
  const syncStatus = summary.salesDashboard.printavoSyncStatus;
  const orders = summary.orders.orders;
  const socialAccounts = summary.socialAccounts.accounts;
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
              <HeroStat label="Unread social" value={formatNumber(unreadAlerts.length)} sublabel="Signals, not publishing" />
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
          <Button
            icon={Plus}
            disabled
            title="Create persisted opportunities from a reorder signal or quoted Printavo order so source context is preserved."
          >
            New opportunity
          </Button>
        }
      >
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
                    stage.opportunities.slice(0, 8).map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)
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
    return (
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
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button icon={Mail} onClick={() => createDraft(signal)}>Reach out</Button>
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
    return (
      <Section title="Manager Performance Targets" description="Goal storage is intentionally tenant-configurable. Current actuals come from Printavo manager attribution.">
        {summary.salesDashboard.managerPerformance?.length ? (
          <TableShell>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Manager</th>
                  <th className="px-4 py-3 text-right">Actual revenue</th>
                  <th className="px-4 py-3 text-right">Actual orders</th>
                  <th className="px-4 py-3 text-left">Goal configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.salesDashboard.managerPerformance.map((manager) => (
                  <tr key={manager.managerName}>
                    <td className="px-4 py-3 font-semibold text-slate-950">{manager.managerName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatMoney(manager.revenue)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(manager.orders)}</td>
                    <td className="px-4 py-3 text-slate-500">Editable goal persistence is a planned config surface; actuals are live now.</td>
                  </tr>
                ))}
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
    return (
      <Section
        title="Orders"
        description={`${formatNumber(summary.orders.pagination.total)} Printavo orders available. The table shows the latest ${formatNumber(summary.orders.orders.length)} rows.`}
        actions={
          <Button
            icon={SlidersHorizontal}
            disabled
            title="Saved view persistence is disabled until tenant-specific field trust and column presets are finalized."
          >
            Create saved view
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {summary.salesDashboard.statusBreakdown?.map((item) => (
            <Pill key={item.bucket} tone="blue">{labelFromKey(item.bucket)}: {formatNumber(item.count)}</Pill>
          ))}
          {summary.salesDashboard.paymentBreakdown?.map((item) => (
            <Pill key={item.bucket} tone="green">{labelFromKey(item.bucket)}: {formatNumber(item.count)}</Pill>
          ))}
        </div>
        {orders.length ? (
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
                {orders.map((order) => (
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
          <EmptyState title="No orders" body="No Printavo orders are currently synced for this tenant." />
        )}
      </Section>
    );
  }

  function renderSocialDashboard() {
    return (
      <div className="space-y-5">
        <Section
          title="Social Monitor"
          description="Owned and watched social accounts, posts, alerts, messages, and calendar surfaces. Live write-back is disabled until the tenant authorizes the required platform permissions."
          actions={<Button icon={RefreshCw} onClick={() => runAction("Scan social accounts", `${apiBase}/social/accounts/scan`, { method: "POST" })}>Scan accounts</Button>}
        >
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Tracked accounts" value={formatNumber(social.trackedAccounts)} sublabel={`${formatNumber(social.activeAccounts)} active`} icon={Users} />
            <MetricCard label="Posts" value={formatNumber(social.totalPosts)} sublabel={`${formatNumber(social.newPosts)} recent`} icon={FileText} />
            <MetricCard label="Unread alerts" value={formatNumber(social.unreadAlerts)} icon={Bell} tone="amber" />
            <MetricCard label="Engagement" value={formatNumber(social.totalEngagement)} sublabel="Likes + comments + shares" icon={Heart} tone="green" />
          </div>
        </Section>
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
    return (
      <Section title="Tracked Accounts" description="Owned accounts can eventually publish/reply after platform authorization; watched accounts are monitored and mapped to customers or organizations." actions={<Button icon={Plus} onClick={() => setSocialView("import")}>Add account</Button>}>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_repeat(5,180px)]">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500"><Search className="h-4 w-4" /> Search, platform, priority, category, status filters are tenant-configurable.</div>
          {["All platforms", "All priorities", "All categories", "All statuses", "All schools"].map((item) => (
            <button key={item} type="button" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-600">{item}</button>
          ))}
        </div>
        {socialAccounts.length ? (
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
                {socialAccounts.map((account) => (
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
          <EmptyState title="No social accounts configured" body="Add owned Instagram accounts or watched accounts manually, or authorize Meta scanning when credentials and permissions are ready." action={<Button icon={Plus} onClick={() => setSocialView("import")}>Add first account</Button>} />
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
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-500">Category</span><span className="font-semibold text-slate-800">{selectedSocialAccount.category ?? "Unmapped"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">School/org key</span><span className="font-semibold text-slate-800">{selectedSocialAccount.schoolOrOrgKey ?? "Unmapped"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Customer link</span><span className="font-semibold text-slate-800">{selectedSocialAccount.accountId ? "Linked" : "Not linked"}</span></div>
              </div>
            </div>
          </div>
        </Section>
        {renderPosts(selectedAccountPosts)}
      </div>
    );
  }

  function renderPosts(inputPosts = socialPosts) {
    return (
      <Section title="Posts" description="Synced posts, reels, and stories with available metrics. Missing metrics indicate provider permissions or manual-import limitations.">
        {inputPosts.length ? (
          <div className="space-y-3">
            {inputPosts.map((post) => (
              <div key={post.id} className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  {post.mediaUrl ? <img src={post.mediaUrl} alt="" className="h-full w-full rounded-md object-cover" /> : <FileText className="h-6 w-6" />}
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
                  <Button icon={Eye} onClick={() => setSelectedPost(post)}>Insights</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No social posts synced" body="Connect or manually import posts for owned/watched accounts to populate post tracking, insights, calendar, and alert rules." />
        )}
      </Section>
    );
  }

  function renderAlerts() {
    return (
      <Section
        title="Alerts"
        description="Actionable social alerts are generated from tenant-configured alert rules. Demo or metadata-derived candidates are labeled."
        actions={<Button icon={CheckCircle2} onClick={() => runAction("Mark all alerts read", `${apiBase}/social/alerts/mark-all-read`, { method: "POST" })}>Mark all read</Button>}
      >
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
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
          <EmptyState title="No alerts" body="No persisted alerts or metadata alert candidates are available for this tenant." />
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
      <Section title="Content Calendar" description="Calendar is read-only until owned-account publishing is authorized. It still tracks scheduled and published synced posts.">
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
              if (!newSocialAccount.handle.trim()) {
                setNotice({ tone: "error", message: "Social handle is required." });
                return;
              }
              runAction("Add social account", `${apiBase}/social/accounts`, {
                method: "POST",
                body: JSON.stringify({
                  ...newSocialAccount,
                  handle: newSocialAccount.handle.replace(/^@/, ""),
                  category: newSocialAccount.category || null,
                }),
              });
            }}
          >
            <h3 className="font-semibold text-slate-950">Manual account import</h3>
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
              <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Category, e.g. greek, school, athlete, competitor" value={newSocialAccount.category} onChange={(event) => setNewSocialAccount((current) => ({ ...current, category: event.target.value }))} />
              <Button type="submit" icon={Plus} variant="primary">Add account</Button>
            </div>
          </form>
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-950">Connected account scan</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Scan uses the tenant's connected social credentials when available. If permissions are missing, the API returns a clear warning instead of pretending data exists.</p>
            <Button icon={Instagram} onClick={() => runAction("Scan social accounts", `${apiBase}/social/accounts/scan`, { method: "POST" })}>Scan Meta accounts</Button>
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
        <Section title="Tenant Configuration" description="Stable internal primitives with tenant-controlled mappings. These settings drive every sales and social surface.">
          <div className="grid gap-4 lg:grid-cols-3">
            <ConfigList title="Status mappings" items={summary.config.statusMappings.map((item) => `${item.sourceValue} -> ${item.targetBucket}`)} />
            <ConfigList title="Payment mappings" items={summary.config.paymentMappings.map((item) => `${item.sourceValue} -> ${item.targetBucket}`)} />
            <ConfigList title="Field trust" items={summary.config.fieldTrust.map((item) => `${item.fieldKey}: ${item.trustLevel}`)} />
            <ConfigList title="Social alert rules" items={summary.config.alertRules.map((item) => `${item.ruleKey}: ${item.enabled ? "enabled" : "disabled"}`)} />
            <ConfigList title="Email templates" items={summary.config.emailTemplates.map((item) => item.templateKey)} />
            <ConfigList title="Feature flags" items={Object.entries(summary.featureFlags).map(([key, value]) => `${key}: ${value ? "on" : "off"}`)} />
          </div>
        </Section>
        {renderIdentitySuggestions()}
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
            <Button active={moduleView === "admin"} icon={Settings2} onClick={() => setModuleView("admin")}>Admin</Button>
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
                <p className="font-semibold text-slate-950">{moduleView === "sales" ? "Today" : moduleView === "social" ? "Signals" : "Admin"}</p>
                <p className="text-sm text-slate-500">{moduleView === "sales" ? "Work queue" : moduleView === "social" ? "Watchlist monitor" : "Tenant controls"}</p>
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

      {selectedPost ? <SocialPostDrawer post={selectedPost} account={socialAccounts.find((account) => account.id === selectedPost.socialAccountId)} commentText={commentText} setCommentText={setCommentText} onClose={() => setSelectedPost(null)} runAction={runAction} apiBase={apiBase} /> : null}
      {selectedOrder ? <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
      {draft ? <EmailDraftModal draft={draft} onClose={() => setDraft(null)} onCopy={() => copyText(`${draft.subject}\n\n${draft.body}`, "Email draft copied.")} /> : null}
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
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
        <Pill tone={opportunity.metadata?.derived ? "blue" : "green"}>{opportunity.metadata?.derived ? "Derived read-only" : "Persisted"}</Pill>
        <Pill tone="slate">{labelFromKey(opportunity.sourceType)}</Pill>
      </div>
    </div>
  );
}

function ConfigList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
        {items.length ? items.slice(0, 40).map((item) => <p key={item} className="rounded-md bg-white px-3 py-2 text-sm text-slate-600">{item}</p>) : <p className="text-sm text-slate-500">No entries configured.</p>}
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: SalesOrder; onClose: () => void }) {
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
            Profitability and line-item costs are intentionally not shown as actuals yet because catalog/decorator cost data is not stable in the synced order foundation. This avoids displaying fake margin values.
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
  commentText,
  setCommentText,
  onClose,
  runAction,
  apiBase,
}: {
  post: SocialPost;
  account?: SocialAccount;
  commentText: string;
  setCommentText: (value: string) => void;
  onClose: () => void;
  runAction: (label: string, path: string, init?: RequestInit, reload?: boolean) => Promise<unknown>;
  apiBase: string;
}) {
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
            <p className="mt-1 text-sm text-slate-500">Replying posts to Instagram requires the tenant's connected account to have manage-comments permission. The MVP prevents silent social write-back.</p>
            <textarea className="mt-3 min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={`Add a comment as @${account?.handle ?? "account"}...`} />
            <div className="mt-3 flex justify-end">
              <Button
                icon={Send}
                disabled={!commentText.trim()}
                onClick={() =>
                  runAction(
                    "Post comment",
                    `${apiBase}/social/posts/${post.id}/comments`,
                    { method: "POST", body: JSON.stringify({ body: commentText }) },
                    false,
                  )
                }
              >
                Post comment
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function EmailDraftModal({
  draft,
  onClose,
  onCopy,
}: {
  draft: { to: string | null; subject: string; body: string; source: "api" | "local" };
  onClose: () => void;
  onCopy: () => void;
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
          </div>
        </div>
      </div>
    </div>
  );
}
