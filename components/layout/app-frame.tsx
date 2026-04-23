import Link from "next/link";
import { BarChart3, Building2, Home, MapPinned, Route, Settings2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { defaultOrgSlug, orgScopedHref } from "@/lib/presentation/org-slug";

export function AppFrame({
  children,
  organizationName,
  organizationSlug,
}: {
  children: ReactNode;
  organizationName?: string;
  organizationSlug?: string;
}) {
  const activeOrganizationName =
    organizationName?.trim() || process.env.ORG_NAME?.trim() || process.env.NEXT_PUBLIC_ORG_NAME?.trim() || "PICC";
  const activeOrganizationSlug = organizationSlug?.trim() || defaultOrgSlug();
  const isFraternitees = activeOrganizationSlug === "fraternitees";
  const homeHref = isFraternitees ? orgScopedHref("/accounts", activeOrganizationSlug) : "/";
  const navigation = isFraternitees
    ? [
        { href: orgScopedHref("/accounts", activeOrganizationSlug), label: "Accounts", icon: Users },
        { href: orgScopedHref("/territory", activeOrganizationSlug), label: "Map", icon: MapPinned },
        { href: orgScopedHref("/integrations", activeOrganizationSlug), label: "Integrations & Plugins", icon: Settings2 },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: orgScopedHref("/territory", activeOrganizationSlug), label: "Map", icon: MapPinned },
        { href: orgScopedHref("/accounts", activeOrganizationSlug), label: "Accounts List", icon: Users },
        { href: orgScopedHref("/territory?tool=route", activeOrganizationSlug), label: "Route", icon: Route },
        { href: `/runtime/${activeOrganizationSlug}`, label: "Dashboard", icon: BarChart3 },
      ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl">
          <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 md:px-6">
            <Link href={homeHref} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white shadow-[var(--shadow-soft)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Company field operations
                </p>
                <p className="text-base font-semibold tracking-[-0.02em]">{activeOrganizationName}</p>
              </div>
            </Link>
            <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
