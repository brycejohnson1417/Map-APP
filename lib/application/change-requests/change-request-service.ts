import "server-only";

import type {
  ChangeRequestCaptureContext,
  ChangeRequestClassification,
  ChangeRequestRecord,
  ChangeRequestStatus,
} from "@/lib/domain/change-request";
import type { WorkspaceDefinition } from "@/lib/domain/workspace";
import { ChangeRequestRepository } from "@/lib/infrastructure/supabase/change-request-repository";

const repository = new ChangeRequestRepository();

function attachmentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.trim() : "";
  return message || "One or more request attachments could not be saved.";
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null;
}

function classifyRequest(
  input: Pick<
    ChangeRequestRecord,
    "title" | "problem" | "requestedOutcome"
  > & { explicitClassification?: ChangeRequestClassification | null; workspace: WorkspaceDefinition },
): { classification: ChangeRequestClassification; notes: string } {
  if (input.explicitClassification && input.workspace.changeRequests.classifications.includes(input.explicitClassification)) {
    return {
      classification: input.explicitClassification,
      notes: "Classification kept from tenant-selected value.",
    };
  }

  const corpus = `${input.title}\n${input.problem}\n${input.requestedOutcome}`.toLowerCase();

  if (/\b(auth|database|schema|tenant|login|deployment|runtime|core|platform)\b/.test(corpus)) {
    return {
      classification: "core",
      notes: "Auto-classified as core because the request references auth, schema, runtime, or cross-tenant platform behavior.",
    };
  }

  if (/\b(primitive|reusable primitive|new primitive)\b/.test(corpus)) {
    return {
      classification: "primitive",
      notes: "Auto-classified as primitive because the request reads like a reusable platform primitive rather than a single workspace config change.",
    };
  }

  if (/\b(reusable|template|package|module|widget|pdf|proposal)\b/.test(corpus)) {
    return {
      classification: "package",
      notes: "Auto-classified as package because the request reads like a reusable module or artifact change.",
    };
  }

  if (/\b(score|grade|sort|filter|threshold|copy|trend|section|field|view)\b/.test(corpus)) {
    return {
      classification: "config",
      notes: "Auto-classified as config because the request reads like a scoring, filter, copy, or layout adjustment.",
    };
  }

  return {
    classification: input.workspace.changeRequests.defaultClassification,
    notes: `Fell back to workspace default classification: ${input.workspace.changeRequests.defaultClassification}.`,
  };
}

export async function listChangeRequestsForOrganization(organizationId: string) {
  return repository.listByOrganizationId(organizationId);
}

export async function createChangeRequest(input: {
  organizationId: string;
  requestedByEmail: string;
  workspace: WorkspaceDefinition;
  title: string;
  currentUrl?: string | null;
  surface?: string | null;
  classification?: ChangeRequestClassification | null;
  problem: string;
  requestedOutcome: string;
  businessContext?: string | null;
  acceptanceCriteria?: string | null;
  attachments?: File[];
  captureContext?: ChangeRequestCaptureContext | null;
}) {
  const warnings: string[] = [];
  const normalizedTitle = input.title.trim();
  const normalizedProblem = input.problem.trim();
  const normalizedOutcome = input.requestedOutcome.trim();
  const classification = classifyRequest({
    title: normalizedTitle,
    problem: normalizedProblem,
    requestedOutcome: normalizedOutcome,
    explicitClassification: input.classification ?? null,
    workspace: input.workspace,
  });

  const request = await repository.create({
    organizationId: input.organizationId,
    requestedByEmail: input.requestedByEmail,
    title: normalizedTitle,
    currentUrl: normalizeText(input.currentUrl),
    surface: normalizeText(input.surface),
    classification: classification.classification,
    problem: normalizedProblem,
    requestedOutcome: normalizedOutcome,
    businessContext: normalizeText(input.businessContext),
    acceptanceCriteria: normalizeText(input.acceptanceCriteria),
    classifierNotes: classification.notes,
    captureContext: input.captureContext ?? null,
  });

  if (input.workspace.changeRequests.allowAttachments) {
    for (const attachment of input.attachments ?? []) {
      if (!attachment || attachment.size <= 0) {
        continue;
      }
      try {
        await repository.uploadAttachment({
          organizationId: input.organizationId,
          changeRequestId: request.id,
          file: attachment,
        });
      } catch (error) {
        warnings.push(attachmentErrorMessage(error));
      }
    }
  }

  const [created] = await repository.listByOrganizationId(input.organizationId, 50);
  return {
    request: created ?? request,
    warnings,
  };
}

export async function updateChangeRequest(input: {
  organizationId: string;
  requestId: string;
  workspace: WorkspaceDefinition;
  title: string;
  problem: string;
  requestedOutcome: string;
  businessContext?: string | null;
  acceptanceCriteria?: string | null;
  attachments?: File[];
  status?: ChangeRequestStatus | null;
}) {
  const warnings: string[] = [];
  const existing = await repository.findByIdForOrganization(input.requestId, input.organizationId);
  if (!existing) {
    throw new Error("Change request not found.");
  }

  const normalizedTitle = input.title.trim();
  const normalizedProblem = input.problem.trim();
  const normalizedOutcome = input.requestedOutcome.trim();
  const classification = classifyRequest({
    title: normalizedTitle,
    problem: normalizedProblem,
    requestedOutcome: normalizedOutcome,
    workspace: input.workspace,
  });

  const nextStatus =
    input.status ??
    (existing.status === "resolved" ||
    existing.status === "declined" ||
    existing.status === "stale" ||
    existing.status === "requires_additional_feedback"
      ? "queued"
      : existing.status);

  const updated = await repository.update({
    changeRequestId: input.requestId,
    organizationId: input.organizationId,
    title: normalizedTitle,
    problem: normalizedProblem,
    requestedOutcome: normalizedOutcome,
    businessContext: normalizeText(input.businessContext),
    acceptanceCriteria: normalizeText(input.acceptanceCriteria),
    status: nextStatus,
    classifierNotes: classification.notes,
  });

  if (input.workspace.changeRequests.allowAttachments) {
    for (const attachment of input.attachments ?? []) {
      if (!attachment || attachment.size <= 0) {
        continue;
      }
      try {
        await repository.uploadAttachment({
          organizationId: input.organizationId,
          changeRequestId: input.requestId,
          file: attachment,
        });
      } catch (error) {
        warnings.push(attachmentErrorMessage(error));
      }
    }
  }

  return {
    request: (await repository.findByIdForOrganization(input.requestId, input.organizationId)) ?? updated,
    warnings,
  };
}

export async function deleteChangeRequest(input: {
  organizationId: string;
  requestId: string;
}) {
  return repository.delete(input.requestId, input.organizationId);
}
