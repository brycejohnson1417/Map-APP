export type ChangeRequestClassification = "config" | "package" | "primitive" | "core";
export type ChangeRequestStatus = "new" | "clarifying" | "queued" | "planned" | "completed";

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
  createdAt: string;
  updatedAt: string;
  attachments: ChangeRequestAttachment[];
}
