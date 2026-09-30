-- ============================================================
-- Migration 23: ACCOUNTS OPENING BALANCES
--
-- A business joining mid-way through its accounting life needs to
-- enter what every account already stood at before this software
-- started tracking it — otherwise every ledger and report starts
-- from zero and is wrong from day one.
--
-- `opening_balances` is what the person actually types (one row per
-- account: opening debit / opening credit). Behind it, each row posts
-- a REAL balanced entry to the ledger (`transactions`) against an
-- "Opening Balance Equity" suspense account, dated before everything
-- else — so it shows up as the Opening Balance line on the Account
-- Ledger report and folds correctly into the Trial Balance / Balance
-- Sheet, through the exact same engine as every other posting
-- (migration_20), not a separate special case.
--
-- Requires migration_16, migration_20 and migration_21 already
-- applied. Safe to run on the live project. Idempotent. Run once in
-- the Supabase SQL Editor.
-- ============================================================

-- A fixed "before time" date. No real transaction predates this, so
-- an opening-balance posting always falls before any date filter and
-- is never mistaken for an ordinary entry.
-- (kept as a SQL comment for reference — the literal date is inlined
-- below wherever it's needed, since Postgres has no named constants)
-- OPENING_BALANCE_DATE = '2000-01-01'

-- Give every existing business the suspense account + posting_accounts
-- mapping it needs (new businesses get it from seed_new_business below).
insert into chart_of_accounts (business_id, code, name, account_type)
select b.id, '3020001', 'Opening Balance Equity', 'equity'
from businesses b
where not exists (
  select 1 from chart_of_accounts c where c.business_id = b.id and c.code = '3020001'
)
on conflict (business_id, code) do nothing;

insert into posting_accounts (business_id, key, account_code)
select b.id, 'opening_balance_equity', '3020001'
from businesses b
where exists (select 1 from chart_of_accounts c where c.business_id = b.id and c.code = '3020001')
on conflict (business_id, key) do nothing;

create or replace function seed_new_business()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into chart_of_accounts (business_id, code, name, account_type, is_group) values
    (new.id, '6200000', 'Buyer', 'party', true),
    (new.id, '6300000', 'Seller', 'party', true),
    (new.id, '6400000', 'Misc Parties', 'party', true);

  insert into chart_of_accounts (business_id, code, name, account_type) values
    (new.id, '1010001', 'Cash in Hand', 'asset'),
    (new.id, '1020001', 'Bank Account', 'asset'),
    (new.id, '4010001', 'Brokerage Commission Income', 'income'),
    (new.id, '4020001', 'Sales', 'income'),
    (new.id, '5010001', 'Office & Admin Expenses', 'expense'),
    (new.id, '5010002', 'Labour & Loading Charges', 'expense'),
    (new.id, '5020001', 'Purchases', 'expense'),
    (new.id, '5030001', 'Brokerage Expense', 'expense'),
    (new.id, '3020001', 'Opening Balance Equity', 'equity'),
    (new.id, '2010001', 'Withholding Tax Payable', 'liability');

  insert into crop_units (business_id, crop, unit_name, kgs_per_unit) values
    (new.id, 'Cotton', 'Maund', 40),
    (new.id, 'Wheat', 'Maund', 37.324);

  insert into posting_accounts (business_id, key, account_code) values
    (new.id, 'cash', '1010001'),
    (new.id, 'bank', '1020001'),
    (new.id, 'sales', '4020001'),
    (new.id, 'purchases', '5020001'),
    (new.id, 'brokerage_income', '4010001'),
    (new.id, 'brokerage_expense', '5030001'),
    (new.id, 'default_expense', '5010001'),
    (new.id, 'wht_payable', '2010001'),
    (new.id, 'opening_balance_equity', '3020001');

  return new;
end;
$$;


-- ------------------------------------------------------------
-- opening_balances: one row per account (party or Chart of
-- Accounts head). Editing and re-saving replaces the row and its
-- ledger postings — it is never additive.
-- ------------------------------------------------------------
create table if not exists opening_balances (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  account_code text not null,
  opening_debit numeric(14, 2) not null default 0,
  opening_credit numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique (business_id, account_code)
);

create index if not exists idx_opening_balances_business on opening_balances (business_id);

alter table opening_balances enable row level security;
drop policy if exists "Read own business" on opening_balances;
create policy "Read own business" on opening_balances
  for select to authenticated using (business_id = my_business_id());
-- No direct insert/update/delete policy: only set_opening_balance()
-- (SECURITY DEFINER, checks Settings access itself) may write here,
-- so a row and its ledger postings can never drift apart.
revoke insert, update, delete on opening_balances from authenticated, anon;


-- ------------------------------------------------------------
-- set_opening_balance(): the only way to set or change one account's
-- opening balance. Replaces any previous posting for that account
-- (never stacks), keeps the ledger's balance guarantee (migration_20)
-- by posting the account and the suspense account as one pair, and
-- requires Settings access (migration_21).
-- ------------------------------------------------------------
create or replace function set_opening_balance(
  p_account_code text, p_opening_debit numeric, p_opening_credit numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid := my_business_id();
  v_id uuid;
  v_suspense text;
begin
  if not has_module_access('settings') then
    raise exception 'You do not have permission to set opening balances.' using errcode = '42501';
  end if;
  if coalesce(p_opening_debit, 0) < 0 or coalesce(p_opening_credit, 0) < 0 then
    raise exception 'Opening balances cannot be negative.';
  end if;

  insert into opening_balances (business_id, account_code, opening_debit, opening_credit, updated_by)
  values (v_business_id, p_account_code, coalesce(p_opening_debit, 0), coalesce(p_opening_credit, 0), auth.uid())
  on conflict (business_id, account_code) do update
    set opening_debit = excluded.opening_debit,
        opening_credit = excluded.opening_credit,
        updated_at = now(),
        updated_by = excluded.updated_by
  returning id into v_id;

  -- Clear whatever this account's opening balance posted before.
  delete from transactions where reference_type = 'opening_balance' and reference_id = v_id;

  if coalesce(p_opening_debit, 0) = 0 and coalesce(p_opening_credit, 0) = 0 then
    delete from opening_balances where id = v_id;
    return;
  end if;

  v_suspense := get_posting_account(v_business_id, array['opening_balance_equity']);
  if v_suspense is null then
    raise exception 'No "opening_balance_equity" ledger account is set up for this business.';
  end if;

  insert into transactions
    (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
  values
    (v_business_id, date '2000-01-01', p_account_code, coalesce(p_opening_debit, 0), coalesce(p_opening_credit, 0),
     'opening_balance', v_id, 'Opening balance'),
    (v_business_id, date '2000-01-01', v_suspense, coalesce(p_opening_credit, 0), coalesce(p_opening_debit, 0),
     'opening_balance', v_id, 'Opening balance — ' || p_account_code);
end;
$$;

grant execute on function set_opening_balance(text, numeric, numeric) to authenticated;
