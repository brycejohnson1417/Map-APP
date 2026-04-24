"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquareText, Paperclip, SendHorizontal, Trash2, X } from "lucide-react";
import type { ChangeRequestRecord } from "@/lib/domain/change-request";
import type { WorkspaceDefinition } from "@/lib/domain/workspace";
import {
  CHANGE_REQUEST_CAPTURE_EVENT,
  createChangeRequestTitle,
  inferChangeRequestSurface,
} from "@/lib/presentation/change-request-capture";

interface CaptureSnapshot {
  dataUrl: string;
  width: number;
  height: number;
}

interface CommentAnnotation {
  id: string;
  x: number;
  y: number;
  note: string;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

async function captureVisibleViewport() {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(document.body, {
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#f5f7fb",
    logging: false,
    useCORS: true,
    scale: Math.min(window.devicePixelRatio || 1, 2),
    width: window.innerWidth,
    height: window.innerHeight,
    x: window.scrollX,
    y: window.scrollY,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: window.innerHeight,
    ignoreElements: (element) =>
      element instanceof HTMLElement && element.dataset.changeRequestUi === "true",
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  } satisfies CaptureSnapshot;
}

function inferImageContentType(dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,/);
  return match?.[1] || "image/png";
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load captured screenshot."));
    image.src = dataUrl;
  });
}

async function createAnnotatedScreenshotFile(
  capture: CaptureSnapshot,
  comments: CommentAnnotation[],
  fileName: string,
) {
  const image = await loadImage(capture.dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = capture.width;
  canvas.height = capture.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create screenshot markup.");
  }

  context.drawImage(image, 0, 0, capture.width, capture.height);

  comments.forEach((comment, index) => {
    const x = comment.x * capture.width;
    const y = comment.y * capture.height;

    context.beginPath();
    context.fillStyle = "rgba(226, 71, 47, 0.18)";
    context.arc(x, y, 28, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.strokeStyle = "#e2472f";
    context.lineWidth = 5;
    context.arc(x, y, 18, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "#151923";
    context.beginPath();
    context.arc(x, y, 16, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#ffffff";
    context.font = "bold 18px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(index + 1), x, y + 1);
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, inferImageContentType(capture.dataUrl), 0.92);
  });

  if (!blob) {
    throw new Error("Unable to generate annotated screenshot.");
  }

  return new File([blob], fileName, { type: blob.type || "image/png" });
}

function createAnnotationNotesFile(input: {
  currentUrl: string;
  surfaceLabel: string;
  summary: string;
  businessContext: string;
  comments: CommentAnnotation[];
}) {
  const lines = [
    `Surface: ${input.surfaceLabel}`,
    `URL: ${input.currentUrl}`,
    input.summary.trim() ? `Summary: ${input.summary.trim()}` : null,
    input.businessContext.trim() ? `Why it matters: ${input.businessContext.trim()}` : null,
    "",
    "Comments:",
    ...input.comments.map(
      (comment, index) => `${index + 1}. ${comment.note.trim()} (x=${Math.round(comment.x * 100)}%, y=${Math.round(comment.y * 100)}%)`,
    ),
  ]
    .filter(Boolean)
    .join("\n");

  return new File([lines], "request-notes.txt", { type: "text/plain" });
}

function commentMarkerStyle(comment: CommentAnnotation) {
  return {
    left: `${comment.x * 100}%`,
    top: `${comment.y * 100}%`,
    transform: "translate(-50%, -50%)",
  };
}

function commentComposerStyle(comment: CommentAnnotation) {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    const top = Math.min(72, Math.max(24, comment.y * 100));
    return {
      left: "50%",
      top: `${top}%`,
      transform: "translate(-50%, 18px)",
    };
  }

  const alignRight = comment.x > 0.72;
  const alignBottom = comment.y > 0.7;

  return {
    left: `${comment.x * 100}%`,
    top: `${comment.y * 100}%`,
    transform: `translate(${alignRight ? "-100%" : "0"}, ${alignBottom ? "-100%" : "0"}) translate(${alignRight ? "-18px" : "18px"}, ${alignBottom ? "-18px" : "18px"})`,
  };
}

function normalizePoint(clientX: number, clientY: number, rect: DOMRect) {
  const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
  const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
  return {
    x: rect.width ? x / rect.width : 0,
    y: rect.height ? y / rect.height : 0,
  };
}

export function ChangeRequestCaptureLauncher({
  orgSlug,
  workspace,
  compact = false,
  onCreated,
}: {
  orgSlug: string;
  workspace: WorkspaceDefinition;
  compact?: boolean;
  onCreated?: (request: ChangeRequestRecord) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const surfaceContext = useMemo(() => inferChangeRequestSurface(pathname), [pathname]);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [comments, setComments] = useState<CommentAnnotation[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const resetState = useCallback(() => {
    setSummary("");
    setBusinessContext("");
    setComments([]);
    setActiveCommentId(null);
    setDetailsOpen(false);
    setError(null);
    setCaptureNotice(null);
  }, []);

  const openCaptureStudio = useCallback(() => {
    setNotice(null);
    setError(null);
    resetState();
    setOpen(true);
  }, [resetState]);

  useEffect(() => {
    const handler = () => {
      openCaptureStudio();
    };

    window.addEventListener(CHANGE_REQUEST_CAPTURE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_REQUEST_CAPTURE_EVENT, handler);
  }, [openCaptureStudio]);

  function closeMode() {
    setOpen(false);
    setError(null);
    resetState();
  }

  function addCommentAt(clientX: number, clientY: number) {
    if (!canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const point = normalizePoint(clientX, clientY, rect);
    const id = crypto.randomUUID();
    setComments((current) => [...current, { id, ...point, note: "" }]);
    setActiveCommentId(id);
    setDetailsOpen(true);
    setError(null);
  }

  function updateComment(id: string, note: string) {
    setComments((current) =>
      current.map((comment) => (comment.id === id ? { ...comment, note } : comment)),
    );
  }

  function removeComment(id: string) {
    setComments((current) => current.filter((comment) => comment.id !== id));
    setActiveCommentId((current) => (current === id ? null : current));
  }

  async function submitRequest() {
    const completedComments = comments.filter((comment) => comment.note.trim());
    const incompleteComment = comments.find((comment) => !comment.note.trim());

    if (!completedComments.length) {
      setDetailsOpen(true);
      setError("Add at least one comment before you submit.");
      return;
    }

    if (incompleteComment) {
      setActiveCommentId(incompleteComment.id);
      setDetailsOpen(true);
      setError("Every comment needs text before you submit.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setCaptureNotice(null);

    try {
      let captureWarning: string | null = null;
      const currentUrl = `${window.location.origin}${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      const title = createChangeRequestTitle({
        label: surfaceContext.label,
        summary,
        commentCount: completedComments.length,
      });
      const problem = [
        `On-screen comments from the ${surfaceContext.label}.`,
        "Comments:",
        ...completedComments.map((comment, index) => `${index + 1}. ${comment.note.trim()}`),
      ].join("\n");
      const requestedOutcome =
        summary.trim() || `Implement the numbered comments shown on the attached screenshot of the ${surfaceContext.label}.`;
      const acceptanceCriteria = `The affected ${surfaceContext.label} matches the numbered comments shown on the attached screenshot.`;

      const formData = new FormData();
      formData.set("title", title);
      formData.set("surface", surfaceContext.surface);
      formData.set("problem", problem);
      formData.set("requestedOutcome", requestedOutcome);
      formData.set(
        "businessContext",
        businessContext.trim() || `Submitted from the ${surfaceContext.label} using the inline comment mode.`,
      );
      formData.set("acceptanceCriteria", acceptanceCriteria);
      formData.set("currentUrl", currentUrl);

      if (workspace.changeRequests.allowAttachments) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

        try {
          const capture = await captureVisibleViewport();
          const screenshotFile = await createAnnotatedScreenshotFile(
            capture,
            completedComments,
            `${surfaceContext.surface}-${timestamp}.png`,
          );
          formData.append("attachments", screenshotFile);
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "Unable to generate the annotated screenshot.";
          captureWarning = /unsupported color function "color"/i.test(message)
            ? "Request submitted without the screenshot because this browser returned a CSS color format the capture renderer could not read."
            : `Request submitted without the screenshot: ${message}`;
        }

        formData.append(
          "attachments",
          createAnnotationNotesFile({
            currentUrl,
            surfaceLabel: surfaceContext.label,
            summary,
            businessContext,
            comments: completedComments,
          }),
        );

        if (captureWarning) {
          setCaptureNotice(captureWarning);
        }
      }

      const response = await fetch(`/api/runtime/organizations/${encodeURIComponent(orgSlug)}/change-requests`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; request?: ChangeRequestRecord };
      if (!response.ok || !payload.ok || !payload.request) {
        throw new Error(payload.error ?? "Unable to submit request.");
      }

      onCreated?.(payload.request);
      setNotice(
        captureWarning
          ? `Request added to the queue. ${captureWarning}`
          : "Request added to the queue.",
      );
      setOpen(false);
      resetState();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeComment = comments.find((comment) => comment.id === activeCommentId) ?? null;
  const overlay =
    open && typeof document !== "undefined" ? (
      <div
        data-change-request-ui="true"
        className="fixed inset-0 z-[140]"
      >
        <div className="pointer-events-none absolute left-3 top-3 z-[4] hidden md:block md:left-5 md:top-4">
          <div className="pointer-events-auto max-w-[220px] rounded-2xl border border-[rgba(21,25,35,0.08)] bg-[rgba(255,255,255,0.94)] px-3 py-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)] md:max-w-[340px] md:px-3.5 md:py-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(36,103,221,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2467dd]">
              <MessageSquareText className="h-3.5 w-3.5" />
              Commenting
            </div>
            <p className="mt-2 hidden text-sm leading-5 text-[var(--text-secondary)] md:block">
              Click anywhere on the screen to leave a comment. The page is locked until you discard or submit this request.
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute right-3 top-3 z-[4] md:right-5 md:top-4">
          <div className="pointer-events-auto ml-auto flex w-fit max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-end gap-2 rounded-2xl border border-[rgba(21,25,35,0.08)] bg-[rgba(255,255,255,0.94)] px-2.5 py-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)] md:max-w-none md:px-3 md:py-3">
            {detailsOpen ? (
              <div className="px-1 text-sm font-semibold text-[var(--text-secondary)]">
                {comments.length} comment{comments.length === 1 ? "" : "s"}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              className="hidden items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] md:inline-flex"
            >
              {detailsOpen ? "Hide details" : "Details"}
            </button>
            <button
              type="button"
              onClick={closeMode}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] md:px-3.5"
            >
              <X className="h-4 w-4" />
              Discard
            </button>
            <button
              type="button"
              onClick={() => void submitRequest()}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ color: "#fff" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              Submit
            </button>
          </div>
        </div>

        <div className="absolute inset-0 pt-[88px] md:pt-[84px]">
          <div
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair"
            onClick={(event) => addCommentAt(event.clientX, event.clientY)}
          >
            {comments.map((comment, index) => (
              <button
                key={comment.id}
                type="button"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveCommentId(comment.id);
                }}
                className={classNames(
                  "absolute inline-flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#e2472f] bg-[#151923] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.24)] transition",
                  activeCommentId === comment.id && "ring-4 ring-[rgba(226,71,47,0.18)]",
                )}
                style={commentMarkerStyle(comment)}
                aria-label={`Edit comment ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}

            {activeComment ? (
              <div
                className="absolute z-[3] w-[min(280px,calc(100vw-1rem))] rounded-[1.35rem] border border-[rgba(21,25,35,0.12)] bg-[rgba(21,25,35,0.96)] p-3.5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] md:w-[min(320px,calc(100vw-2rem))]"
                style={commentComposerStyle(activeComment)}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    Comment {comments.findIndex((comment) => comment.id === activeComment.id) + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeComment(activeComment.id)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#ffb3a7]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
                <textarea
                  rows={3}
                  autoFocus
                  value={activeComment.note}
                  onChange={(event) => updateComment(activeComment.id, event.target.value)}
                  placeholder="Add a comment about what should change here."
                  className={classNames(
                    "mt-3 w-full rounded-xl border bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-[rgba(255,255,255,0.56)]",
                    !activeComment.note.trim()
                      ? "border-[rgba(255,179,167,0.7)]"
                      : "border-[rgba(255,255,255,0.14)]",
                  )}
                />
                {!activeComment.note.trim() ? (
                  <p className="mt-2 text-xs font-semibold text-[#ffb3a7]">Add text before you submit this request.</p>
                ) : null}
              </div>
            ) : null}

            {!comments.length ? (
              <div className="pointer-events-none absolute left-5 top-5 rounded-full bg-[rgba(21,25,35,0.78)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.2)]">
                Click anywhere to add the first comment.
              </div>
            ) : null}
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 z-[4] md:bottom-5 md:left-5">
            <section
              className={classNames(
                "pointer-events-auto overflow-hidden rounded-[1.5rem] border border-[rgba(21,25,35,0.1)] bg-[rgba(255,255,255,0.96)] shadow-[0_18px_40px_rgba(15,23,42,0.16)]",
                detailsOpen ? "w-[min(340px,calc(100vw-1.5rem))] md:w-[320px]" : "w-auto",
              )}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-2 px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Request details</p>
                  {!detailsOpen ? (
                    <p className="text-xs leading-5 text-[var(--text-secondary)]">
                      {comments.length
                        ? `${comments.length} comment${comments.length === 1 ? "" : "s"} on this page`
                        : "Tap on the page to add the first comment"}
                    </p>
                  ) : null}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="shrink-0 rounded-full bg-[var(--surface-elevated)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    {comments.length} note{comments.length === 1 ? "" : "s"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((current) => !current)}
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]"
                  >
                    {detailsOpen ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>

              {detailsOpen ? (
                <div className="max-h-[min(54vh,380px)] space-y-4 overflow-auto border-t border-[var(--border-subtle)] px-4 py-4">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Overall request (optional)
                    </span>
                    <textarea
                      rows={2}
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder="Example: make this section easier to scan during calls."
                      className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Why it matters? (optional)
                    </span>
                    <textarea
                      rows={2}
                      value={businessContext}
                      onChange={(event) => setBusinessContext(event.target.value)}
                      placeholder="Example: this needs to be clearer for reps while they are live with a customer."
                      className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                    />
                  </label>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Comments on this page</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {comments.length ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "No comments yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {comments.map((comment, index) => (
                        <button
                          key={comment.id}
                          type="button"
                          onClick={() => setActiveCommentId(comment.id)}
                          className={classNames(
                            "block w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3.5 text-left transition",
                            activeCommentId === comment.id && "border-[#151923] shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
                            !comment.note.trim() && "border-[rgba(226,71,47,0.35)]",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151923] text-sm font-semibold text-white">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-primary)]">Comment {index + 1}</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                                {comment.note.trim() || "No text yet"}
                              </p>
                              {!comment.note.trim() ? (
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-danger)]">
                                  Needs text before submit
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      ))}

                      {!comments.length ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                          Click anywhere on the page to add the first comment.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {workspace.changeRequests.allowAttachments ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                      <Paperclip className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        The harness will attach an annotated screenshot and a notes file automatically when you submit.
                      </p>
                    </div>
                  ) : null}

                  {error ? <p className="text-sm font-semibold text-[var(--accent-danger)]">{error}</p> : null}
                  {captureNotice ? (
                    <p className="text-sm font-semibold text-[var(--accent-secondary-strong)]">{captureNotice}</p>
                  ) : null}
                </div>
              ) : error ? (
                <div className="border-t border-[var(--border-subtle)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--accent-danger)]">{error}</p>
                </div>
              ) : captureNotice ? (
                <div className="border-t border-[var(--border-subtle)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--accent-secondary-strong)]">{captureNotice}</p>
                </div>
              ) : null}
            </section>
          </div>

          {error ? (
            <div className="pointer-events-none absolute right-3 top-[76px] z-[5] md:right-5 md:top-[88px]">
              <div className="pointer-events-auto max-w-[min(360px,calc(100vw-1.5rem))] rounded-2xl border border-[rgba(226,71,47,0.18)] bg-[rgba(255,245,243,0.98)] px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                <p className="text-sm font-semibold text-[var(--accent-danger)]">{error}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div data-change-request-ui="true" className="shrink-0">
        <button
          type="button"
          onClick={openCaptureStudio}
          disabled={open || submitting}
          className={classNames(
            "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] disabled:cursor-not-allowed disabled:opacity-60",
            compact && "px-3 py-2 text-xs",
          )}
        >
          {open ? <CheckCircle2 className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
          {open ? "Commenting" : compact ? "Comment" : "Comment a request"}
        </button>
        {notice ? (
          <p className="mt-2 text-right text-xs font-semibold text-[var(--accent-success)]">{notice}</p>
        ) : null}
      </div>
      {overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
