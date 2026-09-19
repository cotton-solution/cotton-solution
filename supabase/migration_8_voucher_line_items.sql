-- ============================================================
-- Migration 8: multi-row voucher entry for every voucher type
-- ============================================================
-- `voucher_lines` previously only carried `account_code`, and only
-- the Journal Voucher wrote to it — every other voucher type stored
-- a single party/amount pair directly on the `vouchers` header row.
--
-- Every voucher type now posts through `voucher_lines` instead, so a
-- Cash Receiving Voucher (for example) can credit several different
-- parties or income accounts in one voucher, each with its own
-- description. A line points at either a Chart of Accounts head OR
-- a party (customer/vendor) — exactly one of `account_code` /
-- `party_id` is set per row, never both.
--
-- The `vouchers` header row is kept as the single source of truth
-- for voucher_no/date/narration/gross_amount/net_amount (gross_amount
-- and net_amount become the sum of that voucher's lines); party_id
-- on the header is kept in sync with the first line for backward
-- compatibility with anything still reading it directly (e.g. older
-- report queries), but the lines are what actually get edited.
--
-- Safe to run on the already-deployed project (only ADDS things).
-- Requires migration_7_generic_accounting.sql to already be applied.
-- ============================================================

alter table voucher_lines
  add column if not exists party_id text,
  add column if not exists line_narration text,
  add column if not exists line_no integer not null default 1;

create index if not exists idx_voucher_lines_voucher on voucher_lines(voucher_id);

-- voucher_lines has no RLS of its own — it is (and always was) scoped
-- through its parent voucher via the "Tenant isolation via voucher"
-- pattern below, which schema.sql set up for the Journal Voucher.
-- Re-asserted here in case an older project never had it.
alter table voucher_lines enable row level security;
drop policy if exists "Tenant isolation via voucher" on voucher_lines;
create policy "Tenant isolation via voucher" on voucher_lines
  for all using (
    voucher_id in (select id from vouchers where business_id = my_business_id() or is_admin())
  )
  with check (
    voucher_id in (select id from vouchers where business_id = my_business_id() or is_admin())
  );
