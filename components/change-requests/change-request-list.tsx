"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, MessageSquareText, Paperclip } from "lucide-react";
import type { ChangeRequestRecord } from "@/lib/domain/change-request";
import { CHANGE_REQUEST_CAPTURE_EVENT } from "@/lib/presentation/change-request-capture";

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

function statusLabel(status: ChangeRequestRecord["status"]) {
  if (status === "clarifying") {
    return "Need a little more detail";
  }
  if (status === "planned") {
    return "Planned";
  }
  if (status === "completed") {
    return "Completed";
  }
  return "Queued";
}

function surfaceLabel(surface: string | null) {
  if (surface === "territory") {
    return "Territory map";
  }
  if (surface === "accounts") {
    return "Accounts";
  }
  if (surface === "account_detail") {
    return "Account detail";
  }
  if (surface === "integrations") {
    return "Integrations and plugins";
  }
  if (surface === "change_requests") {
    return "Change queue";
  }
  if (surface === "runtime") {
    return "Runtime";
  }
  return "Workspace";
}

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ChangeRequestList({
  initialRequests,
}: {
  initialRequests: ChangeRequestRecord[];
}) {
  const [requests, setRequests] = useState(initialRequests);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const queuedCount = useMemo(
    () => requests.filter((request) => request.status !== "completed").length,
    [requests],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <section className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <MessageSquareText className="mt-1 h-5 w-5 text-[var(--accent-secondary-strong)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Comment a request
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
              Mark the screen and explain it in plain language.
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
          Go to the page you want changed, click <span className="font-semibold text-[var(--text-primary)]">Comment a request</span> in the header, drag over the part of the screen you mean, add one or more comments, then submit it. The harness keeps the annotated screenshot with your notes so the work lands in the queue with the right context.
        </p>

        <div className="mt-5 grid gap-3">
          {[
            "Open the screen you want changed.",
            "Mark each area and write what should change there.",
            "Submit once when all comments are on the page.",
          ].map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)] text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="text-sm text-[var(--text-secondary)]">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Need to comment on this screen instead?</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            You can open comment mode here too, but the best signal comes from leaving comments directly on the page you want changed.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(CHANGE_REQUEST_CAPTURE_EVENT))}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white"
            style={{ color: "#fff" }}
          >
            Comment this screen
          </button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <MessageSquareText className="h-5 w-5 text-[var(--accent-secondary-strong)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Queue</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Workspace change backlog</h2>
            </div>
          </div>
          <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            {queuedCount} active request{queuedCount === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {requests.map((request) => {
            const previewImage = request.attachments.find(
              (attachment) => attachment.signedUrl && attachment.contentType?.startsWith("image/"),
            );

            return (
              <article
                key={request.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold tracking-[-0.02em]">{request.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
                      <span>{request.requestedByEmail}</span>
                      <span>{surfaceLabel(request.surface)}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        {formatRequestedAt(request.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${statusClass(request.status)}`}>
                    {statusLabel(request.status)}
                  </span>
                </div>

                {previewImage?.signedUrl ? (
                  <a
                    href={previewImage.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]"
                  >
                    <img
                      src={previewImage.signedUrl}
                      alt={`${request.title} screenshot`}
                      className="block h-auto max-h-72 w-full object-cover object-top"
                    />
                  </a>
                ) : null}

                <div className="mt-4 grid gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">What should change</p>
                    <p className="mt-1 whitespace-pre-line leading-7 text-[var(--text-secondary)]">{request.problem}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Requested result</p>
                    <p className="mt-1 whitespace-pre-line leading-7 text-[var(--text-secondary)]">{request.requestedOutcome}</p>
                  </div>
                  {request.businessContext ? (
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Why it matters</p>
                      <p className="mt-1 whitespace-pre-line leading-7 text-[var(--text-secondary)]">{request.businessContext}</p>
                    </div>
                  ) : null}
                  {request.acceptanceCriteria ? (
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Done looks like</p>
                      <p className="mt-1 whitespace-pre-line leading-7 text-[var(--text-secondary)]">{request.acceptanceCriteria}</p>
                    </div>
                  ) : null}
                  {request.attachments.length ? (
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">Files</p>
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
            );
          })}

          {!requests.length ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--text-secondary)]">
              No requests are in the queue yet. Leave comments directly on the screen you want changed and the harness will store the screenshot with your notes.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
