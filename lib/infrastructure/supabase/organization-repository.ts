import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapOrganizationRow } from "@/lib/infrastructure/supabase/runtime-mappers";
import type { Organization } from "@/lib/domain/runtime";

export class OrganizationRepository {
  async findBySlug(slug: string): Promise<Organization | null> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      throw error;
    }

    return mapOrganizationRow(data as Record<string, unknown>);
  }

  async listActive(limit = 25): Promise<Organization[]> {
    const supabase = getSupabaseAdminClient() as any;
    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: unknown) => mapOrganizationRow(row as Record<string, unknown>));
  }
}
