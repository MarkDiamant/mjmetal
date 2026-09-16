create table if not exists public.mj_xero_connection (
  singleton boolean primary key default true check (singleton),
  tenant_id text not null,
  tenant_name text,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,
  expires_at timestamptz not null,
  scopes text,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mj_xero_connection enable row level security;

create policy "MJ admins full xero connection"
on public.mj_xero_connection
for all
to authenticated
using (public.mj_is_admin())
with check (public.mj_is_admin());

grant select, insert, update, delete on public.mj_xero_connection to authenticated;
