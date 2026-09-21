-- ============================================================
-- Migration 12: Weighment (Purchases & Sales)
-- ------------------------------------------------------------
-- One table for both sides: kind = 'purchase' or 'sale'.
--   pending -> weight recorded / awaiting weight, not yet billed
--   moved   -> sent to a purchase bill / sale invoice (one time only)
--
-- Safe to run on the live project: it only ADDS a table. Requires
-- migration_5 (my_business_id()) to be applied already.
-- Run once in the Supabase SQL Editor. (Running it twice is harmless.)
-- ============================================================

create table if not exists weighments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  kind text not null check (kind in ('purchase', 'sale')),
  weighment_no text not null,
  weighment_date date not null default current_date,
  vehicle_no text,
  product text,
  party_id text,
  final_weight numeric(12, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'moved')),
  moved_invoice_no text,
  moved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, weighment_no)
);

create index if not exists idx_weighments_business_kind
  on weighments (business_id, kind, weighment_date desc);

alter table weighments enable row level security;
drop policy if exists "Tenant isolation" on weighments;
create policy "Tenant isolation" on weighments
  for all using (business_id = my_business_id() or is_admin())
  with check (business_id = my_business_id() or is_admin());
