# Screenprinting Configuration

## Tenant type rule

Tenant type defaults should be strong enough that a new screenprinter gets a useful workspace quickly, but every decision that depends on the tenant's process must be editable in admin UX.

Tenant-specific settings belong in the tenant workspace manifest, runtime organization settings, encrypted integration installs, or tenant-specific docs. They should not be hardcoded into shared Screenprinting code.

## Required admin configuration surfaces

| Surface | Tenant decides | Standardized primitive |
|---|---|---|
| Business profile | name, locations, timezone, currency, terminology | organization |
| Branding | logo, colors, labels, email signature | workspace branding |
| Users and roles | owners, sales owners, social owners, admin rights | organization_member |
| Printavo connection | credentials, sync schedule, preview rules | connector install |
| Printavo statuses | quoted, production, completed, cancelled, paid, unpaid, dirty, ignored | mapping_rule |
| Printavo tags | categories, teams, reps, exclusions, dirty fields | mapping_rule |
| Customer categories | Greek, school, team, corporate, local business, nonprofit, retailer, custom | account custom fields |
| Reorder rules | high-value cycles, anniversary windows, seasonal windows, snooze defaults | opportunity and activity |
| Sales pipelines | stages, owners, probability, values, lead sources | opportunity |
| Social accounts | owned, watched, ignored, high priority, competitor, school, team, athlete, influencer, media | social_account |
| Social alerts | actionable thresholds, recipients, spike rules, comment/DM rules | alert |
| Email templates | reorder, quote follow-up, lost customer, social lead, custom templates | document/template config |
| Dashboards | widgets, filters, saved views, role defaults | dashboard |
| Feature flags | publishing, comments, messages, catalog costs, map, advanced reports | plugin settings |

## Dirty-data handling

Screenprinting tenants may have good, bad, great, or horrible Printavo tags and statuses. The product must not assume quality.

The admin UX should support:

- field health review before reports become authoritative
- status mapping previews before saving
- tag mapping previews before saving
- dirty field exclusions
- ignored status/tag lists
- confidence labels on merge suggestions
- undoable or non-destructive linking first
- tenant-specific notes explaining why a mapping exists

When a tenant changes a rule, the app should show likely downstream impact before saving. Example: "This status change will move 143 orders into Completed and update 4 dashboard widgets."

## Customization model

The tenant can customize:

- fields
- labels
- dashboards
- saved views
- categories
- statuses
- tags
- follow-up ownership
- reorder timing
- alert thresholds
- email templates
- installed plugins

The tenant cannot redefine core isolation, credential ownership, or canonical primitive meaning. That boundary keeps every customer feeling custom without creating a separate app per tenant.
