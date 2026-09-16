create extension if not exists pgcrypto;

create type public.mj_manager as enum ('MD','JB');
create type public.mj_job_status as enum (
  'new_enquiry','awaiting_information','site_visit_required','site_visit_booked',
  'estimate_preparing','estimate_sent','quote_preparing','quote_sent','awaiting_customer',
  'interested_not_ready','customer_unsure','confirmed','deposit_requested','deposit_paid',
  'materials_ordered','fabrication','installation_scheduled','in_progress',
  'awaiting_final_payment','completed','declined'
);

create sequence public.mj_job_sequence start with 19 increment by 1;

create table public.mj_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  initials public.mj_manager not null unique,
  created_at timestamptz not null default now()
);

create table public.mj_customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  phone text,
  email text,
  address_line_1 text,
  address_line_2 text,
  city text,
  postcode text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mj_jobs (
  id uuid primary key default gen_random_uuid(),
  sequence_number integer not null unique default nextval('public.mj_job_sequence'),
  reference text generated always as ('MJ' || lpad(sequence_number::text, 3, '0')) stored unique,
  customer_id uuid not null references public.mj_customers(id) on delete restrict,
  site_address_line_1 text,
  site_address_line_2 text,
  site_city text,
  site_postcode text,
  job_type text not null,
  status public.mj_job_status not null default 'new_enquiry',
  manager public.mj_manager not null,
  enquiry_source text not null default 'Other',
  enquiry_at timestamptz not null default now(),
  finishes text[] not null default '{}',
  colour text,
  dimensions text,
  material text,
  customer_requirements text,
  internal_notes text,
  site_visit_required boolean not null default false,
  site_visit_at timestamptz,
  site_visit_completed_at timestamptz,
  preliminary_estimate numeric(12,2),
  preliminary_estimate_sent_at timestamptz,
  quoted_amount numeric(12,2),
  quote_sent_at timestamptz,
  agreed_amount numeric(12,2),
  payment_method text,
  next_action text,
  next_action_at timestamptz,
  scheduled_at timestamptz,
  expected_completion_at timestamptz,
  completed_at timestamptz,
  materials_ordered boolean not null default false,
  materials_ordered_at timestamptz,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mj_activities (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  activity_type text not null,
  actor public.mj_manager,
  summary text not null,
  details text,
  occurred_at timestamptz not null default now(),
  next_action_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.mj_subcontractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  email text,
  capabilities text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mj_job_subcontractors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  subcontractor_id uuid not null references public.mj_subcontractors(id) on delete restrict,
  scope text,
  agreed_cost numeric(12,2),
  materials_included boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.mj_payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  direction text not null check (direction in ('customer_in','subcontractor_out','supplier_out')),
  payment_type text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  counterparty text,
  paid_at timestamptz,
  due_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.mj_job_costs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  category text not null,
  supplier text,
  estimated_amount numeric(12,2),
  actual_amount numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create table public.mj_quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'draft',
  scope_text text not null,
  exclusions text,
  amount numeric(12,2) not null,
  deposit_amount numeric(12,2),
  lead_time text,
  valid_until date,
  pdf_path text,
  sent_at timestamptz,
  created_by public.mj_manager not null,
  created_at timestamptz not null default now(),
  unique(job_id, version)
);

create table public.mj_files (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  category text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  include_in_quote boolean not null default false,
  uploaded_by public.mj_manager,
  created_at timestamptz not null default now()
);

create table public.mj_integration_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.mj_jobs(id) on delete set null,
  source text not null,
  external_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(source, external_id, event_type)
);

create index mj_jobs_status_idx on public.mj_jobs(status);
create index mj_jobs_manager_idx on public.mj_jobs(manager);
create index mj_jobs_next_action_at_idx on public.mj_jobs(next_action_at);
create index mj_jobs_customer_id_idx on public.mj_jobs(customer_id);
create index mj_activities_job_time_idx on public.mj_activities(job_id, occurred_at desc);
create index mj_payments_job_idx on public.mj_payments(job_id);
create index mj_files_job_idx on public.mj_files(job_id);

alter table public.mj_admin_users enable row level security;
alter table public.mj_customers enable row level security;
alter table public.mj_jobs enable row level security;
alter table public.mj_activities enable row level security;
alter table public.mj_subcontractors enable row level security;
alter table public.mj_job_subcontractors enable row level security;
alter table public.mj_payments enable row level security;
alter table public.mj_job_costs enable row level security;
alter table public.mj_quotes enable row level security;
alter table public.mj_files enable row level security;
alter table public.mj_integration_events enable row level security;

create policy "MJ user reads own admin row"
on public.mj_admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.mj_is_admin()
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1
    from public.mj_admin_users
    where user_id = (select auth.uid())
  );
$$;

create policy "MJ admins full customers" on public.mj_customers for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full jobs" on public.mj_jobs for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full activities" on public.mj_activities for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full subcontractors" on public.mj_subcontractors for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full job subcontractors" on public.mj_job_subcontractors for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full payments" on public.mj_payments for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full costs" on public.mj_job_costs for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full quotes" on public.mj_quotes for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full files" on public.mj_files for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full integration events" on public.mj_integration_events for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());

-- Storage bucket and policies are intentionally created during project setup, once the new
-- Supabase project exists. The application expects a private bucket named mj-job-files.
