create index if not exists account_org_fraternitees_lead_score_idx
  on public.account (organization_id, (((custom_fields ->> 'leadScore')::integer)) desc)
  where custom_fields ? 'leadScore';

create index if not exists account_org_fraternitees_close_rate_idx
  on public.account (organization_id, (((custom_fields ->> 'closeRate')::numeric)) desc)
  where custom_fields ? 'closeRate';

create index if not exists account_org_fraternitees_total_orders_idx
  on public.account (
    organization_id,
    (
      coalesce(nullif(custom_fields ->> 'totalOrders', '')::integer, 0)
    ) desc
  )
  where custom_fields ? 'totalOrders';

drop view if exists public.fraternitees_account_directory_summary_view;
drop view if exists public.fraternitees_account_directory_view;

create or replace view public.fraternitees_account_directory_view
with (security_invoker = true) as
with base as (
  select
    account.id,
    account.organization_id,
    account.name,
    coalesce(account.display_name, account.name) as display_name,
    account.account_status,
    account.city,
    account.state,
    account.last_order_date,
    nullif(trim(account.custom_fields ->> 'primaryContactName'), '') as primary_contact_name,
    nullif(trim(account.custom_fields ->> 'primaryContactEmail'), '') as primary_contact_email,
    nullif(trim(account.custom_fields ->> 'leadPriority'), '') as lead_priority,
    nullif(account.custom_fields ->> 'leadScore', '')::integer as lead_score,
    nullif(account.custom_fields ->> 'closeRate', '')::numeric as lead_close_rate,
    coalesce(nullif(account.custom_fields ->> 'closedOrders', '')::integer, 0) as closed_orders,
    coalesce(nullif(account.custom_fields ->> 'lostOrders', '')::integer, 0) as lost_orders,
    coalesce(nullif(account.custom_fields ->> 'openOrders', '')::integer, 0) as open_orders,
    nullif(account.custom_fields ->> 'totalOrders', '')::integer as explicit_total_orders,
    nullif(account.custom_fields ->> 'totalOpportunities', '')::integer as explicit_total_opportunities,
    nullif(account.custom_fields ->> 'closedRevenue', '')::numeric as closed_revenue,
    nullif(account.custom_fields ->> 'averageClosedOrderValue', '')::numeric as average_closed_order_value,
    nullif(account.custom_fields ->> 'medianClosedOrderValue', '')::numeric as median_closed_order_value
  from public.account
  where
    account.organization_id in (
      select organization.id
      from public.organization
      where organization.slug = 'fraternitees'
    )
    and account.account_status is distinct from 'archived'
)
select
  base.id,
  base.organization_id,
  base.name,
  base.display_name,
  base.account_status,
  base.city,
  base.state,
  base.last_order_date,
  base.primary_contact_name,
  base.primary_contact_email,
  base.lead_priority,
  base.lead_score,
  base.lead_close_rate,
  base.closed_orders,
  base.lost_orders,
  base.open_orders,
  coalesce(base.explicit_total_orders, base.closed_orders + base.lost_orders + base.open_orders) as total_orders,
  coalesce(base.explicit_total_opportunities, base.closed_orders + base.lost_orders) as total_opportunities,
  base.closed_revenue,
  base.average_closed_order_value,
  base.median_closed_order_value,
  (base.lost_orders >= 3) as dnc_flagged,
  case
    when base.lead_score is null then 'Unscored'
    when (coalesce(base.explicit_total_orders, base.closed_orders + base.lost_orders + base.open_orders) <= 2 and base.lost_orders >= 2)
      or (base.lost_orders >= 4 and coalesce(base.lead_close_rate, 0) < 0.4)
      then 'F'
    when base.lead_score >= 90
      and coalesce(base.lead_close_rate, 0) >= 0.8
      and base.closed_orders >= 5
      and base.lost_orders <= 1
      then 'A+'
    when base.lead_score >= 82
      and coalesce(base.lead_close_rate, 0) >= 0.65
      and base.closed_orders >= 3
      then 'A'
    when base.lead_score >= 72 then 'B'
    when base.lead_score >= 58 then 'C'
    when base.lead_score >= 45 then 'D'
    else 'F'
  end as lead_grade
from base;

create or replace view public.fraternitees_account_directory_summary_view
with (security_invoker = true) as
select
  fraternitees_account_directory_view.organization_id,
  count(*)::integer as accounts,
  count(*) filter (where fraternitees_account_directory_view.lead_score is not null)::integer as scored_accounts,
  count(*) filter (where fraternitees_account_directory_view.dnc_flagged)::integer as dnc_flagged_accounts,
  round(avg(fraternitees_account_directory_view.lead_score) filter (
    where not fraternitees_account_directory_view.dnc_flagged
      and fraternitees_account_directory_view.lead_score is not null
  ))::integer as avg_score_non_dnc
from public.fraternitees_account_directory_view
group by fraternitees_account_directory_view.organization_id;

comment on view public.fraternitees_account_directory_view is
  'FraterniTees account directory read model for fast server-side sorting, filtering, and pagination.';

comment on view public.fraternitees_account_directory_summary_view is
  'FraterniTees account directory summary metrics used by the accounts workspace.';
