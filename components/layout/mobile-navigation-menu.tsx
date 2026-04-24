"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function MobileNavigationMenu({
  organizationName,
  items,
}: {
  organizationName: string;
  items: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-[var(--shadow-soft)] md:hidden"
        aria-label="Open workspace navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] md:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[rgba(15,23,42,0.28)]"
            aria-label="Close workspace navigation"
          />
          <div className="absolute inset-x-3 top-3 rounded-[1.5rem] border border-[rgba(21,25,35,0.1)] bg-[rgba(255,255,255,0.96)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-1 pb-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Workspace navigation</p>
                <p className="mt-1 truncate text-base font-semibold text-[var(--text-primary)]">{organizationName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)]"
                aria-label="Close workspace navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-3 flex flex-col gap-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={classNames(
                    "inline-flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]",
                  )}
                >
                  <span>{item.label}</span>
                  <span className="text-[var(--text-tertiary)]">Open</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
