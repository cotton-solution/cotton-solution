-- ============================================================
-- Migration 24: LEDGER REPAIR, BACKFILL & SECURITY FIX
--
-- Found while verifying that vouchers, invoices, expenses and opening
-- balances really do reach the ledger (migration_20 / migration_23).
-- Three problems, all fixed here:
--
--  1. VOUCHER PARTY LINES POSTED TO NO ACCOUNT (bug in migration_20).
--     The voucher screens save a party's line with party_id set and
--     account_code empty. The posting trigger copied account_code only,
--     so the party's side of EVERY voucher landed in the ledger with a
--     blank account — invisible in that party's Account Ledger, and
--     missing from the Trial Balance. Fixed: a party line posts to the
--     party's own account code (the same code invoices and opening
--     balances already use). Existing wrongly-posted vouchers are
--     rebuilt from their lines.
--
--  2. NOTHING BEFORE MIGRATION_20 WAS EVER POSTED. Vouchers, invoices
--     and expenses saved before the posting engine existed have no
--     ledger entries at all, so old parties showed an empty ledger.
--     They are posted now, on their original dates (voided ones with
--     their reversal). A document that cannot be posted safely — lines
--     that do not balance, an invoice with no party, a missing posting
--     account — is NOT forced in; it is listed in
--     ledger_backfill_skipped with the reason, so the ledger is never
--     silently wrong.
--
--  3. SECURITY: post_invoice_entries() (migration_20) is SECURITY
--     DEFINER and was callable by every signed-in user through the API
--     — any tenant could have written ledger entries into ANY other
--     tenant's books. Execute rights are now revoked from users; only
--     the posting triggers (which run as the table owner) can use it.
--     audit_tenant_isolation() now also flags any such exposed
--     function, so this class of mistake cannot come back unnoticed.
--
-- Requires migrations 16–23. Safe to run on the live project;
-- idempotent (re-running only retries documents still skipped).
-- Run once in the Supabase SQL Editor, then run:
--     select * from audit_tenant_isolation();     -- must be empty
--     select * from ledger_backfill_skipped;      -- review anything listed
-- ============================================================


-- ------------------------------------------------------------
-- A. party lines post to the party's account code
-- ------------------------------------------------------------
create or replace function post_voucher_line_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  v_account text := coalesce(new.account_code, new.party_id);
begin
  if v_account is null then
    raise exception 'Every voucher line needs an account or a party.' using errcode = '23514';
  end if;

  select business_id, voucher_date, status, narration into v
    from vouchers where id = new.voucher_id;

  if v.status = 'posted' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    values
      (v.business_id, v.voucher_date, v_account, new.debit, new.credit,
       'voucher', new.voucher_id, coalesce(new.line_narration, v.narration));
  end if;
  return new;
end;
$$;

create or replace function post_voucher_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'posted' and old.status = 'draft' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    select new.business_id, new.voucher_date, coalesce(l.account_code, l.party_id), l.debit, l.credit,
           'voucher', new.id, coalesce(l.line_narration, new.narration)
      from voucher_lines l where l.voucher_id = new.id;

  elsif new.status = 'void' and old.status <> 'void' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    select business_id, current_date, account_code, credit, debit,
           'voucher', reference_id, 'Reversal (void): ' || coalesce(new.void_reason, 'no reason given')
      from transactions where reference_type = 'voucher' and reference_id = new.id;
  end if;
  return new;
end;
$$;


-- ------------------------------------------------------------
-- B. expense posting as a reusable function (the trigger and the
--    backfill below must post identically)
-- ------------------------------------------------------------
create or replace function post_expense_entries(p_exp expenses)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense_account text;
  v_credit_account text;
begin
  v_expense_account := coalesce(p_exp.account_code, get_posting_account(p_exp.business_id, array['default_expense']));
  if v_expense_account is null then
    raise exception 'No expense ledger account is set up for this business — add one in Settings → Posting Accounts.';
  end if;

  if p_exp.payment_method = 'cash' then
    v_credit_account := get_posting_account(p_exp.business_id, array['cash']);
  elsif p_exp.payment_method = 'bank' then
    select account_code into v_credit_account from bank_accounts where id = p_exp.bank_account_id;
    v_credit_account := coalesce(v_credit_account, get_posting_account(p_exp.business_id, array['bank']));
  else -- credit_card
    v_credit_account := get_posting_account(p_exp.business_id, array['credit_card', 'bank']);
  end if;
  if v_credit_account is null then
    raise exception 'No % ledger account is set up for this business — add one in Settings → Posting Accounts.', p_exp.payment_method;
  end if;

  insert into transactions (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration) values
    (p_exp.business_id, p_exp.expense_date, v_expense_account, p_exp.amount, 0, 'expense', p_exp.id, coalesce(p_exp.notes, p_exp.category)),
    (p_exp.business_id, p_exp.expense_date, v_credit_account, 0, p_exp.amount, 'expense', p_exp.id, coalesce(p_exp.notes, p_exp.category));
end;
$$;

create or replace function post_expense_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'posted' then
    perform post_expense_entries(new);
  end if;
  return new;
end;
$$;


-- ------------------------------------------------------------
-- C. SECURITY: none of the posting internals may be called by users.
--    (Triggers run them as the table owner, which is unaffected.)
-- ------------------------------------------------------------
revoke all on function post_invoice_entries(uuid, date, uuid, text, text, text, text, numeric, numeric, numeric)
  from public, anon, authenticated;
revoke all on function post_expense_entries(expenses) from public, anon, authenticated;


-- ------------------------------------------------------------
-- D. Rebuild helpers — each returns 'ok' or the reason it was skipped
--    (a skip happens BEFORE anything is touched). Owner-only.
-- ------------------------------------------------------------
create table if not exists ledger_backfill_skipped (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  doc_type text not null,
  doc_id uuid not null,
  doc_no text,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (doc_type, doc_id)
);
create index if not exists idx_ledger_backfill_skipped_business on ledger_backfill_skipped (business_id);
alter table ledger_backfill_skipped enable row level security;
drop policy if exists "Read own business" on ledger_backfill_skipped;
create policy "Read own business" on ledger_backfill_skipped
  for select to authenticated using (business_id = my_business_id());
revoke insert, update, delete on ledger_backfill_skipped from authenticated, anon;

create or replace function ledger_rebuild_voucher(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v vouchers%rowtype;
  v_diff numeric;
  v_blank int;
  v_lines int;
begin
  select * into v from vouchers where id = p_id;
  if not found then return 'voucher not found'; end if;
  if v.status = 'draft' then return 'ok'; end if;

  select coalesce(sum(debit), 0) - coalesce(sum(credit), 0),
         count(*) filter (where coalesce(account_code, party_id) is null),
         count(*)
    into v_diff, v_blank, v_lines
    from voucher_lines where voucher_id = p_id;

  if v_lines = 0 then return 'voucher has no lines'; end if;
  if v_blank > 0 then return 'a line has neither an account nor a party'; end if;
  if v_diff <> 0 then return 'lines do not balance (debit minus credit = ' || v_diff || ')'; end if;

  delete from transactions where reference_type = 'voucher' and reference_id = p_id;

  insert into transactions
    (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
  select v.business_id, v.voucher_date, coalesce(l.account_code, l.party_id), l.debit, l.credit,
         'voucher', p_id, coalesce(l.line_narration, v.narration)
    from voucher_lines l where l.voucher_id = p_id;

  if v.status = 'void' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    select v.business_id, coalesce(v.voided_at::date, current_date), coalesce(l.account_code, l.party_id),
           l.credit, l.debit, 'voucher', p_id,
           'Reversal (void): ' || coalesce(v.void_reason, 'no reason given')
      from voucher_lines l where l.voucher_id = p_id;
  end if;
  return 'ok';
end;
$$;

create or replace function ledger_rebuild_invoice(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v invoices%rowtype;
begin
  select * into v from invoices where id = p_id;
  if not found then return 'invoice not found'; end if;
  if v.status = 'draft' then return 'ok'; end if;
  if v.party_id is null then return 'invoice has no party'; end if;
  if v.subtotal <> v.net_total + v.brokerage_amount then
    return 'subtotal does not equal net total + brokerage (' || v.subtotal || ' vs ' || (v.net_total + v.brokerage_amount) || ')';
  end if;

  delete from transactions where reference_type = 'invoice' and reference_id = p_id;

  perform post_invoice_entries(
    v.business_id, v.invoice_date, v.id, v.invoice_no,
    v.invoice_type, v.invoice_category, v.party_id,
    v.subtotal, v.net_total, v.brokerage_amount);

  if v.status = 'void' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    select business_id, coalesce(v.voided_at::date, current_date), account_code, credit, debit,
           'invoice', reference_id, 'Reversal (void): ' || coalesce(v.void_reason, 'no reason given')
      from transactions where reference_type = 'invoice' and reference_id = p_id;
  end if;
  return 'ok';
end;
$$;

create or replace function ledger_rebuild_expense(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare e expenses%rowtype;
begin
  select * into e from expenses where id = p_id;
  if not found then return 'expense not found'; end if;
  if e.status = 'draft' then return 'ok'; end if;

  delete from transactions where reference_type = 'expense' and reference_id = p_id;
  perform post_expense_entries(e);

  if e.status = 'void' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    select business_id, coalesce(e.voided_at::date, current_date), account_code, credit, debit,
           'expense', reference_id, 'Reversal (void): ' || coalesce(e.void_reason, 'no reason given')
      from transactions where reference_type = 'expense' and reference_id = p_id;
  end if;
  return 'ok';
end;
$$;

revoke all on function ledger_rebuild_voucher(uuid), ledger_rebuild_invoice(uuid), ledger_rebuild_expense(uuid)
  from public, anon, authenticated;


-- ------------------------------------------------------------
-- E. Repair + backfill every document that needs it
--    (a voucher with blank-account ledger rows, or any posted/void
--    document with no ledger rows at all).
-- ------------------------------------------------------------
do $$
declare
  r record;
  res text;
  n_ok int := 0;
  n_skip int := 0;
begin
  for r in
    select v.id, v.business_id, v.voucher_no as doc_no, 'voucher'::text as doc_type
      from vouchers v
     where v.status <> 'draft'
       and (
         exists (select 1 from transactions t where t.reference_type = 'voucher' and t.reference_id = v.id and t.account_code is null)
         or not exists (select 1 from transactions t where t.reference_type = 'voucher' and t.reference_id = v.id)
       )
    union all
    select i.id, i.business_id, i.invoice_no, 'invoice'
      from invoices i
     where i.status <> 'draft'
       and not exists (select 1 from transactions t where t.reference_type = 'invoice' and t.reference_id = i.id)
    union all
    select e.id, e.business_id, coalesce(e.category, 'expense'), 'expense'
      from expenses e
     where e.status <> 'draft'
       and not exists (select 1 from transactions t where t.reference_type = 'expense' and t.reference_id = e.id)
  loop
    begin
      res := case r.doc_type
        when 'voucher' then ledger_rebuild_voucher(r.id)
        when 'invoice' then ledger_rebuild_invoice(r.id)
        else ledger_rebuild_expense(r.id)
      end;
    exception when others then
      res := sqlerrm;
    end;

    if res = 'ok' then
      n_ok := n_ok + 1;
      delete from ledger_backfill_skipped where doc_type = r.doc_type and doc_id = r.id;
    else
      n_skip := n_skip + 1;
      insert into ledger_backfill_skipped (business_id, doc_type, doc_id, doc_no, reason)
      values (r.business_id, r.doc_type, r.id, r.doc_no, res)
      on conflict (doc_type, doc_id) do update set reason = excluded.reason, doc_no = excluded.doc_no;
    end if;
  end loop;

  raise notice 'ledger backfill: % document(s) posted/repaired, % skipped (see ledger_backfill_skipped)', n_ok, n_skip;
end $$;


-- ------------------------------------------------------------
-- F. From now on a ledger row can never have a blank account.
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from transactions where account_code is null) then
    raise warning 'transactions still has rows with a blank account_code (from a skipped voucher) — NOT NULL not applied yet; fix the skipped vouchers and re-run this migration.';
  else
    alter table transactions alter column account_code set not null;
  end if;
end $$;


-- ------------------------------------------------------------
-- G. audit_tenant_isolation() — same as migration_16, plus the
--    "exposed SECURITY DEFINER function" check.
-- ------------------------------------------------------------
create or replace function audit_tenant_isolation()
returns table (severity text, object text, problem text)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with base as (
    select c.oid, c.relname::text as rel, c.relrowsecurity as rls,
           exists (select 1 from pg_attribute a
                    where a.attrelid = c.oid and a.attname = 'business_id'
                      and not a.attisdropped) as has_bid,
           coalesce((select a.attnotnull from pg_attribute a
                      where a.attrelid = c.oid and a.attname = 'business_id'
                        and not a.attisdropped), false) as bid_not_null,
           (select a.attnum from pg_attribute a
             where a.attrelid = c.oid and a.attname = 'business_id'
               and not a.attisdropped) as bid_attnum
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  platform as (select unnest(array[
    'businesses', 'admin_users', 'site_settings', 'site_slides'
  ]) as rel),
  tenant as (select * from base where has_bid),
  policies as (
    select p.tablename::text as rel, p.policyname::text as pol,
           coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '') as expr
    from pg_policies p where p.schemaname = 'public'
  )
  -- 1. every accounting table has a business_id
  select 'CRITICAL', b.rel, 'table has no business_id column (tenant data must be scoped)'
    from base b
   where not b.has_bid and b.rel not in (select rel from platform)
  union all
  -- 1b. and it is NOT NULL
  select 'CRITICAL', t.rel, 'business_id is nullable'
    from tenant t where not t.bid_not_null
  union all
  -- 2. RLS on
  select 'CRITICAL', t.rel, 'row level security is OFF'
    from tenant t where not t.rls
  union all
  select 'CRITICAL', b.rel, 'row level security is OFF'
    from base b
   where b.rel in ('businesses', 'admin_users') and not b.rls
  union all
  -- 2b. at least one policy, and every policy is tenant-scoped
  select 'CRITICAL', t.rel, 'has no RLS policy (table is unreadable or misconfigured)'
    from tenant t
   where not exists (select 1 from policies p where p.rel = t.rel)
  union all
  select 'CRITICAL', p.rel || ' / ' || p.pol, 'policy is not scoped to my_business_id()'
    from policies p join tenant t on t.rel = p.rel
   where t.rel <> 'business_members'
     and p.expr not like '%my_business_id%'
  union all
  -- 5. no platform-admin bypass on tenant tables
  select 'CRITICAL', p.rel || ' / ' || p.pol, 'policy lets is_admin() bypass tenant scope'
    from policies p join tenant t on t.rel = p.rel
   where p.expr like '%is_admin%'
  union all
  -- anon must have no access
  select 'CRITICAL', t.rel, 'anon role has table privileges'
    from tenant t
   where exists (select 1 from pg_roles where rolname = 'anon')
     and case when exists (select 1 from pg_roles where rolname = 'anon')
              then has_table_privilege('anon', t.oid, 'SELECT,INSERT,UPDATE,DELETE')
              else false end
  union all
  -- performance + scoping: business_id should lead an index
  select 'WARNING', t.rel, 'no index starts with business_id (slow, unscoped scans)'
    from tenant t
   where not exists (select 1 from pg_index i
                      where i.indrelid = t.oid and i.indkey[0] = t.bid_attnum)
  union all
  -- 5. a SECURITY DEFINER function runs with the owner's rights and
  --    ignores RLS. If a signed-in user can call it directly (Supabase
  --    exposes every public function as an RPC), it must be one of the
  --    known-safe helpers that only ever look at the caller's own
  --    business — otherwise any tenant could use it against any other.
  select 'CRITICAL', (p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')')::text,
         'SECURITY DEFINER function is callable by signed-in users and is not on the safe list (cross-tenant risk)'
    from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.prosecdef
     and p.prorettype <> 'trigger'::regtype
     and exists (select 1 from pg_roles where rolname = 'authenticated')
     and has_function_privilege('authenticated', p.oid, 'execute')
     and p.proname <> all (array[
       'my_business_id', 'owns_business', 'is_admin', 'is_business_owner',
       'is_member_of', 'can_edit_company_profile', 'can_manage_staff',
       'has_module_access', 'set_opening_balance'
     ])
$$;

revoke all on function audit_tenant_isolation() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function audit_tenant_isolation() to service_role;
  end if;
end $$;
