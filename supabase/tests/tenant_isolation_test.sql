-- ============================================================
-- Tenant isolation test-suite (the 5 launch-blocking guarantees)
--
--   1. every accounting record carries business_id
--   2. RLS is on for every tenant table
--   3. a user only reaches data through their own business membership
--   4. reads / writes stay inside the caller's business
--   5. platform admin / service paths cannot read or write tenant data
--
-- HOW TO RUN (local Postgres or a STAGING Supabase project — never
-- production, it inserts fake users into auth.users):
--     psql "$DATABASE_URL" -f supabase/tests/tenant_isolation_test.sql
-- Everything happens inside one transaction that is ROLLED BACK, so
-- nothing is left behind. Any row printed as FAIL is a launch blocker.
-- ============================================================
\set ON_ERROR_STOP on
begin;

create schema t;
create table t.results (n serial, name text, ok boolean);
grant usage on schema t to authenticated;
grant all on t.results to authenticated;
grant usage on sequence t.results_n_seq to authenticated;

create function t.check(p_name text, p_ok boolean) returns void
language sql security definer as $$ insert into t.results(name, ok) values (p_name, coalesce(p_ok,false)); $$;
grant execute on function t.check(text, boolean) to authenticated;

-- true when the statement raises (RLS violation, trigger, FK ...).
-- Side effects of a statement that unexpectedly SUCCEEDS are rolled back
-- (sub-transaction) so one failing check can never contaminate the next.
create function t.fails(p_sql text) returns boolean language plpgsql as $$
begin
  execute p_sql;
  raise exception using errcode = 'XX999', message = 't.no_error';
exception
  when sqlstate 'XX999' then return false;
  when others then return true;
end $$;
grant execute on function t.fails(text) to authenticated;

-- rows touched by a statement (RLS hides rows silently on update/delete);
-- -1 if the statement errored. Always rolled back.
create function t.touched(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute p_sql; get diagnostics n = row_count;
  raise exception using errcode = 'XX998', message = n::text;
exception
  when sqlstate 'XX998' then return sqlerrm::bigint;
  when others then return -1;
end $$;
grant execute on function t.touched(text) to authenticated;

create function t.audit_count() returns bigint language plpgsql as $$
declare n bigint; begin execute 'select count(*) from public.audit_tenant_isolation()' into n; return n;
exception when undefined_function then return -1; end $$;
grant execute on function t.audit_count() to authenticated;

create function t.as_user(p_uid uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', p_uid::text, true); execute 'set local role authenticated'; end $$;
create function t.done() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',true); end $$;

-- ---------- fixtures (as superuser: RLS bypassed) ----------
create table t.ids as select
  gen_random_uuid() ua, gen_random_uuid() ub, gen_random_uuid() uc_admin, gen_random_uuid() us_staff;

insert into auth.users (id, email) select ua, 'a@test.pk' from t.ids;
insert into auth.users (id, email) select ub, 'b@test.pk' from t.ids;
insert into auth.users (id, email) select uc_admin, 'admin@test.pk' from t.ids;  -- platform admin who ALSO signed up normally (README step 7)
insert into auth.users (id, email, raw_user_meta_data) select us_staff, 's@test.pk', '{"skip_business_creation": true}' from t.ids;
insert into admin_users (id, email) select uc_admin, 'admin@test.pk' from t.ids;

create table t.biz as
  select (select id from businesses where owner_id = ua) a,
         (select id from businesses where owner_id = ub) b,
         (select id from businesses where owner_id = uc_admin) c from t.ids;
insert into business_members (business_id, user_id, email, name, role)
  select b.a, i.us_staff, 's@test.pk', 'Staff', 'viewer' from t.biz b, t.ids i;

-- one row of every kind in A and in B
do $$ declare x record; v uuid; inv uuid; item uuid; wh uuid; ba uuid; q uuid; po uuid; bt uuid;
begin
  for x in select a as bid, 'A' tag from t.biz union all select b, 'B' from t.biz union all select c, 'C' from t.biz loop
    insert into parties_customers(business_id, party_id, name) values (x.bid, '6210001', 'Party '||x.tag);
    insert into vouchers(business_id, voucher_no, voucher_type, voucher_date) values (x.bid, 'V-1', 'journal', current_date) returning id into v;
    insert into voucher_lines(voucher_id, account_code, debit) values (v, '1010001', 10);
    insert into invoices(business_id, invoice_no, invoice_category, invoice_type, invoice_date, party_id) values (x.bid, 'I-1', 'general', 'sale', current_date, '6210001') returning id into inv;
    insert into invoice_lines(invoice_id, description, qty, rate) values (inv, 'x', 1, 1);
    insert into inventory_items(business_id, sku, name) values (x.bid, 'S1', 'Item '||x.tag) returning id into item;
    insert into warehouses(business_id, name) values (x.bid, 'WH '||x.tag) returning id into wh;
    insert into stock_movements(business_id, item_id, warehouse_id, movement_type, qty) values (x.bid, item, wh, 'in', 5);
    insert into bank_accounts(business_id, account_name, bank_name) values (x.bid, 'Acc '||x.tag, 'Bank') returning id into ba;
    insert into bank_reconciliations(business_id, bank_account_id, statement_date) values (x.bid, ba, current_date);
    insert into expenses(business_id, category, amount) values (x.bid, 'Rent', 1);
    insert into transactions(business_id, transaction_date, account_code, debit, reference_type, reference_id) values (x.bid, current_date, '1010001', 1, 'adjustment', gen_random_uuid());
    insert into quotations(business_id, quote_no) values (x.bid, 'Q-1') returning id into q;
    insert into quotation_lines(quotation_id, description) values (q, 'x');
    insert into purchase_orders(business_id, po_no) values (x.bid, 'PO-1') returning id into po;
    insert into purchase_order_lines(purchase_order_id, description) values (po, 'x');
    insert into invoice_batches(business_id, batch_label) values (x.bid, 'B') returning id into bt;
    insert into invoice_batch_lines(batch_id, invoice_type, amount) values (bt, 'sale', 1);
  end loop;
end $$;

grant select on t.ids, t.biz to authenticated;
\o /dev/null
create table t.refs as select
  (select id from vouchers where business_id=(select b from t.biz) limit 1) voucher_b,
  (select id from inventory_items where business_id=(select b from t.biz) limit 1) item_b,
  (select id from warehouses where business_id=(select b from t.biz) limit 1) wh_b,
  (select id from bank_accounts where business_id=(select b from t.biz) limit 1) bank_b,
  (select id from invoices where business_id=(select b from t.biz) limit 1) inv_b;
grant select on t.refs to authenticated;
-- ---------- 1) A only sees A ----------
select t.as_user(ua) from t.ids;
select t.check('A sees only own parties', (select count(*) from parties_customers)=1 and (select name from parties_customers)='Party A');
select t.check('A sees only own vouchers', (select count(*) from vouchers)=1);
select t.check('A sees only own voucher_lines', (select count(*) from voucher_lines)=1);
select t.check('A sees only own invoice_lines', (select count(*) from invoice_lines)=1);
select t.check('A sees only own transactions (ledger)', (select count(*) from transactions) > 0
  and (select count(distinct business_id) from transactions) <= 1);
select t.check('A sees only own stock_movements (inventory)', (select count(*) from stock_movements)=1);
select t.check('A sees only own bank_reconciliations', (select count(*) from bank_reconciliations)=1);
select t.check('A sees only own business row', (select count(*) from businesses)=1);
select t.check('A cannot see admin list', (select count(*) from admin_users)=0);
select t.done();

-- ---------- 2) cross-tenant WRITES are blocked ----------
select t.as_user(ua) from t.ids;
select t.check('A cannot insert a party into B',
  t.fails(format($q$insert into parties_customers(business_id, party_id, name) values (%L,'X1','evil')$q$, (select b from t.biz))));
select t.check('A cannot move own row to B (business_id immutable)',
  t.fails(format($q$update parties_customers set business_id=%L$q$, (select b from t.biz))));
select t.check('A cannot update B rows',
  t.touched(format($q$update vouchers set narration='hacked' where business_id=%L$q$, (select b from t.biz)))=0);
select t.check('A cannot delete B rows',
  t.touched(format($q$delete from expenses where business_id=%L$q$, (select b from t.biz)))=0);
select t.check('A cannot attach a voucher_line to B''s voucher',
  t.fails(format($q$insert into voucher_lines(voucher_id, account_code, debit) values (%L,'1010001',999)$q$, (select voucher_b from t.refs))));
-- child insert must work for own voucher WITHOUT passing business_id (the app never does)
select t.check('A can add a line to own voucher (business_id inherited)',
  not t.fails($q$insert into voucher_lines(voucher_id, account_code, debit) select id,'1010001',5 from vouchers$q$));
select t.done();

-- cross-tenant reference: item/warehouse/bank belong to B, movement belongs to A
select t.as_user(ua) from t.ids;
select t.check('A cannot reference B''s item in a stock movement',
  t.fails(format($q$insert into stock_movements(business_id,item_id,movement_type,qty) values (public.my_business_id(), %L,'in',1)$q$,
    (select item_b from t.refs))));
select t.done();
-- (the row above is invisible to A under RLS, so also test it as superuser-provided id)
select t.as_user(ua) from t.ids;
select t.check('A cannot reference B''s bank account in a reconciliation',
  t.fails(format($q$insert into bank_reconciliations(business_id,bank_account_id,statement_date) values (public.my_business_id(), %L, current_date)$q$,
    (select bank_b from t.refs))));
select t.check('A cannot use B''s warehouse in own stock movement',
  t.fails(format($q$insert into stock_movements(business_id,item_id,warehouse_id,movement_type,qty)
     values (public.my_business_id(), (select id from inventory_items limit 1), %L,'in',1)$q$, (select wh_b from t.refs))));
select t.check('A cannot link a quotation to B''s invoice',
  t.fails(format($q$update quotations set converted_invoice_id=%L$q$, (select inv_b from t.refs))));
select t.done();

-- ---------- 3) platform admin must NOT see or touch tenant data ----------
select t.as_user(uc_admin) from t.ids;
select t.check('platform admin sees only OWN workspace parties (not every tenant)', (select count(*) from parties_customers)=1);
select t.check('platform admin sees only OWN workspace vouchers', (select count(*) from vouchers)=1);
select t.check('platform admin sees only OWN workspace transactions', (select count(*) from transactions) > 0
  and (select count(distinct business_id) from transactions) <= 1);
select t.check('platform admin sees only OWN workspace inventory', (select count(*) from inventory_items)=1);
select t.check('platform admin can still manage subscriptions (list businesses)', (select count(*) from businesses)>=3);
select t.check('platform admin cannot write into tenant A',
  t.fails(format($q$insert into parties_customers(business_id, party_id, name) values (%L,'ADM','x')$q$, (select a from t.biz))));
select t.check('platform admin cannot grant himself membership in A',
  t.fails(format($q$insert into business_members(business_id,user_id,email,role) values (%L,%L,'admin@test.pk','admin')$q$, (select a from t.biz),(select uc_admin from t.ids))));
select t.check('platform admin can still change a subscription',
  t.touched(format($q$update businesses set subscription_status='active' where id=%L$q$, (select a from t.biz)))=1);
select t.done();

-- ---------- 4) staff membership ----------
select t.as_user(us_staff) from t.ids;
select t.check('staff sees the employer''s data', (select count(*) from parties_customers)=1 and (select name from parties_customers)='Party A');
select t.check('staff cannot insert into another business',
  t.fails(format($q$insert into parties_customers(business_id, party_id, name) values (%L,'S1','x')$q$, (select b from t.biz))));
select t.check('staff cannot change own role', t.touched($q$update business_members set role='admin'$q$)=0);
select t.check('staff cannot add members',
  t.fails(format($q$insert into business_members(business_id,user_id,email,role) values (%L,%L,'x@x.pk','admin')$q$, (select a from t.biz), gen_random_uuid())));
select t.done();

-- ---------- 5) membership integrity ----------
select t.check('one login cannot belong to two businesses',
  t.fails(format($q$insert into business_members(business_id,user_id,email,role) values (%L,%L,'s@test.pk','viewer')$q$, (select b from t.biz),(select us_staff from t.ids))));
select t.check('a business owner cannot also be staff elsewhere',
  t.fails(format($q$insert into business_members(business_id,user_id,email,role) values (%L,%L,'b@test.pk','viewer')$q$, (select a from t.biz),(select ub from t.ids))));

-- ---------- 6) catalog audit (structural guarantees) ----------
select t.check('audit_tenant_isolation() reports nothing',
  t.audit_count()=0);

-- ---------- report ----------
\o
select case when ok then 'PASS' else 'FAIL' end as result, name from t.results order by n;
select count(*) filter (where not ok) as failures, count(*) as total from t.results;
rollback;
