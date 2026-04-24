"use client";

import { useState } from "react";
import { ExternalLink, MessageSquareText, Paperclip } from "lucide-react";
import type { ChangeRequestRecord } from "@/lib/domain/change-request";
import type { WorkspaceDefinition } from "@/lib/domain/workspace";
import { ChangeRequestForm } from "@/components/change-requests/change-request-form";

function statusClass(status: ChangeRequestRecord["status"]) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "planned") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (status === "clarifying") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]";
}

function classificationClass(classification: ChangeRequestRecord["classification"]) {
  if (classification === "core") {
    return "bg-rose-100 text-rose-700";
  }
  if (classification === "primitive") {
    return "bg-amber-100 text-amber-800";
  }
  if (classification === "package") {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-emerald-100 text-emerald-700";
}

export function ChangeRequestList({
  orgSlug,
  workspace,
  initialRequests,
}: {
  orgSlug: string;
  workspace: WorkspaceDefinition;
  initialRequests: ChangeRequestRecord[];
}) {
  const [requests, setRequests] = useState(initialRequests);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <ChangeRequestForm
        orgSlug={orgSlug}
        workspace={workspace}
        onCreated={(request) => setRequests((current) => [request, ...current])}
      />

      <section className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Queue</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Workspace change backlog</h2>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em]">{request.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{request.requestedByEmail}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                  <span className={`rounded-full px-3 py-2 ${classificationClass(request.classification)}`}>{request.classification}</span>
                  <span className={`rounded-full border px-3 py-2 ${statusClass(request.status)}`}>{request.status}</span>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{request.problem}</p>
              <div className="mt-4 grid gap-3 text-sm">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Requested outcome</p>
                  <p className="mt-1 text-[var(--text-secondary)]">{request.requestedOutcome}</p>
                </div>
                {request.acceptanceCriteria ? (
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Acceptance criteria</p>
                    <p className="mt-1 text-[var(--text-secondary)]">{request.acceptanceCriteria}</p>
                  </div>
                ) : null}
                {request.classifierNotes ? (
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Classifier notes</p>
                    <p className="mt-1 text-[var(--text-secondary)]">{request.classifierNotes}</p>
                  </div>
                ) : null}
                {request.attachments.length ? (
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Attachments</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.signedUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {attachment.fileName}
                          {attachment.signedUrl ? <ExternalLink className="h-3.5 w-3.5" /> : null}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {!requests.length ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--text-secondary)]">
              No queued requests yet. Use the form to move workspace changes into the governed backlog.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
