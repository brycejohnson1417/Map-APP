import Link from "next/link";
import { BarChart3, Building2, Home, MapPinned, MessagesSquare, Route, Settings2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { getTenantSessionEmailForSlug } from "@/lib/application/auth/tenant-session";
import { getWorkspaceExperienceBySlug } from "@/lib/application/workspace/workspace-service";
import { ChangeRequestCaptureLauncher } from "@/components/change-requests/change-request-capture-launcher";
import { MobileNavigationMenu } from "@/components/layout/mobile-navigation-menu";
import { defaultOrgSlug, orgScopedHref } from "@/lib/presentation/org-slug";

const navigationIcons = {
  BarChart3,
  Home,
  MapPinned,
  MessagesSquare,
  Route,
  Settings2,
  Users,
} as const;

export async function AppFrame({
  children,
  organizationName,
  organizationSlug,
}: {
  children: ReactNode;
  organizationName?: string;
  organizationSlug?: string;
}) {
  const activeOrganizationSlug = organizationSlug?.trim() || defaultOrgSlug();
  const workspace = await getWorkspaceExperienceBySlug(activeOrganizationSlug);
  const activeOrganizationName =
    organizationName?.trim() ||
    workspace.organization?.name ||
    process.env.ORG_NAME?.trim() ||
    process.env.NEXT_PUBLIC_ORG_NAME?.trim() ||
    workspace.workspace.displayName ||
    "Map App Harness";
  const homeHref = orgScopedHref(workspace.defaultRedirectPath, activeOrganizationSlug);
  const navigation = workspace.navigation.map((item) => ({
    ...item,
    href: item.href.startsWith("/runtime/") ? item.href : orgScopedHref(item.href, activeOrganizationSlug),
    icon: navigationIcons[item.icon as keyof typeof navigationIcons] ?? Home,
  }));
  const tenantSessionEmail =
    workspace.allowChangeRequests && workspace.organization ? await getTenantSessionEmailForSlug(activeOrganizationSlug) : null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl">
          <div className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-6">
            <Link href={homeHref} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white shadow-[var(--shadow-soft)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {workspace.workspace.branding.heroEyebrow}
                </p>
                <p className="truncate text-base font-semibold tracking-[-0.02em]">{activeOrganizationName}</p>
              </div>
            </Link>
            <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              {workspace.allowChangeRequests && workspace.organization && tenantSessionEmail ? (
                <ChangeRequestCaptureLauncher orgSlug={activeOrganizationSlug} workspace={workspace.workspace} compact />
              ) : null}
              <MobileNavigationMenu
                organizationName={activeOrganizationName}
                items={navigation.map((item) => ({ href: item.href, label: item.label }))}
              />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
