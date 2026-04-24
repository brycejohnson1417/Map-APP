"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Loader2, Paperclip, SendHorizontal } from "lucide-react";
import type { ChangeRequestClassification, ChangeRequestRecord } from "@/lib/domain/change-request";
import type { WorkspaceDefinition } from "@/lib/domain/workspace";

export function ChangeRequestForm({
  orgSlug,
  workspace,
  onCreated,
}: {
  orgSlug: string;
  workspace: WorkspaceDefinition;
  onCreated: (request: ChangeRequestRecord) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [surface, setSurface] = useState("");
  const [problem, setProblem] = useState("");
  const [requestedOutcome, setRequestedOutcome] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [classification, setClassification] = useState<ChangeRequestClassification | "">("");
  const [files, setFiles] = useState<File[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("surface", surface);
      formData.set("problem", problem);
      formData.set("requestedOutcome", requestedOutcome);
      formData.set("businessContext", businessContext);
      formData.set("acceptanceCriteria", acceptanceCriteria);
      formData.set("currentUrl", window.location.href);
      if (classification) {
        formData.set("classification", classification);
      }
      for (const file of files) {
        formData.append("attachments", file);
      }

      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/change-requests`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; request?: ChangeRequestRecord };
      if (!response.ok || !payload.ok || !payload.request) {
        throw new Error(payload.error ?? "Change request failed");
      }
      onCreated(payload.request);
      setTitle("");
      setSurface("");
      setProblem("");
      setRequestedOutcome("");
      setBusinessContext("");
      setAcceptanceCriteria("");
      setClassification("");
      setFiles([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Change request failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Request change</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Capture the work in the queue, not in chat.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Include the problem, the exact outcome you want, and the business reason so the request can be handled without a long clarification loop.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Add close-rate sort and trend chart"
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Surface</span>
          <input
            value={surface}
            onChange={(event) => setSurface(event.target.value)}
            placeholder="accounts / territory / integrations / account detail"
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold outline-none"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Problem</span>
          <textarea
            rows={4}
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            required
            placeholder="What is broken, missing, or slowing the team down?"
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Requested outcome</span>
          <textarea
            rows={4}
            value={requestedOutcome}
            onChange={(event) => setRequestedOutcome(event.target.value)}
            required
            placeholder="Describe the exact behavior or UI that should exist after this change."
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold outline-none"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_0.7fr]">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Business context</span>
          <textarea
            rows={3}
            value={businessContext}
            onChange={(event) => setBusinessContext(event.target.value)}
            placeholder="Why this matters commercially or operationally."
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Acceptance criteria</span>
          <textarea
            rows={3}
            value={acceptanceCriteria}
            onChange={(event) => setAcceptanceCriteria(event.target.value)}
            placeholder="How we know this is actually done."
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Classification</span>
          <select
            value={classification}
            onChange={(event) => setClassification(event.target.value as ChangeRequestClassification | "")}
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-semibold outline-none"
          >
            <option value="">Auto classify</option>
            {workspace.changeRequests.classifications.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {workspace.changeRequests.allowAttachments ? (
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-4 text-sm font-semibold text-[var(--text-secondary)]">
          <Paperclip className="h-4 w-4" />
          <span>{files.length ? `${files.length} attachment${files.length === 1 ? "" : "s"} selected` : "Attach screenshots or markup files"}</span>
          <input
            type="file"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="sr-only"
          />
        </label>
      ) : null}

      {error ? <p className="mt-4 text-sm font-semibold text-[var(--accent-danger)]">{error}</p> : null}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ color: "#fff" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
          Submit request
        </button>
      </div>
    </form>
  );
}
