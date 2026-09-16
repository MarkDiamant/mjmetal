alter table public.mj_jobs add column if not exists quantity integer;
alter table public.mj_jobs add column if not exists automation_details text;
alter table public.mj_jobs add column if not exists locks_hardware text;
alter table public.mj_jobs add column if not exists access_notes text;
alter table public.mj_jobs add column if not exists parking_notes text;
alter table public.mj_jobs add column if not exists removal_disposal text;
alter table public.mj_jobs add column if not exists making_good text;

alter table public.mj_job_subcontractors add column if not exists deposit_amount numeric(12,2);
alter table public.mj_job_subcontractors add column if not exists paid_amount numeric(12,2) not null default 0;
alter table public.mj_job_subcontractors add column if not exists scheduled_at timestamptz;
alter table public.mj_job_subcontractors add column if not exists completed_at timestamptz;
alter table public.mj_job_subcontractors add column if not exists status text not null default 'assigned';

alter table public.mj_job_subcontractors drop constraint if exists mj_job_subcontractors_status_check;
alter table public.mj_job_subcontractors add constraint mj_job_subcontractors_status_check check (status in ('assigned','deposit_due','deposit_paid','scheduled','in_progress','completed','cancelled'));
