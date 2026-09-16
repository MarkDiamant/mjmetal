alter table public.mj_jobs add column if not exists cancellation_reason text;
alter table public.mj_jobs add column if not exists cancelled_at timestamptz;
alter table public.mj_jobs add column if not exists site_visit_status text not null default 'not_required';
alter table public.mj_jobs add column if not exists site_visit_attendee text;
alter table public.mj_jobs add column if not exists site_visit_notes text;
alter table public.mj_jobs add column if not exists site_visit_measurements text;

update public.mj_jobs
set site_visit_status = case
  when site_visit_completed_at is not null then 'completed'
  when site_visit_at is not null then 'booked'
  when site_visit_required then 'required'
  else 'not_required'
end
where site_visit_status is null or site_visit_status = 'not_required';

alter table public.mj_jobs drop constraint if exists mj_jobs_site_visit_status_check;
alter table public.mj_jobs add constraint mj_jobs_site_visit_status_check check (site_visit_status in ('not_required','required','proposed','booked','completed','cancelled'));

create index if not exists mj_customers_email_lower_idx on public.mj_customers (lower(email)) where email is not null;
create index if not exists mj_customers_phone_normalised_idx on public.mj_customers ((regexp_replace(phone, '[^0-9]+', '', 'g'))) where phone is not null;
create index if not exists mj_jobs_archived_at_idx on public.mj_jobs (archived_at);
