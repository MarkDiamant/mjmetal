alter table public.mj_customers add column if not exists xero_contact_id text;

create table if not exists public.mj_xero_invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  xero_invoice_id text not null unique,
  invoice_number text,
  status text not null,
  total numeric(12,2),
  amount_due numeric(12,2),
  amount_paid numeric(12,2),
  currency_code text,
  created_by public.mj_manager,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mj_xero_invoices_job_idx on public.mj_xero_invoices(job_id, created_at desc);
alter table public.mj_xero_invoices enable row level security;

create policy "MJ admins full xero invoices"
on public.mj_xero_invoices
for all
to authenticated
using (public.mj_is_admin())
with check (public.mj_is_admin());

grant select, insert, update, delete on public.mj_xero_invoices to authenticated;
grant select, update on public.mj_customers to authenticated;
