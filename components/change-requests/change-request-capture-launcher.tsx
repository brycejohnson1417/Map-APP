"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MessageSquareText, Paperclip, Plus, SendHorizontal, Trash2, X } from "lucide-react";
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
  width: number;
  height: number;
  note: string;
}

interface DraftRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
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
    const width = comment.width * capture.width;
    const height = comment.height * capture.height;

    context.strokeStyle = "#e2472f";
    context.lineWidth = 6;
    context.strokeRect(x, y, width, height);

    context.fillStyle = "#151923";
    context.beginPath();
    context.arc(x + 20, y + 20, 18, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#ffffff";
    context.font = "bold 18px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(index + 1), x + 20, y + 20);
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
    ...input.comments.map((comment, index) => {
      const bounds = [
        `x=${Math.round(comment.x * 100)}%`,
        `y=${Math.round(comment.y * 100)}%`,
        `w=${Math.round(comment.width * 100)}%`,
        `h=${Math.round(comment.height * 100)}%`,
      ].join(", ");
      return `${index + 1}. ${comment.note.trim()} (${bounds})`;
    }),
  ]
    .filter(Boolean)
    .join("\n");

  return new File([lines], "request-notes.txt", { type: "text/plain" });
}

function annotationStyle(annotation: DraftRect | CommentAnnotation) {
  return {
    left: `${annotation.x * 100}%`,
    top: `${annotation.y * 100}%`,
    width: `${annotation.width * 100}%`,
    height: `${annotation.height * 100}%`,
  };
}

function drawPoint(event: React.MouseEvent<HTMLElement>, rect: DOMRect) {
  const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
  const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
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

  const [capture, setCapture] = useState<CaptureSnapshot | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState("");
  const [businessContext, setBusinessContext] = useState("");
  const [comments, setComments] = useState<CommentAnnotation[]>([]);
  const [draftRect, setDraftRect] = useState<DraftRect | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

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
    setDraftRect(null);
    setDrawing(false);
    setActiveCommentId(null);
    setError(null);
  }, []);

  const openCaptureStudio = useCallback(async () => {
    setError(null);
    setNotice(null);
    setCapturing(true);
    setOpen(false);
    resetState();

    try {
      await nextFrame();
      await nextFrame();
      const snapshot = await captureVisibleViewport();
      setCapture(snapshot);
      setOpen(true);
      setDrawing(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to capture this page right now.");
      setCapture(null);
    } finally {
      setCapturing(false);
    }
  }, [resetState]);

  useEffect(() => {
    const handler = () => {
      void openCaptureStudio();
    };

    window.addEventListener(CHANGE_REQUEST_CAPTURE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_REQUEST_CAPTURE_EVENT, handler);
  }, [openCaptureStudio]);

  function closeModal() {
    setOpen(false);
    setDraftRect(null);
    setDrawing(false);
    setError(null);
  }

  function beginSelection(event: React.MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || !drawing || !imageRef.current) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const start = drawPoint(event, rect);
    drawStartRef.current = start;
    setDraftRect({
      x: start.x,
      y: start.y,
      width: 0,
      height: 0,
    });
  }

  function updateSelection(event: React.MouseEvent<HTMLDivElement>) {
    if (!drawing || !imageRef.current || !drawStartRef.current) {
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const current = drawPoint(event, rect);
    const start = drawStartRef.current;
    setDraftRect({
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    });
  }

  function finishSelection() {
    if (!drawStartRef.current || !draftRect) {
      return;
    }

    drawStartRef.current = null;
    if (draftRect.width < 0.03 || draftRect.height < 0.03) {
      setDraftRect(null);
      return;
    }

    const id = crypto.randomUUID();
    setComments((current) => [
      ...current,
      {
        id,
        ...draftRect,
        note: "",
      },
    ]);
    setActiveCommentId(id);
    setDraftRect(null);
    setDrawing(false);
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
    if (!capture || !completedComments.length) {
      setError("Add at least one marked comment before you submit.");
      return;
    }

    if (completedComments.length !== comments.length) {
      setError("Every marked area needs a comment before you submit.");
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
        `Annotated request from the ${surfaceContext.label}.`,
        "Marked comments:",
        ...completedComments.map((comment, index) => `${index + 1}. ${comment.note.trim()}`),
      ].join("\n");
      const requestedOutcome =
        summary.trim() || `Implement the numbered comments shown on the attached screenshot of the ${surfaceContext.label}.`;
      const acceptanceCriteria = `The affected ${surfaceContext.label} matches the numbered comments on the attached screenshot.`;

      const formData = new FormData();
      formData.set("title", title);
      formData.set("surface", surfaceContext.surface);
      formData.set("problem", problem);
      formData.set("requestedOutcome", requestedOutcome);
      formData.set(
        "businessContext",
        businessContext.trim() || `Submitted from the ${surfaceContext.label} with annotated on-screen comments.`,
      );
      formData.set("acceptanceCriteria", acceptanceCriteria);
      formData.set("currentUrl", currentUrl);

      if (workspace.changeRequests.allowAttachments) {
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
      closeModal();
      resetState();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div data-change-request-ui="true" className="shrink-0">
        <button
          type="button"
          onClick={() => void openCaptureStudio()}
          disabled={capturing}
          className={classNames(
            "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] disabled:opacity-60",
            compact && "px-3 py-2 text-xs",
          )}
        >
          {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
          {compact ? "Comment" : "Comment a request"}
        </button>
        {notice ? (
          <p className="mt-2 text-right text-xs font-semibold text-[var(--accent-success)]">{notice}</p>
        ) : null}
      </div>

      {open && capture ? (
        <div
          data-change-request-ui="true"
          className="fixed inset-0 z-[120] flex bg-[rgba(15,23,42,0.72)] p-4 backdrop-blur-sm md:p-6"
        >
          <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[0_28px_90px_rgba(15,23,42,0.35)] xl:flex-row">
            <div className="flex min-w-0 flex-1 flex-col border-b border-[var(--border-subtle)] xl:border-b-0 xl:border-r">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Comment a request</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Mark the screen and explain it in plain language.</h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
                  aria-label="Close comment capture"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-3 text-sm text-[var(--text-secondary)]">
                <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-1.5 font-semibold capitalize">{surfaceContext.label}</span>
                <span>
                  Click and drag over the screenshot, then write what should change in each marked area.
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-[var(--surface-elevated)] p-4 md:p-6">
                <div
                  className={classNames(
                    "relative mx-auto w-full max-w-5xl overflow-hidden rounded-[1.25rem] border border-[var(--border-subtle)] bg-white shadow-[var(--shadow-soft)]",
                    drawing && "cursor-crosshair",
                  )}
                  onMouseDown={beginSelection}
                  onMouseMove={updateSelection}
                  onMouseUp={finishSelection}
                >
                  <img
                    ref={imageRef}
                    src={capture.dataUrl}
                    alt="Captured page for change request"
                    className="block h-auto w-full select-none"
                    draggable={false}
                  />
                  {comments.map((comment, index) => (
                    <button
                      key={comment.id}
                      type="button"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveCommentId(comment.id);
                        setDrawing(false);
                      }}
                      className={classNames(
                        "absolute border-[3px] border-[#e2472f] bg-[rgba(226,71,47,0.12)] text-left transition",
                        activeCommentId === comment.id && "ring-2 ring-[#151923]",
                      )}
                      style={annotationStyle(comment)}
                    >
                      <span className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151923] text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                    </button>
                  ))}
                  {draftRect ? (
                    <div
                      className="pointer-events-none absolute border-[3px] border-dashed border-[#e2472f] bg-[rgba(226,71,47,0.12)]"
                      style={annotationStyle(draftRect)}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="flex w-full shrink-0 flex-col xl:w-[430px]">
              <div className="border-b border-[var(--border-subtle)] px-5 py-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Request summary</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  Add an overall note if you want, then leave one comment for each marked area.
                </p>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-5">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">What should change overall? (optional)</span>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="Example: make the score filters easier to use and show the trend more clearly."
                    className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Why does this matter? (optional)</span>
                  <textarea
                    rows={3}
                    value={businessContext}
                    onChange={(event) => setBusinessContext(event.target.value)}
                    placeholder="Example: reps need to understand this in one glance during calls."
                    className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium outline-none"
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Screen comments</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {comments.length ? `${comments.length} marked area${comments.length === 1 ? "" : "s"}` : "No marked areas yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawing(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Add comment
                  </button>
                </div>

                <div className="space-y-3">
                  {comments.map((comment, index) => (
                    <div
                      key={comment.id}
                      className={classNames(
                        "rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4",
                        activeCommentId === comment.id && "border-[#151923]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveCommentId(comment.id)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#151923] text-white">
                            {index + 1}
                          </span>
                          Comment {index + 1}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeComment(comment.id)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={comment.note}
                        onChange={(event) => updateComment(comment.id, event.target.value)}
                        placeholder="What should change in this marked area?"
                        className="mt-3 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm font-medium outline-none"
                      />
                    </div>
                  ))}
                  {!comments.length ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                      Mark the screen first, then add a short comment for each highlighted area.
                    </div>
                  ) : null}
                </div>

                {workspace.changeRequests.allowAttachments ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
                    <Paperclip className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      The harness will attach an annotated screenshot and a notes file automatically so the queue keeps the visual context.
                    </p>
                  </div>
                ) : null}

                {error ? <p className="text-sm font-semibold text-[var(--accent-danger)]">{error}</p> : null}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 className="h-4 w-4 text-[var(--accent-success)]" />
                  Auto-classified and queued after submit
                </div>
                <button
                  type="button"
                  onClick={() => void submitRequest()}
                  disabled={submitting || capturing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ color: "#fff" }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  Submit request
                </button>
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
