export interface MembershipAccessRecord {
  organizationId: string;
}

export interface MembershipOrganizationRecord {
  id: string;
  slug: string;
}

export function selectMembershipOrganization<TOrganization extends MembershipOrganizationRecord>(
  memberships: MembershipAccessRecord[],
  organizationsById: Map<string, TOrganization>,
  requestedSlug?: string | null,
): TOrganization | null {
  const requested = requestedSlug?.trim() || null;

  for (const membership of memberships) {
    const organization = organizationsById.get(membership.organizationId);
    if (!organization) {
      continue;
    }

    if (!requested || organization.slug === requested) {
      return organization;
    }
  }

  return null;
}
