alter table public.mj_quotes
add column if not exists vat_rate numeric not null default 0;

comment on column public.mj_quotes.vat_rate is 'VAT percentage applied to this quote version';
