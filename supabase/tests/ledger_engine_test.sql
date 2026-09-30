-- ============================================================
-- Ledger engine regression suite.
-- Proves, on a real database, that vouchers, invoices, expenses and
-- opening balances reach the general ledger (`transactions`) correctly
-- and that nobody can bypass or corrupt it.
--
-- Run on a scratch/local database or a STAGING Supabase project (it
-- creates fake users) after applying migrations 16-24:
--     psql "$DATABASE_URL" -f supabase/tests/ledger_engine_test.sql
-- Everything runs in one transaction that is rolled back. Any FAIL
-- row is a launch blocker.
-- ============================================================
\set ON_ERROR_STOP on
begin;

create schema lt;
create table lt.results (n serial, name text, ok boolean);
create function lt.check(p_name text, p_ok boolean) returns void language sql as
  $$ insert into lt.results(name, ok) values (p_name, coalesce(p_ok, false)); $$;
grant usage on schema lt to authenticated;
grant all on lt.results to authenticated;
grant usage on sequence lt.results_n_seq to authenticated;
grant execute on function lt.check(text, boolean) to authenticated;

-- true when the statement raises an error (rolled back either way)
create function lt.fails(p_sql text, p_pattern text default null) returns boolean language plpgsql as $$
begin
  execute p_sql;
  raise exception using errcode = 'XX999', message = 'no error';
exception
  when sqlstate 'XX999' then return false;
  when others then return p_pattern is null or sqlerrm ilike '%' || p_pattern || '%';
end $$;
grant execute on function lt.fails(text, text) to authenticated;

-- true when, after running p_sql, the deferred balance rule rejects it
create function lt.rejected_at_commit(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  set constraints all immediate;   -- what COMMIT would do
  raise exception using errcode = 'XX999', message = 'accepted';
exception
  when sqlstate 'XX999' then return false;
  when others then return true;
end $$;
grant execute on function lt.rejected_at_commit(text) to authenticated;

create function lt.net(p_type text, p_id uuid) returns numeric language sql as
  $$ select coalesce(sum(debit) - sum(credit), 0) from transactions where reference_type = p_type and reference_id = p_id $$;
grant execute on function lt.net(text, uuid) to authenticated;

-- ---------- two businesses ----------
insert into auth.users(id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'a@ledger.test'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'b@ledger.test');
select id as a from businesses where owner_id = 'aaaaaaaa-0000-0000-0000-00000000000a' \gset bid_
select id as b from businesses where owner_id = 'bbbbbbbb-0000-0000-0000-00000000000b' \gset bid_
insert into parties_customers(business_id, party_id, name) values
  (:'bid_a', '6410001', 'Farhan Traders'), (:'bid_a', '6310001', 'Seller Co'),
  (:'bid_b', '6410001', 'Other Tenant Party');
grant select on all tables in schema public to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-00000000000a', true);

-- ===== 1. voucher, saved exactly as the app saves it =====
insert into vouchers(business_id, voucher_no, voucher_type, voucher_date, narration)
  values (:'bid_a', 'CRV-1', 'cash_receiving', '2026-09-01', 'received') returning id as v1 \gset
insert into voucher_lines(voucher_id, account_code, party_id, debit, credit) values
  (:'v1', '1010001', null, 50000, 0),
  (:'v1', null, '6410001', 0, 50000);
select lt.check('voucher: cash side posts to the cash account',
  (select debit from transactions where reference_id = :'v1' and account_code = '1010001') = 50000);
select lt.check('voucher: PARTY side posts to the party''s own account code (not blank)',
  (select credit from transactions where reference_id = :'v1' and account_code = '6410001') = 50000);
select lt.check('voucher: nets to zero', lt.net('voucher', :'v1') = 0);
select lt.check('voucher: the party''s ledger contains it',
  (select count(*) from transactions where account_code = '6410001' and reference_id = :'v1') = 1);

-- ===== 2. purchase / sale invoices =====
insert into invoices(business_id, invoice_no, invoice_category, invoice_type, invoice_date, party_id, subtotal, brokerage_amount, net_total)
  values (:'bid_a', 'PI-1', 'general', 'purchase', '2026-09-02', '6310001', 1000000, 10000, 990000) returning id as pi \gset
select lt.check('purchase: Dr Purchases = subtotal',
  (select debit from transactions where reference_id = :'pi' and account_code = '5020001') = 1000000);
select lt.check('purchase: Cr party = net total',
  (select credit from transactions where reference_id = :'pi' and account_code = '6310001') = 990000);
select lt.check('purchase: Cr Brokerage Income = brokerage',
  (select credit from transactions where reference_id = :'pi' and account_code = '4010001') = 10000);
select lt.check('purchase: nets to zero', lt.net('invoice', :'pi') = 0);

insert into invoices(business_id, invoice_no, invoice_category, invoice_type, invoice_date, party_id, subtotal, brokerage_amount, net_total)
  values (:'bid_a', 'SI-1', 'general', 'sale', '2026-09-03', '6410001', 500000, 5000, 495000) returning id as si \gset
select lt.check('sale: Dr party = net total',
  (select debit from transactions where reference_id = :'si' and account_code = '6410001') = 495000);
select lt.check('sale: Dr Brokerage Expense = brokerage',
  (select debit from transactions where reference_id = :'si' and account_code = '5030001') = 5000);
select lt.check('sale: Cr Sales = subtotal',
  (select credit from transactions where reference_id = :'si' and account_code = '4020001') = 500000);
select lt.check('sale: nets to zero', lt.net('invoice', :'si') = 0);

-- ===== 3. expense =====
insert into expenses(business_id, expense_date, category, amount, payment_method)
  values (:'bid_a', '2026-09-04', 'Office Rent', 25000, 'cash') returning id as ex \gset
select lt.check('expense: Dr expense account / Cr cash',
  (select debit from transactions where reference_id = :'ex' and account_code = '5010001') = 25000
  and (select credit from transactions where reference_id = :'ex' and account_code = '1010001') = 25000);

-- ===== 4. void = reversal, never deletion =====
select void_voucher(:'v1', 'wrong party');
select void_invoice(:'si', 'cancelled');
select void_expense(:'ex', 'duplicate');
select lt.check('void voucher: original kept + reversal added, net 0',
  (select count(*) from transactions where reference_id = :'v1') = 4 and lt.net('voucher', :'v1') = 0);
select lt.check('void voucher: the party''s ledger nets to zero for it',
  (select coalesce(sum(debit) - sum(credit), 0) from transactions where account_code = '6410001' and reference_id = :'v1') = 0);
select lt.check('void invoice: original kept + reversal added, net 0',
  (select count(*) from transactions where reference_id = :'si') = 6 and lt.net('invoice', :'si') = 0);
select lt.check('void expense: original kept + reversal added, net 0',
  (select count(*) from transactions where reference_id = :'ex') = 4 and lt.net('expense', :'ex') = 0);

-- ===== 5. opening balances =====
select set_opening_balance('6410001', 259879, 0);
select lt.check('opening balance: posts one balanced pair',
  (select count(*) from transactions where reference_type = 'opening_balance') = 2
  and (select coalesce(sum(debit) - sum(credit), 0) from transactions where reference_type = 'opening_balance') = 0);
select lt.check('opening balance: lands on the party''s account',
  (select debit from transactions where reference_type = 'opening_balance' and account_code = '6410001') = 259879);
select set_opening_balance('6410001', 300000, 0);
select lt.check('opening balance: editing REPLACES, never stacks',
  (select count(*) from transactions where reference_type = 'opening_balance' and account_code = '6410001') = 1
  and (select debit from transactions where reference_type = 'opening_balance' and account_code = '6410001') = 300000);
select set_opening_balance('6410001', 0, 0);
select lt.check('opening balance: 0/0 clears it completely',
  (select count(*) from transactions where reference_type = 'opening_balance') = 0);

-- ===== 6. the books always balance =====
select lt.check('whole-business ledger: total debit = total credit',
  (select coalesce(sum(debit) - sum(credit), 0) from transactions) = 0);
select lt.check('no ledger row has a blank account',
  (select count(*) from transactions where account_code is null) = 0);

-- ===== 7. nobody can corrupt or bypass it =====
select lt.check('users cannot write to the ledger directly',
  lt.fails(format($q$insert into transactions(business_id, transaction_date, account_code, debit, credit, reference_type, reference_id)
                     values (%L, current_date, '1010001', 1, 0, 'adjustment', gen_random_uuid())$q$, :'bid_a'), 'permission denied'));
select lt.check('users cannot call the invoice-posting internals (cross-tenant forgery)',
  lt.fails(format($q$select post_invoice_entries(%L::uuid, current_date, gen_random_uuid(), 'X', 'sale', 'general', '6210001', 1, 1, 0)$q$, :'bid_b'), 'permission denied'));
insert into vouchers(business_id, voucher_no, voucher_type, voucher_date)
  values (:'bid_a', 'JV-3', 'journal', '2026-09-05') returning id as v3 \gset
select lt.check('a voucher line with no account and no party is refused',
  lt.fails(format($q$insert into voucher_lines(voucher_id, account_code, party_id, debit, credit) values (%L, null, null, 1, 0)$q$, :'v3'), 'needs an account'));

reset role;
select lt.check('an unbalanced posting is rejected at commit (even for the table owner)',
  lt.rejected_at_commit(format($q$insert into transactions(business_id, transaction_date, account_code, debit, credit, reference_type, reference_id)
                     values (%L, current_date, '1010001', 999, 0, 'adjustment', gen_random_uuid())$q$, :'bid_a')));

-- ===== 8. tenant isolation of the ledger =====
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-00000000000b', true);
select lt.check('business B sees none of business A''s ledger',
  (select count(*) from transactions) = 0);
select set_opening_balance('6410001', 1, 0);   -- B acts on its OWN books only
reset role;
select lt.check('business B''s action landed in B''s ledger and left A''s untouched',
  (select count(*) from transactions where business_id = :'bid_b') = 2
  and (select count(*) from transactions where business_id = :'bid_a' and reference_type = 'opening_balance') = 0);

select case when ok then 'PASS' else 'FAIL' end as result, name from lt.results order by n;
select count(*) filter (where not ok) as failures, count(*) as total from lt.results;
rollback;
