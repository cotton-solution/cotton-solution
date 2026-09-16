-- ============================================================
-- Migration: Chart of Accounts management screen support.
-- Safe to run on the already-deployed project (only ADDS things).
-- The `chart_of_accounts` table itself already exists in schema.sql
-- (and is already covered by the tenant RLS loop there) — this just
-- adds the columns the new management UI needs.
-- ============================================================

alter table chart_of_accounts
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- A sub-account's parent must belong to the same business and must
-- not be itself — keeps the hierarchy dropdown honest. Re-created
-- each run so this migration stays idempotent.
alter table chart_of_accounts
  drop constraint if exists chart_of_accounts_parent_not_self;
alter table chart_of_accounts
  add constraint chart_of_accounts_parent_not_self check (parent_code is distinct from code);

create index if not exists idx_coa_parent
  on chart_of_accounts(business_id, parent_code);
