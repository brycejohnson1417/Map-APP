export type ChangeRequestClassification = "config" | "package" | "primitive" | "core";
export type ChangeRequestStatus =
  | "queued"
  | "resolved"
  | "declined"
  | "stale"
  | "requires_additional_feedback";

export interface ChangeRequestCaptureContext {
  capturedAt: string;
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    devicePixelRatio: number;
  };
  marker: {
    viewportX: number;
    viewportY: number;
    pageX: number;
    pageY: number;
  };
  target: {
    tagName: string | null;
    role: string | null;
    ariaLabel: string | null;
    id: string | null;
    dataFeedbackId: string | null;
    text: string | null;
    sectionLabel: string | null;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    elementOffset: {
      x: number;
      y: number;
    } | null;
  } | null;
}

export interface ChangeRequestAttachment {
  id: string;
  fileName: string;
  contentType: string | null;
  fileSizeBytes: number | null;
  storagePath: string;
  signedUrl: string | null;
  createdAt: string;
}

export interface ChangeRequestRecord {
  id: string;
  organizationId: string;
  requestedByEmail: string;
  title: string;
  currentUrl: string | null;
  surface: string | null;
  classification: ChangeRequestClassification;
  status: ChangeRequestStatus;
  problem: string;
  requestedOutcome: string;
  businessContext: string | null;
  acceptanceCriteria: string | null;
  classifierNotes: string | null;
  captureContext: ChangeRequestCaptureContext | null;
  createdAt: string;
  updatedAt: string;
  attachments: ChangeRequestAttachment[];
}
