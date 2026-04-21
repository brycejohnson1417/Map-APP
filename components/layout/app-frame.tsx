import Link from "next/link";
import { Building2, LayoutDashboard, MapPinned, Network, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/territory", label: "Territory", icon: MapPinned },
  { href: "/architecture", label: "Architecture", icon: Network },
];

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5 md:px-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-primary)] text-white shadow-[var(--shadow-soft)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
                  Multi-tenant field operations platform
                </p>
                <p className="text-base font-semibold tracking-[-0.02em]">Map App Harness</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2 text-sm text-[var(--text-secondary)]">
              <Settings2 className="h-4 w-4" />
              Platform foundation
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
