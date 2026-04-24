"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import type { WorkspaceTemplateSummary } from "@/lib/domain/workspace";

export function TenantLoginForm({ templates }: { templates: WorkspaceTemplateSummary[] }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/tenant-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        access?: { redirectTo: string };
      };
      if (!response.ok || !payload.ok || !payload.access) {
        throw new Error(payload.error ?? "Login failed");
      }
      window.location.assign(payload.access.redirectTo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#151923] md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <section className="w-full rounded-[2rem] border border-[rgba(23,31,45,0.1)] bg-white p-6 shadow-[0_22px_60px_rgba(28,39,58,0.1)] md:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e2472f] text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#2467dd]">Tenant login</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            Sign in to the right workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#4b5565]">
            Existing tenants can sign in by work email. New teams can choose a template and bootstrap their own workspace.
          </p>
          <form onSubmit={submit} className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[rgba(23,31,45,0.1)] bg-[#eef3f8] px-4 py-3">
              <KeyRound className="h-4 w-4 text-[#727c8d]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#727c8d]"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#151923] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ color: "#fff" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Continue
            </button>
          </form>
          {error ? <p className="mt-4 text-sm font-semibold text-[#d53e2a]">{error}</p> : null}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/onboarding?templateId=${encodeURIComponent(template.id)}`}
                className="rounded-[1.5rem] border border-[rgba(23,31,45,0.08)] bg-[#f8fafc] p-5 transition hover:border-[rgba(23,31,45,0.16)] hover:bg-[#f1f5f9]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2467dd]">{template.templateLabel}</p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#151923]">{template.displayName}</h2>
                <p className="mt-2 text-sm leading-6 text-[#4b5565]">{template.description}</p>
                <p className="mt-4 text-sm font-semibold text-[#151923]">
                  {template.selfServe ? "Self-serve onboarding" : "Guided setup"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
