import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MembershipRole, OrganizationMember } from "@/lib/domain/runtime";

function mapMemberRow(row: Record<string, unknown>): OrganizationMember {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clerkUserId: String(row.clerk_user_id),
    email: String(row.email),
    fullName: row.full_name ? String(row.full_name) : null,
    role: row.role as MembershipRole,
    settings: (row.settings ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class OrganizationMemberRepository {
  async upsertMember(input: {
    organizationId: string;
    clerkUserId: string;
    email: string;
    fullName?: string | null;
    role: MembershipRole;
  }): Promise<OrganizationMember> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization_member")
      .upsert(
        {
          organization_id: input.organizationId,
          clerk_user_id: input.clerkUserId,
          email: input.email,
          full_name: input.fullName ?? null,
          role: input.role,
        },
        {
          onConflict: "organization_id,clerk_user_id",
        },
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapMemberRow(data as Record<string, unknown>);
  }
}
