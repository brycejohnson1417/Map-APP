export interface MembershipSelectionMember {
  organizationId: string | null;
}

export interface MembershipSelectionOrganization {
  id: string;
  name: string;
  slug: string;
}

export function selectMembershipOrganization(input: {
  memberships: MembershipSelectionMember[];
  organizationsById: Map<string, MembershipSelectionOrganization>;
  requestedSlug?: string | null;
}) {
  const requestedSlug = input.requestedSlug?.trim() || null;

  for (const membership of input.memberships) {
    if (!membership.organizationId) {
      continue;
    }

    const organization = input.organizationsById.get(membership.organizationId);
    if (!organization) {
      continue;
    }

    if (!requestedSlug || organization.slug === requestedSlug) {
      return organization;
    }
  }

  return null;
}
