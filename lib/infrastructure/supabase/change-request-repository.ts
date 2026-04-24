import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ChangeRequestAttachment,
  ChangeRequestClassification,
  ChangeRequestRecord,
  ChangeRequestStatus,
} from "@/lib/domain/change-request";

const ATTACHMENT_BUCKET = "change-request-attachments";

interface ChangeRequestRow {
  id: string;
  organization_id: string;
  requested_by_email: string;
  title: string;
  current_url: string | null;
  surface: string | null;
  classification: ChangeRequestClassification;
  status: ChangeRequestStatus;
  problem: string;
  requested_outcome: string;
  business_context: string | null;
  acceptance_criteria: string | null;
  classifier_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ChangeRequestAttachmentRow {
  id: string;
  change_request_id: string;
  file_name: string;
  content_type: string | null;
  file_size_bytes: number | null;
  storage_path: string;
  created_at: string;
}

function mapChangeRequest(row: ChangeRequestRow, attachments: ChangeRequestAttachment[]): ChangeRequestRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    requestedByEmail: row.requested_by_email,
    title: row.title,
    currentUrl: row.current_url,
    surface: row.surface,
    classification: row.classification,
    status: row.status,
    problem: row.problem,
    requestedOutcome: row.requested_outcome,
    businessContext: row.business_context,
    acceptanceCriteria: row.acceptance_criteria,
    classifierNotes: row.classifier_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments,
  };
}

function mapAttachment(row: ChangeRequestAttachmentRow, signedUrl: string | null): ChangeRequestAttachment {
  return {
    id: row.id,
    fileName: row.file_name,
    contentType: row.content_type,
    fileSizeBytes: row.file_size_bytes,
    storagePath: row.storage_path,
    signedUrl,
    createdAt: row.created_at,
  };
}

export class ChangeRequestRepository {
  async create(input: {
    organizationId: string;
    requestedByEmail: string;
    title: string;
    currentUrl?: string | null;
    surface?: string | null;
    classification: ChangeRequestClassification;
    status?: ChangeRequestStatus;
    problem: string;
    requestedOutcome: string;
    businessContext?: string | null;
    acceptanceCriteria?: string | null;
    classifierNotes?: string | null;
  }) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("change_request")
      .insert({
        organization_id: input.organizationId,
        requested_by_email: input.requestedByEmail,
        title: input.title,
        current_url: input.currentUrl ?? null,
        surface: input.surface ?? null,
        classification: input.classification,
        status: input.status ?? "new",
        problem: input.problem,
        requested_outcome: input.requestedOutcome,
        business_context: input.businessContext ?? null,
        acceptance_criteria: input.acceptanceCriteria ?? null,
        classifier_notes: input.classifierNotes ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapChangeRequest(data as ChangeRequestRow, []);
  }

  async addAttachment(input: {
    organizationId: string;
    changeRequestId: string;
    fileName: string;
    contentType?: string | null;
    fileSizeBytes?: number | null;
    storagePath: string;
  }) {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("change_request_attachment")
      .insert({
        organization_id: input.organizationId,
        change_request_id: input.changeRequestId,
        file_name: input.fileName,
        content_type: input.contentType ?? null,
        file_size_bytes: input.fileSizeBytes ?? null,
        storage_path: input.storagePath,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as ChangeRequestAttachmentRow;
  }

  async uploadAttachment(input: {
    organizationId: string;
    changeRequestId: string;
    file: File;
  }) {
    const supabase = getSupabaseAdminClient() as any;
    const fileName = input.file.name || "attachment";
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storagePath = `${input.organizationId}/${input.changeRequestId}/${Date.now()}-${sanitizedFileName}`;
    const arrayBuffer = await input.file.arrayBuffer();
    const { error } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: input.file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return this.addAttachment({
      organizationId: input.organizationId,
      changeRequestId: input.changeRequestId,
      fileName,
      contentType: input.file.type || null,
      fileSizeBytes: input.file.size ?? null,
      storagePath,
    });
  }

  async listByOrganizationId(organizationId: string, limit = 50): Promise<ChangeRequestRecord[]> {
    const supabase = getSupabaseAdminClient() as any;
    const [{ data: requests, error: requestsError }, { data: attachments, error: attachmentsError }] = await Promise.all([
      supabase
        .from("change_request")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("change_request_attachment")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

    if (requestsError) {
      throw requestsError;
    }
    if (attachmentsError) {
      throw attachmentsError;
    }

    const attachmentRows = (attachments ?? []) as ChangeRequestAttachmentRow[];
    const signedUrls = await Promise.all(
      attachmentRows.map(async (attachment) => {
        const { data } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(attachment.storage_path, 60 * 60);
        return [attachment.id, data?.signedUrl ?? null] as const;
      }),
    );
    const signedUrlMap = new Map(signedUrls);
    const attachmentsByRequest = attachmentRows.reduce<Map<string, ChangeRequestAttachment[]>>((map, row) => {
      const current = map.get(row.change_request_id) ?? [];
      current.push(mapAttachment(row, signedUrlMap.get(row.id) ?? null));
      map.set(row.change_request_id, current);
      return map;
    }, new Map());

    return ((requests ?? []) as ChangeRequestRow[]).map((row) =>
      mapChangeRequest(row, attachmentsByRequest.get(row.id) ?? []),
    );
  }
}
