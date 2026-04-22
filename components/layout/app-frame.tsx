import Link from "next/link";
import { BarChart3, Building2, Home, MapPinned, Route, Settings2, Users } from "lucide-react";
import type { ReactNode } from "react";

export function AppFrame({ children }: { children: ReactNode }) {
  const organizationName = process.env.ORG_NAME?.trim() || process.env.NEXT_PUBLIC_ORG_NAME?.trim() || "PICC";
  const organizationSlug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG?.trim() || process.env.ORG_SLUG?.trim() || "picc";
  const navigation = [
    { href: "/", label: "Home", icon: Home },
    { href: "/territory", label: "Map", icon: MapPinned },
    { href: "/accounts", label: "Accounts List", icon: Users },
    { href: "/territory?tool=route", label: "Route", icon: Route },
    { href: `/runtime/${organizationSlug}`, label: "Dashboard", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl">
          <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white shadow-[var(--shadow-soft)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Company field operations
                </p>
                <p className="text-base font-semibold tracking-[-0.02em]">{organizationName}</p>
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
            <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-secondary)] sm:inline-flex">
              <Settings2 className="h-4 w-4" />
              Live workspace
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
