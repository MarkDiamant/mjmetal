alter table public.mj_jobs add column if not exists customer_reference text;
alter table public.mj_jobs add column if not exists snagging_required boolean not null default false;
alter table public.mj_jobs add column if not exists snagging_notes text;
alter table public.mj_jobs add column if not exists snagging_completed_at timestamptz;
alter table public.mj_jobs add column if not exists archived_at timestamptz;

create table if not exists public.mj_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mj_material_orders (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.mj_jobs(id) on delete cascade,
  supplier_id uuid references public.mj_suppliers(id) on delete set null,
  supplier_name text,
  description text not null,
  amount numeric(12,2),
  ordered_at timestamptz,
  expected_at timestamptz,
  received_at timestamptz,
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.mj_audit_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.mj_jobs(id) on delete cascade,
  actor public.mj_manager,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mj_material_orders_job_idx on public.mj_material_orders(job_id);
create index if not exists mj_audit_events_job_time_idx on public.mj_audit_events(job_id, created_at desc);

alter table public.mj_suppliers enable row level security;
alter table public.mj_material_orders enable row level security;
alter table public.mj_audit_events enable row level security;

create policy "MJ admins full suppliers" on public.mj_suppliers for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full material orders" on public.mj_material_orders for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());
create policy "MJ admins full audit events" on public.mj_audit_events for all to authenticated using (public.mj_is_admin()) with check (public.mj_is_admin());

grant select, insert, update, delete on public.mj_suppliers to authenticated;
grant select, insert, update, delete on public.mj_material_orders to authenticated;
grant select, insert on public.mj_audit_events to authenticated;
