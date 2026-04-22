create index if not exists account_org_coordinates_idx
  on public.account (organization_id, latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists account_org_last_contacted_idx
  on public.account (organization_id, last_contacted_at desc);

drop view if exists public.account_detail_view;
drop view if exists public.territory_rep_facet_view;
drop view if exists public.territory_runtime_summary_view;
drop view if exists public.territory_pin_view;

create or replace view public.territory_pin_view
with (security_invoker = true) as
select
  account.id,
  account.organization_id,
  account.name,
  coalesce(account.display_name, account.name) as display_name,
  account.account_status,
  account.lead_status,
  account.referral_source,
  account.vendor_day_status,
  account.licensed_location_id,
  account.license_number,
  account.city,
  account.state,
  account.latitude,
  account.longitude,
  account.sales_rep_names,
  account.account_manager_names,
  account.last_contacted_at,
  account.last_sample_order_date,
  account.last_sample_delivery_date,
  account.last_order_date,
  account.customer_since_date,
  case
    when account.last_contacted_at is null then null
    else current_date - account.last_contacted_at
  end as days_overdue,
  account.crm_updated_at,
  account.external_updated_at,
  account.updated_at
from public.account
where account.account_status is distinct from 'archived';

create or replace view public.account_detail_view
with (security_invoker = true) as
select
  account.id,
  account.organization_id,
  account.name,
  account.legal_name,
  coalesce(account.display_name, account.name) as display_name,
  account.account_status,
  account.lead_status,
  account.referral_source,
  account.vendor_day_status,
  account.licensed_location_id,
  account.license_number,
  account.address_line_1,
  account.address_line_2,
  account.city,
  account.state,
  account.postal_code,
  account.country,
  account.latitude,
  account.longitude,
  account.sales_rep_names,
  account.account_manager_names,
  account.last_contacted_at,
  account.last_sample_order_date,
  account.last_sample_delivery_date,
  account.last_order_date,
  account.customer_since_date,
  account.crm_updated_at,
  account.external_updated_at,
  account.custom_fields,
  account.updated_at
from public.account
where account.account_status is distinct from 'archived';

create or replace view public.territory_runtime_summary_view
with (security_invoker = true) as
select
  organization.id as organization_id,
  count(distinct account.id)::integer as accounts,
  count(distinct account.id) filter (
    where account.latitude is not null and account.longitude is not null
  )::integer as geocoded_pins,
  count(distinct order_record.id)::integer as orders,
  count(distinct contact.id)::integer as contacts,
  count(distinct territory_boundary.id)::integer as territory_boundaries,
  count(distinct territory_marker.id)::integer as territory_markers,
  count(distinct account.id) filter (
    where nullif(trim(account.referral_source), '') is null
  )::integer as no_referral_source,
  count(distinct account.id) filter (
    where account.last_sample_delivery_date is null
  )::integer as no_last_sample_delivery_date
from public.organization
left join public.account
  on account.organization_id = organization.id
left join public.order_record
  on order_record.organization_id = organization.id
left join public.contact
  on contact.organization_id = organization.id
left join public.territory_boundary
  on territory_boundary.organization_id = organization.id
left join public.territory_marker
  on territory_marker.organization_id = organization.id
group by organization.id;

create or replace view public.territory_rep_facet_view
with (security_invoker = true) as
select
  account.organization_id,
  rep.name,
  count(*)::integer as account_count
from public.account
cross join lateral unnest(account.sales_rep_names) as rep(name)
where nullif(trim(rep.name), '') is not null
group by account.organization_id, rep.name;

comment on view public.territory_pin_view is
  'Small Supabase-native account pin payload for the territory map runtime.';

comment on view public.account_detail_view is
  'Supabase-native account detail payload used by account pages and API routes.';

comment on view public.territory_runtime_summary_view is
  'Organization-scoped territory/account/order counts used by migrated runtime dashboards.';

comment on view public.territory_rep_facet_view is
  'Organization-scoped sales rep facet counts for territory filters.';
