import "server-only";

import {
  getScreenprintingAccountCleanup,
  getScreenprintingSalesDashboard,
  getScreenprintingSocialDashboard,
  listScreenprintingOpportunities,
  listScreenprintingReorders,
} from "@/lib/application/screenprinting/screenprinting-service";
import { getTerritoryRuntimeDashboard } from "@/lib/application/runtime/territory-service";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";

export type RepTodayActionTone = "red" | "amber" | "blue" | "green" | "slate";

export interface RepTodayAction {
  id: string;
  label: string;
  title: string;
  body: string;
  href: string;
  count: number;
  status: "ready" | "empty" | "needs_setup";
  tone: RepTodayActionTone;
}

export interface RepTodaySummary {
  orgSlug: string;
  organizationName: string;
  tenantLabel: string;
  isEmpty: boolean;
  metrics: Array<{ label: string; value: string; detail: string }>;
  actions: RepTodayAction[];
  setupHref: string;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function orgHref(path: string, orgSlug: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}org=${encodeURIComponent(orgSlug)}`;
}

function actionStatus(count: number): RepTodayAction["status"] {
  return count > 0 ? "ready" : "empty";
}

export async function getRepTodaySummary(orgSlug: string): Promise<RepTodaySummary> {
  const [workspaceExperience, territoryDashboard] = await Promise.all([
    getWorkspaceExperienceBySlug(orgSlug),
    getTerritoryRuntimeDashboard(orgSlug, {}),
  ]);
  const organizationName =
    territoryDashboard?.organization.name ??
    workspaceExperience.organization?.name ??
    workspaceExperience.workspace.displayName;
  const tenantLabel = workspaceExperience.workspace.tenantType?.displayName ?? workspaceExperience.workspace.templateLabel;
  const accountCount = territoryDashboard?.counts.accounts ?? 0;
  const orderCount = territoryDashboard?.counts.orders ?? 0;
  const contactCount = territoryDashboard?.counts.contacts ?? 0;
  const missingAddressCount = territoryDashboard?.counts.noAddressAvailable ?? 0;
  const missingReferralCount = territoryDashboard?.counts.noReferralSource ?? 0;

  if (accountCount === 0) {
    return {
      orgSlug,
      organizationName,
      tenantLabel,
      isEmpty: true,
      setupHref: orgHref("/integrations", orgSlug),
      metrics: [
        { label: "Accounts", value: "0", detail: "Import or connect a source first" },
        { label: "Orders", value: formatNumber(orderCount), detail: "Waiting on account data" },
        { label: "Contacts", value: formatNumber(contactCount), detail: "Waiting on account data" },
      ],
      actions: [
        {
          id: "setup",
          label: "Setup",
          title: "Connect data before working today",
          body: "Import the first account list or connect the tenant's source systems before the daily workspace can prioritize actions.",
          href: orgHref("/integrations", orgSlug),
          count: 0,
          status: "needs_setup",
          tone: "amber",
        },
      ],
    };
  }

  if (workspaceExperience.workspace.modules.screenprinting?.variant) {
    const [salesDashboard, opportunities, reorders, socialDashboard, accountCleanup] = await Promise.all([
      getScreenprintingSalesDashboard(orgSlug),
      listScreenprintingOpportunities(orgSlug),
      listScreenprintingReorders(orgSlug),
      getScreenprintingSocialDashboard(orgSlug),
      getScreenprintingAccountCleanup(orgSlug),
    ]);
    const overdueReorders = reorders.buckets.overdue.length;
    const dueReorders = reorders.buckets.due.length;
    const reorderCount = overdueReorders + dueReorders;
    const opportunityCount = opportunities.pipelines.reduce(
      (sum, pipeline) => sum + pipeline.stages.reduce((stageSum, stage) => stageSum + stage.opportunities.length, 0),
      0,
    );
    const unreadSocialAlerts = socialDashboard.metrics.unreadAlerts;
    const cleanupCount = accountCleanup.counts.unlinkedOrders + accountCleanup.counts.mergeSuggestions;
    const revenue = salesDashboard.metrics.revenue;

    return {
      orgSlug,
      organizationName,
      tenantLabel,
      isEmpty: false,
      setupHref: orgHref("/integrations", orgSlug),
      metrics: [
        { label: "Revenue tracked", value: formatMoney(revenue), detail: `${formatNumber(orderCount)} synced orders` },
        { label: "Due now", value: formatNumber(reorderCount), detail: `${formatNumber(overdueReorders)} overdue reorders` },
        { label: "Open follow-up", value: formatNumber(opportunityCount), detail: "Quotes, opportunities, and social leads" },
        { label: "Data cleanup", value: formatNumber(cleanupCount), detail: "Identity and account records to review" },
      ],
      actions: [
        {
          id: "reorders",
          label: "Work reorders",
          title: "Work reorders",
          body: "Start with accounts whose expected repeat-order window is due or overdue.",
          href: orgHref("/screenprinting?view=sales&salesView=reorders", orgSlug),
          count: reorderCount,
          status: actionStatus(reorderCount),
          tone: overdueReorders ? "red" : "amber",
        },
        {
          id: "opportunities",
          label: "Review opportunities",
          title: "Review opportunities",
          body: "Review open quote follow-ups and product-owned opportunities before they go stale.",
          href: orgHref("/screenprinting?view=sales&salesView=opportunities", orgSlug),
          count: opportunityCount,
          status: actionStatus(opportunityCount),
          tone: "blue",
        },
        {
          id: "route",
          label: "Open route mode",
          title: "Open route mode",
          body: "Move from account priority to the map execution layer when visits or regional follow-up make sense.",
          href: orgHref("/territory", orgSlug),
          count: territoryDashboard?.pins.length ?? 0,
          status: actionStatus(territoryDashboard?.pins.length ?? 0),
          tone: "green",
        },
        {
          id: "cleanup",
          label: "Fix missing data",
          title: "Fix missing data",
          body: "Resolve missing locations, unlinked orders, and identity suggestions so future signals become more reliable.",
          href: orgHref("/screenprinting?view=sales&salesView=accounts", orgSlug),
          count: cleanupCount + missingAddressCount,
          status: actionStatus(cleanupCount + missingAddressCount),
          tone: cleanupCount || missingAddressCount ? "amber" : "slate",
        },
        {
          id: "social",
          label: "Review social signals",
          title: "Review social signals",
          body: "Check unread Instagram/social alerts and connect conversations back to accounts or opportunities.",
          href: orgHref("/screenprinting?view=social&socialView=alerts", orgSlug),
          count: unreadSocialAlerts,
          status: actionStatus(unreadSocialAlerts),
          tone: unreadSocialAlerts ? "amber" : "slate",
        },
      ],
    };
  }

  return {
    orgSlug,
    organizationName,
    tenantLabel,
    isEmpty: false,
    setupHref: orgHref("/integrations", orgSlug),
    metrics: [
      { label: "Accounts", value: formatNumber(accountCount), detail: "Ready for rep work" },
      { label: "Orders", value: formatNumber(orderCount), detail: "Imported or synced records" },
      { label: "Contacts", value: formatNumber(contactCount), detail: "People linked to accounts" },
      { label: "Missing data", value: formatNumber(missingAddressCount + missingReferralCount), detail: "Cleanup items" },
    ],
    actions: [
      {
        id: "route",
        label: "Open route mode",
        title: "Open route mode",
        body: "Use the map when the next action should become a field visit or territory sweep.",
        href: orgHref("/territory", orgSlug),
        count: territoryDashboard?.pins.length ?? 0,
        status: actionStatus(territoryDashboard?.pins.length ?? 0),
        tone: "green",
      },
      {
        id: "accounts",
        label: "Review accounts",
        title: "Review accounts",
        body: "Open the account list to search companies, owners, statuses, and locations.",
        href: orgHref("/accounts", orgSlug),
        count: accountCount,
        status: actionStatus(accountCount),
        tone: "blue",
      },
      {
        id: "cleanup",
        label: "Fix missing data",
        title: "Fix missing data",
        body: "Clean up missing address or referral fields so map and signal quality improves.",
        href: orgHref("/accounts", orgSlug),
        count: missingAddressCount + missingReferralCount,
        status: actionStatus(missingAddressCount + missingReferralCount),
        tone: missingAddressCount + missingReferralCount ? "amber" : "slate",
      },
      {
        id: "sources",
        label: "Link source systems",
        title: "Link source systems",
        body: "Connect CRM, order, social, or spreadsheet sources that should feed the rep workspace.",
        href: orgHref("/integrations", orgSlug),
        count: 0,
        status: "ready",
        tone: "slate",
      },
    ],
  };
}
