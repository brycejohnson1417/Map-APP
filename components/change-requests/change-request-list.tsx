"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MessageSquareText,
  Paperclip,
  PencilLine,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { ChangeRequestRecord } from "@/lib/domain/change-request";
import { CHANGE_REQUEST_CAPTURE_EVENT } from "@/lib/presentation/change-request-capture";

interface RequestDraft {
  problem: string;
  requestedOutcome: string;
  businessContext: string;
  acceptanceCriteria: string;
  attachments: File[];
}

interface ChangeRequestMutationResponse {
  ok: boolean;
  error?: string;
  request?: ChangeRequestRecord;
  warnings?: string[];
}

function statusClass(status: ChangeRequestRecord["status"]) {
  if (status === "resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "declined") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "stale") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  if (status === "requires_additional_feedback") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function statusLabel(status: ChangeRequestRecord["status"]) {
  if (status === "requires_additional_feedback") {
    return "Requires additional feedback";
  }
  if (status === "resolved") {
    return "Resolved";
  }
  if (status === "declined") {
    return "Declined";
  }
  if (status === "stale") {
    return "Stale";
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
  return "Workspace";
}

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isActiveStatus(status: ChangeRequestRecord["status"]) {
  return status === "queued" || status === "requires_additional_feedback";
}

function excerpt(value: string | null | undefined, max = 120) {
  const text = value?.replace(/\s+/g, " ").trim() || "";
  if (!text) {
    return "Untitled request";
  }
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildDraft(request: ChangeRequestRecord): RequestDraft {
  return {
    problem: request.problem,
    requestedOutcome: request.requestedOutcome || request.problem,
    businessContext: request.businessContext || "",
    acceptanceCriteria: request.acceptanceCriteria || "",
    attachments: [],
  };
}

function buildRequestTitle(problem: string, fallback: string) {
  const trimmed = problem.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.length > 80 ? `${trimmed.slice(0, 79)}…` : trimmed;
}

async function readMutationResponse(response: Response): Promise<ChangeRequestMutationResponse> {
  const text = await response.text();
  if (!text) {
    return {
      ok: false,
      error: response.ok ? "The server returned an empty response." : `The server returned ${response.status}.`,
    };
  }

  try {
    return JSON.parse(text) as ChangeRequestMutationResponse;
  } catch {
    return {
      ok: false,
      error: response.ok ? "The server returned an unreadable response." : `The server returned ${response.status}.`,
    };
  }
}

function isRetriableAttachmentTransportError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /string did not match the expected pattern|failed to fetch|networkerror|load failed|body stream/i.test(message);
}

export function ChangeRequestList({
  initialRequests,
  orgSlug,
}: {
  initialRequests: ChangeRequestRecord[];
  orgSlug: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RequestDraft>>({});
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [errorByRequest, setErrorByRequest] = useState<Record<string, string | null>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activeCount = useMemo(
    () => requests.filter((request) => isActiveStatus(request.status)).length,
    [requests],
  );

  function toggleExpanded(requestId: string) {
    setExpandedIds((current) => ({
      ...current,
      [requestId]: !current[requestId],
    }));
  }

  function startEditing(request: ChangeRequestRecord) {
    setEditingId(request.id);
    setExpandedIds((current) => ({ ...current, [request.id]: true }));
    setDrafts((current) => ({
      ...current,
      [request.id]: current[request.id] ?? buildDraft(request),
    }));
    setErrorByRequest((current) => ({ ...current, [request.id]: null }));
  }

  function cancelEditing(requestId: string) {
    setEditingId((current) => (current === requestId ? null : current));
    setDrafts((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });
    setErrorByRequest((current) => ({ ...current, [requestId]: null }));
  }

  function updateDraft(requestId: string, patch: Partial<RequestDraft>) {
    setDrafts((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] ?? { problem: "", requestedOutcome: "", businessContext: "", acceptanceCriteria: "", attachments: [] }),
        ...patch,
      },
    }));
  }

  async function saveRequest(request: ChangeRequestRecord) {
    const draft = drafts[request.id] ?? buildDraft(request);
    const problem = draft.problem.trim();
    const requestedOutcome = (draft.requestedOutcome.trim() || problem).trim();

    if (!problem || !requestedOutcome) {
      setErrorByRequest((current) => ({
        ...current,
        [request.id]: "What should change and requested result are required.",
      }));
      return;
    }

    setBusyRequestId(request.id);
    setErrorByRequest((current) => ({ ...current, [request.id]: null }));

    try {
      let attachmentFallbackNotice: string | null = null;
      const buildFormData = (attachments: File[]) => {
        const formData = new FormData();
        formData.set("title", buildRequestTitle(problem, request.title));
        formData.set("problem", problem);
        formData.set("requestedOutcome", requestedOutcome);
        formData.set("businessContext", draft.businessContext.trim());
        formData.set("acceptanceCriteria", draft.acceptanceCriteria.trim());
        for (const attachment of attachments) {
          formData.append("attachments", attachment);
        }
        return formData;
      };

      let response: Response;
      try {
        response = await fetch(
          `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/change-requests/${encodeURIComponent(request.id)}`,
          {
            method: "PATCH",
            body: buildFormData(draft.attachments),
          },
        );
      } catch (error) {
        if (draft.attachments.length && isRetriableAttachmentTransportError(error)) {
          response = await fetch(
            `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/change-requests/${encodeURIComponent(request.id)}`,
            {
              method: "PATCH",
              body: buildFormData([]),
            },
          );
          attachmentFallbackNotice = "Request updated. Attachments were skipped because this browser could not upload them.";
        } else {
          throw error;
        }
      }

      const payload = await readMutationResponse(response);
      if (!response.ok || !payload.ok || !payload.request) {
        throw new Error(payload.error ?? "Unable to save request.");
      }

      setRequests((current) => current.map((item) => (item.id === request.id ? payload.request! : item)));
      cancelEditing(request.id);
      setNotice(
        payload.warnings?.length
          ? `Request updated. ${payload.warnings.join(" ")}`
          : attachmentFallbackNotice ?? "Request updated.",
      );
    } catch (error) {
      setErrorByRequest((current) => ({
        ...current,
        [request.id]: error instanceof Error ? error.message : "Unable to save request.",
      }));
    } finally {
      setBusyRequestId(null);
    }
  }

  async function deleteRequest(requestId: string) {
    if (!window.confirm("Delete this change request?")) {
      return;
    }

    setBusyRequestId(requestId);
    setErrorByRequest((current) => ({ ...current, [requestId]: null }));

    try {
      const response = await fetch(
        `/api/runtime/organizations/${encodeURIComponent(orgSlug)}/change-requests/${encodeURIComponent(requestId)}`,
        {
          method: "DELETE",
        },
      );
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to delete request.");
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
      setExpandedIds((current) => {
        const next = { ...current };
        delete next[requestId];
        return next;
      });
      cancelEditing(requestId);
      setNotice("Request deleted.");
    } catch (error) {
      setErrorByRequest((current) => ({
        ...current,
        [requestId]: error instanceof Error ? error.message : "Unable to delete request.",
      }));
    } finally {
      setBusyRequestId(null);
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Change requests</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Workspace request queue</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
            Each marked comment lands here as its own request. Open a request to add more detail, attach files, or delete it.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            {activeCount} active request{activeCount === 1 ? "" : "s"}
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(CHANGE_REQUEST_CAPTURE_EVENT))}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-3 text-sm font-semibold text-white"
            style={{ color: "#fff" }}
          >
            <MessageSquareText className="h-4 w-4" />
            Comment
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {notice}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {requests.map((request) => {
          const previewImage = request.attachments.find(
            (attachment) => attachment.signedUrl && attachment.contentType?.startsWith("image/"),
          );
          const expanded = Boolean(expandedIds[request.id]);
          const editing = editingId === request.id;
          const draft = drafts[request.id] ?? buildDraft(request);
          const isBusy = busyRequestId === request.id;
          const hasMoreDetails =
            Boolean(request.businessContext?.trim()) ||
            Boolean(request.acceptanceCriteria?.trim()) ||
            Boolean(request.requestedOutcome?.trim());

          return (
            <article
              key={request.id}
              className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]"
            >
              <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-5">
                {previewImage?.signedUrl ? (
                  <a
                    href={previewImage.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] md:block"
                  >
                    <img
                      src={previewImage.signedUrl}
                      alt={`${request.title} screenshot`}
                      className="h-full w-full object-cover object-top"
                    />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => toggleExpanded(request.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-base font-semibold text-[var(--text-primary)]">
                      {excerpt(request.problem, 140)}
                    </p>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusClass(request.status)}`}
                    >
                      {statusLabel(request.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                    <span>{surfaceLabel(request.surface)}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatRequestedAt(request.createdAt)}
                    </span>
                    {request.attachments.length ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Paperclip className="h-4 w-4" />
                        {request.attachments.length} file{request.attachments.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(request.id)}
                    aria-expanded={expanded}
                    aria-label={expanded ? "Collapse request details" : "Expand request details"}
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
                  >
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {expanded ? (
                <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-4 md:px-5">
                  {previewImage?.signedUrl ? (
                    <a
                      href={previewImage.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-4 block overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]"
                    >
                      <img
                        src={previewImage.signedUrl}
                        alt={`${request.title} screenshot`}
                        className="block h-auto max-h-80 w-full object-cover object-top"
                      />
                    </a>
                  ) : null}

                  {editing ? (
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          What should change
                        </span>
                        <textarea
                          rows={3}
                          value={draft.problem}
                          onChange={(event) => updateDraft(request.id, { problem: event.target.value })}
                          className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                        />
                      </label>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                            Requested result
                          </span>
                          <textarea
                            rows={3}
                            value={draft.requestedOutcome}
                            onChange={(event) => updateDraft(request.id, { requestedOutcome: event.target.value })}
                            placeholder="What should the finished change look like?"
                            className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                            Why it matters
                          </span>
                          <textarea
                            rows={3}
                            value={draft.businessContext}
                            onChange={(event) => updateDraft(request.id, { businessContext: event.target.value })}
                            placeholder="Why does this matter operationally or commercially?"
                            className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                          Done looks like
                        </span>
                        <textarea
                          rows={2}
                          value={draft.acceptanceCriteria}
                          onChange={(event) => updateDraft(request.id, { acceptanceCriteria: event.target.value })}
                          placeholder="How should the harness know this request is actually finished?"
                          className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                        />
                      </label>

                      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Add screenshots or files</p>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                              Upload more screenshots, photos, or notes to this request.
                            </p>
                          </div>
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
                            <Upload className="h-4 w-4" />
                            Add files
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(event) =>
                                updateDraft(request.id, {
                                  attachments: Array.from(event.target.files ?? []),
                                })
                              }
                            />
                          </label>
                        </div>

                        {draft.attachments.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {draft.attachments.map((file) => (
                              <span
                                key={`${file.name}-${file.size}`}
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                              >
                                <Paperclip className="h-3.5 w-3.5" />
                                {file.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {errorByRequest[request.id] ? (
                        <p className="text-sm font-semibold text-[var(--accent-danger)]">{errorByRequest[request.id]}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => cancelEditing(request.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveRequest(request)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                          style={{ color: "#fff" }}
                        >
                          <Save className="h-4 w-4" />
                          Save request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">What should change</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
                          {request.problem}
                        </p>
                      </div>

                      {request.requestedOutcome ? (
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Requested result</p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
                            {request.requestedOutcome}
                          </p>
                        </div>
                      ) : null}

                      {request.businessContext ? (
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Why it matters</p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
                            {request.businessContext}
                          </p>
                        </div>
                      ) : null}

                      {request.acceptanceCriteria ? (
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Done looks like</p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-7 text-[var(--text-secondary)]">
                            {request.acceptanceCriteria}
                          </p>
                        </div>
                      ) : null}

                      {request.attachments.length ? (
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Files</p>
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

                      {errorByRequest[request.id] ? (
                        <p className="text-sm font-semibold text-[var(--accent-danger)]">{errorByRequest[request.id]}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-[var(--text-secondary)]">
                          {hasMoreDetails ? "Open this request to add more files or refine the details." : "Add more detail or files if you want the request to be easier to act on."}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(request)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                          >
                            <PencilLine className="h-4 w-4" />
                            {hasMoreDetails ? "Edit request" : "Add details"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteRequest(request.id)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}

        {!requests.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-6 text-sm text-[var(--text-secondary)]">
            No requests are in the queue yet. Leave comments directly on the screen you want changed and the harness will store each one as its own request.
          </div>
        ) : null}
      </div>
    </section>
  );
}
