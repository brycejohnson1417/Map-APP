# Screenprinting Identity Resolution

## Tenant type scope

Screenprinting tenants need a durable identity graph because Printavo customers, organizations, contacts, Instagram accounts, comments, and messages rarely line up cleanly.

Tenant-specific docs should record confirmed mappings and exceptions for one tenant only.

## Stable identity primitives

The Screenprinting tenant type should link:

- Printavo customer
- Printavo contact
- organization/customer account
- Instagram account
- Instagram commenter
- Instagram message thread
- school/team/club/business
- sales opportunity
- reorder opportunity
- social campaign

These links should be stored as tenant-scoped identity records, not as one-off UI assumptions.

## Merge and link philosophy

MVP identity resolution should be non-destructive.

The product should suggest links and merges, then let the tenant confirm them. A confirmed link should improve future suggestions. A rejected suggestion should be remembered so it does not keep returning.

Do not permanently merge source records in v1. Preserve raw source IDs and source payload references so tenant-specific mistakes can be reviewed and reversed.

## Suggested matching signals

| Signal | Example use |
|---|---|
| Name similarity | `Alpha Phi` and `Alpha Phi Beta Chapter` |
| Handle similarity | `@alphaphiuiuc` and Printavo customer `Alpha Phi` |
| Email domain | contacts sharing a school or business domain |
| Phone | same normalized phone across contacts |
| Printavo tags | Greek, school, team, local business, retailer |
| Order names | `Alpha Phi Bid Day Shirts` matching Alpha Phi account |
| Social bio text | account bio includes school, team, or store name |
| Manual tenant confirmation | tenant links once, app remembers |

## Instagram-to-customer mapping

Tenants need a dedicated workflow for linking Instagram accounts to customers and organizations.

The workflow should support:

- link Instagram account to existing customer/org
- create candidate customer/org from Instagram account
- mark social account as watched only
- mark social account as owned
- mark account as competitor/media/athlete/team/school/customer
- record confidence and reason
- require human confirmation before using the link for reports

## Messages and comments

Instagram messages and comments should be linkable to:

- account
- contact
- customer/organization
- opportunity
- campaign
- activity timeline

If the API cannot provide full message access for a tenant, manual log entries should still allow the tenant to record that a message happened and link it to the right customer/org.

## Required review states

| State | Meaning |
|---|---|
| suggested | app generated a possible link |
| confirmed | tenant accepted the link |
| rejected | tenant rejected the link |
| ignored | tenant does not want this surfaced |
| needs_review | confidence or conflict requires a human |

## Safety

Every identity link must carry `organization_id`. A link confirmed in one tenant must not affect another tenant, even if both tenants track the same public Instagram account or the same school name.
