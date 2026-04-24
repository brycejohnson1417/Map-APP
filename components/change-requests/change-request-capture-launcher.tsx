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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
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
    if (!completedComments.length) {
      setError("Add at least one comment before you submit.");
      return;
    }

    if (completedComments.length !== comments.length) {
      setError("Every comment needs text before you submit.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
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
        const capture = await captureVisibleViewport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const screenshotFile = await createAnnotatedScreenshotFile(
          capture,
          completedComments,
          `${surfaceContext.surface}-${timestamp}.png`,
        );
        formData.append("attachments", screenshotFile);
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
      setNotice("Request added to the queue.");
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
        className="fixed inset-0 z-[140] bg-[rgba(15,23,42,0.14)] backdrop-blur-[1px]"
      >
        <div className="absolute inset-x-0 top-0 z-[2] border-b border-[rgba(21,25,35,0.08)] bg-[rgba(255,255,255,0.94)] px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(36,103,221,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2467dd]">
                <MessageSquareText className="h-3.5 w-3.5" />
                Commenting
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Click anywhere on the screen to leave a comment. The page is locked until you discard or submit this request.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm font-semibold text-[var(--text-secondary)]">
                {comments.length} comment{comments.length === 1 ? "" : "s"}
              </div>
              <button
                type="button"
                onClick={closeMode}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
                Discard
              </button>
              <button
                type="button"
                onClick={() => void submitRequest()}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                style={{ color: "#fff" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                Submit change request
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pt-[96px] md:pt-[88px]">
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
                className="absolute z-[3] w-[min(360px,calc(100vw-2rem))] rounded-[1.5rem] border border-[rgba(21,25,35,0.12)] bg-[rgba(21,25,35,0.96)] p-4 text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)]"
                style={commentComposerStyle(activeComment)}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Comment {comments.findIndex((comment) => comment.id === activeComment.id) + 1}</p>
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
                  rows={4}
                  autoFocus
                  value={activeComment.note}
                  onChange={(event) => updateComment(activeComment.id, event.target.value)}
                  placeholder="Add a comment about what should change here."
                  className="mt-3 w-full rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-[rgba(255,255,255,0.56)]"
                />
              </div>
            ) : null}

            {!comments.length ? (
              <div className="pointer-events-none absolute left-6 top-6 rounded-full bg-[rgba(21,25,35,0.78)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.24)]">
                Click anywhere to add the first comment.
              </div>
            ) : null}
          </div>

          <section
            className="absolute inset-x-3 bottom-3 z-[4] max-h-[44vh] overflow-hidden rounded-[1.75rem] border border-[rgba(21,25,35,0.1)] bg-[rgba(255,255,255,0.96)] shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl md:inset-x-auto md:left-6 md:w-[min(420px,calc(100vw-3rem))] md:max-h-[420px]"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Request details</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  Leave comments on the page, then submit when the markup matches what you want changed.
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-[var(--surface-elevated)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {comments.length} note{comments.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="max-h-[calc(44vh-78px)] space-y-4 overflow-auto px-5 py-5 md:max-h-[342px]">
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
                        "block w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-left transition",
                        activeCommentId === comment.id && "border-[#151923] shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
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
            </div>
          </section>
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
