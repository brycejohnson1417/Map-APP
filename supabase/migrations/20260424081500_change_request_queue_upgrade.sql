alter table public.change_request
  add column if not exists capture_context jsonb;

update public.change_request
set status = case
  when status in ('new', 'planned') then 'queued'
  when status = 'clarifying' then 'requires_additional_feedback'
  when status = 'completed' then 'resolved'
  else status
end
where status in ('new', 'planned', 'clarifying', 'completed');

alter table public.change_request
  alter column status set default 'queued';

alter table public.change_request
  drop constraint if exists change_request_status_check;

alter table public.change_request
  add constraint change_request_status_check
  check (status in ('queued', 'resolved', 'declined', 'stale', 'requires_additional_feedback'));
