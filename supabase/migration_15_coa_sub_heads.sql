-- ============================================================
-- Migration 15: Chart of Accounts — Account Type -> Sub Head -> Head of Account
-- ------------------------------------------------------------
--   * Sub heads:  chart_of_accounts rows flagged is_group = true
--                 (e.g. Expense -> "Administration", Parties -> "Buyer").
--   * Head of account: an ordinary row whose parent_code is a sub head
--                 (e.g. "Stationery Expense" under Administration).
--   * Parties get their own account type; Buyer / Seller / Misc Parties are
--     created as its first three sub heads and a party sits under one of
--     them (parties_customers.sub_head_code — optional; without it the
--     party's ID block decides: 62... Buyer, 63... Seller, 64... Misc).
--
-- Safe to run on the live project: it only ADDS things, no data is changed
-- or removed. Running it twice is harmless. Run once in the Supabase SQL
-- Editor. (It replaces migration_14, which is no longer needed.)
-- ============================================================

-- 1. Sub heads
alter table chart_of_accounts
  add column if not exists is_group boolean not null default false;

-- 2. Allow the "party" account type (drop whatever check limits account_type today)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'chart_of_accounts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%account_type%'
  loop
    execute format('alter table chart_of_accounts drop constraint %I', c.conname);
  end loop;
end $$;

alter table chart_of_accounts
  add constraint chart_of_accounts_account_type_check
  check (account_type in ('party', 'asset', 'liability', 'equity', 'income', 'expense'));

-- 3. A party can be moved to another sub head without changing its ID
alter table parties_customers
  add column if not exists sub_head_code text;

-- 4. Buyer / Seller / Misc Parties sub heads for every existing business
insert into chart_of_accounts (business_id, code, name, account_type, is_group)
select b.id, v.code, v.name, 'party', true
from businesses b
cross join (values
  ('6200000', 'Buyer'),
  ('6300000', 'Seller'),
  ('6400000', 'Misc Parties')
) as v(code, name)
on conflict (business_id, code) do nothing;

-- 5. ...and for every business created from now on
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
    (new.id, '5010001', 'Office & Admin Expenses', 'expense'),
    (new.id, '5010002', 'Labour & Loading Charges', 'expense'),
    (new.id, '2010001', 'Withholding Tax Payable', 'liability');

  insert into crop_units (business_id, crop, unit_name, kgs_per_unit) values
    (new.id, 'Cotton', 'Maund', 40),
    (new.id, 'Wheat', 'Maund', 37.324);

  return new;
end;
$$;
