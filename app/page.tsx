import Link from "next/link";
import { ArrowRight, Database, MapPinned, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { AppFrame } from "@/components/layout/app-frame";
import { HeroGrid } from "@/components/marketing/hero-grid";
import { SectionCard } from "@/components/ui/section-card";
import { architecturePrinciples, buildPhases, platformCapabilities } from "@/lib/content/home";

export default function HomePage() {
  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 md:py-10">
        <section className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-1.5 text-sm font-medium text-[var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-success)]" />
              Supabase-first internal platform rebuild
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-7xl">
                MAP APP
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[var(--text-secondary)] md:text-xl">
                A local-first CRM and territory operations platform for cannabis distribution teams. Built to feel
                unified, sync fast, and scale without turning every screen into a live dependency on Notion.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/territory"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-primary-strong)]"
              >
                Open Territory Foundation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/architecture"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
              >
                Review Architecture
              </Link>
            </div>
          </div>
          <HeroGrid />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SectionCard
            icon={MapPinned}
            title="Local-first map"
            description="Pins, boundaries, and markers should load from Postgres views, not live Notion fetches."
          />
          <SectionCard
            icon={RefreshCw}
            title="Incremental sync"
            description="Every integration writes deltas into runtime tables with explicit cursors and retryable jobs."
          />
          <SectionCard
            icon={Database}
            title="Deterministic identity"
            description="Licensed Location ID and Retailer ID become the real matching spine across Nabis and CRM."
          />
          <SectionCard
            icon={ShieldCheck}
            title="Shared operations"
            description="Admin-only editing, team-visible territory layers, and audit-safe updates by default."
          />
          <SectionCard
            icon={Zap}
            title="Enterprise posture"
            description="Smaller payloads, explicit freshness, observability hooks, and cleaner runtime boundaries."
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Architecture Principles</h2>
              <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                non-negotiable
              </span>
            </div>
            <div className="grid gap-4">
              {architecturePrinciples.map((principle) => (
                <div
                  key={principle.title}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{principle.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Rebuild Track</h2>
              <span className="rounded-full bg-[var(--accent-secondary-soft)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--accent-secondary-strong)]">
                phased
              </span>
            </div>
            <div className="space-y-4">
              {buildPhases.map((phase) => (
                <div key={phase.name} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold">{phase.name}</h3>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">{phase.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{phase.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-6 flex flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Platform Capabilities</h2>
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
              This rebuild is intentionally organized around a single account system, explicit sync pipelines, and
              smaller specialized read models instead of a pile of disconnected mini-apps.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformCapabilities.map((capability) => (
              <div
                key={capability.title}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5"
              >
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{capability.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{capability.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
