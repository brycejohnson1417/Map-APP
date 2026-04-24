"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, Building2, Loader2, Mail, Rocket } from "lucide-react";
import type { WorkspaceTemplateSummary } from "@/lib/domain/workspace";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function WorkspaceOnboardingForm({
  templates,
  defaultTemplateId,
  defaultEmail,
}: {
  templates: WorkspaceTemplateSummary[];
  defaultTemplateId?: string;
  defaultEmail?: string;
}) {
  const [templateId, setTemplateId] = useState(defaultTemplateId ?? templates[0]?.id ?? "field-ops-starter");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          email,
          companyName,
          slug: slug || slugify(companyName),
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        redirectTo?: string;
      };
      if (!response.ok || !payload.ok || !payload.redirectTo) {
        throw new Error(payload.error ?? "Workspace bootstrap failed");
      }
      window.location.assign(payload.redirectTo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Workspace bootstrap failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#151923] md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-6 lg:flex-row">
        <section className="rounded-[2rem] border border-[rgba(23,31,45,0.1)] bg-white p-6 shadow-[0_22px_60px_rgba(28,39,58,0.1)] md:p-10 lg:w-[42%]">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e2472f] text-white">
            <Rocket className="h-6 w-6" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-[#2467dd]">Workspace onboarding</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">Create a tenant workspace without touching code.</h1>
          <p className="mt-4 text-base leading-7 text-[#4b5565]">
            Pick a template, claim a slug, and land directly in the connector setup for the new workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#727c8d]">Template</span>
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[rgba(23,31,45,0.1)] bg-[#eef3f8] px-4 py-3 text-sm font-semibold outline-none"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.templateLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#727c8d]">Company name</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[rgba(23,31,45,0.1)] bg-[#eef3f8] px-4 py-3">
                <Building2 className="h-4 w-4 text-[#727c8d]" />
                <input
                  value={companyName}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setCompanyName(nextName);
                    if (!slug) {
                      setSlug(slugify(nextName));
                    }
                  }}
                  placeholder="Acme Field Ops"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#727c8d]"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#727c8d]">Work email</span>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[rgba(23,31,45,0.1)] bg-[#eef3f8] px-4 py-3">
                <Mail className="h-4 w-4 text-[#727c8d]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ops@company.com"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#727c8d]"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#727c8d]">Workspace slug</span>
              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="acme-field-ops"
                className="mt-2 w-full rounded-xl border border-[rgba(23,31,45,0.1)] bg-[#eef3f8] px-4 py-3 text-sm font-semibold outline-none placeholder:text-[#727c8d]"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#151923] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              style={{ color: "#fff" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Create workspace
            </button>
            {error ? <p className="text-sm font-semibold text-[#d53e2a]">{error}</p> : null}
          </form>
        </section>

        <section className="grid flex-1 gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setTemplateId(template.id)}
              className={`rounded-[1.75rem] border p-6 text-left shadow-[0_22px_60px_rgba(28,39,58,0.08)] transition ${
                template.id === templateId
                  ? "border-[#151923] bg-white"
                  : "border-[rgba(23,31,45,0.08)] bg-white/70 hover:border-[rgba(23,31,45,0.16)]"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2467dd]">{template.templateLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{template.displayName}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4b5565]">{template.description}</p>
              <div className="mt-5 space-y-2 text-sm text-[#151923]">
                <p className="font-semibold">{template.selfServe ? "Self-serve" : "Guided"} onboarding</p>
                <p>{template.branding.heroDescription}</p>
                <p>{template.connectors.length} connector{template.connectors.length === 1 ? "" : "s"} in the starter flow</p>
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
