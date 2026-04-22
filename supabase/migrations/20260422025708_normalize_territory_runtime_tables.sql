drop view if exists public.territory_boundary_view;
drop view if exists public.territory_marker_view;
drop view if exists public.territory_pin_view;

alter table if exists public.territory_boundary
  drop constraint if exists territory_boundary_workspace_id_fkey,
  drop column if exists workspace_id;

alter table if exists public.territory_marker
  drop constraint if exists territory_marker_workspace_id_fkey,
  drop column if exists workspace_id;
