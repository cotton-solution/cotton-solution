-- ============================================================
-- Migration 20: DOUBLE-ENTRY LEDGER POSTING ENGINE
--
-- Until now `transactions` (the general ledger) was an empty table —
-- nothing ever wrote to it. Saving a voucher, invoice or expense had
-- no guaranteed accounting effect; every report that should read the
-- ledger (Trial Balance, P&L, Balance Sheet, Account Ledger) had
-- nothing real to read.
--
-- From this migration on:
--   * Every voucher, invoice and expense posts itself to `transactions`
--     automatically the moment it is saved — the app never writes to
--     `transactions` directly, and never needs to.
--   * The database REFUSES to commit an unbalanced posting: a
--     deferred constraint trigger checks, at the end of every
--     transaction, that debit = credit for every document that
--     touched the ledger. This is enforced even if a future code
--     change gets the accounting wrong — it becomes a hard error
--     instead of a silently wrong balance sheet.
--   * Voiding a voucher/invoice/expense (migration_19) posts an
--     equal-and-opposite REVERSAL — the original entry is never
--     edited or deleted, exactly like a real set of books.
--   * Which Chart of Accounts code each kind of posting hits (Sales,
--     Purchases, Cash, Brokerage Income…) is configurable per business
--     via `posting_accounts`, not hard-coded — every business already
--     has sensible defaults seeded for it below.
--
-- ASSUMPTION THAT NEEDS AN ACCOUNTANT'S SIGN-OFF: net_total on an
-- invoice = subtotal − brokerage_amount for BOTH purchase and sale
-- invoices (that's how the invoice form already computes it). The
-- balanced postings below assume a commission-agent model:
--   Purchase (buying from the party): Dr Purchases subtotal /
--     Cr Party net_total / Cr Brokerage Income brokerage_amount.
--   Sale (selling to the party): Dr Party net_total / Dr Brokerage
--     Expense brokerage_amount / Cr Sales subtotal.
-- Both sides always balance by construction, but WHICH side brokerage
-- sits on is a business-model choice — confirm this matches how this
-- business actually books brokerage before relying on the P&L it
-- produces, and remap `posting_accounts` (or ask for the alternative
-- treatment) if not.
--
-- Requires migration_16 (my_business_id) and migration_19 (document
-- lifecycle: status/void, block_locked_document_change, log_audit) to
-- already be applied. Safe to run on the live project — no existing
-- data is changed beyond adding new Chart of Accounts rows and
-- posting_accounts defaults. Run once in the Supabase SQL Editor.
-- ============================================================


-- ------------------------------------------------------------
-- A. a few more default accounts every business needs to post to,
--    added both to every existing business and to the seed for new
--    ones (on_conflict makes this idempotent).
-- ------------------------------------------------------------
insert into chart_of_accounts (business_id, code, name, account_type)
select b.id, v.code, v.name, v.account_type
from businesses b
cross join (values
  ('4020001', 'Sales',             'income'),
  ('5020001', 'Purchases',         'expense'),
  ('5030001', 'Brokerage Expense', 'expense')
) as v(code, name, account_type)
on conflict (business_id, code) do nothing;

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
    (new.id, 'wht_payable', '2010001');

  return new;
end;
$$;
-- (trg_seed_new_business already points at this function from schema.sql)


-- ------------------------------------------------------------
-- B. posting_accounts — which CoA code each kind of automatic
--    posting hits. A business can be more specific than the generic
--    key (e.g. 'sales_brokerage' for just Brokerage-category sales)
--    by inserting an extra row; get_posting_account() prefers the
--    more specific key and falls back to the generic one.
-- ------------------------------------------------------------
create table if not exists posting_accounts (
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  key text not null,
  account_code text not null,
  primary key (business_id, key)
);

alter table posting_accounts enable row level security;
drop policy if exists "Tenant isolation" on posting_accounts;
create policy "Tenant isolation" on posting_accounts
  for all to authenticated
  using (business_id = my_business_id())
  with check (business_id = my_business_id());

-- Back-fill for every business that already existed before this migration.
insert into posting_accounts (business_id, key, account_code)
select b.id, v.key, v.code
from businesses b
cross join (values
  ('cash', '1010001'), ('bank', '1020001'), ('sales', '4020001'),
  ('purchases', '5020001'), ('brokerage_income', '4010001'),
  ('brokerage_expense', '5030001'), ('default_expense', '5010001'),
  ('wht_payable', '2010001')
) as v(key, code)
where exists (select 1 from chart_of_accounts c where c.business_id = b.id and c.code = v.code)
on conflict (business_id, key) do nothing;

create or replace function get_posting_account(p_business_id uuid, p_keys text[])
returns text
language sql
stable
as $$
  select account_code from posting_accounts
   where business_id = p_business_id and key = any(p_keys)
   order by array_position(p_keys, key)
   limit 1
$$;


-- ------------------------------------------------------------
-- C. the balance guarantee: at commit time, every document that
--    touched `transactions` in this changeset must sum to zero.
-- ------------------------------------------------------------
alter table transactions
  alter column reference_type set not null,
  alter column reference_id set not null;

create or replace function check_ledger_balance()
returns trigger
language plpgsql
as $$
declare
  v_sum numeric;
  v_type text := coalesce(new.reference_type, old.reference_type);
  v_id uuid := coalesce(new.reference_id, old.reference_id);
begin
  select coalesce(sum(debit), 0) - coalesce(sum(credit), 0) into v_sum
    from transactions
   where reference_type = v_type and reference_id = v_id;

  if v_sum <> 0 then
    raise exception
      'Unbalanced ledger posting for % % (debit − credit = %). This is a bug in the posting engine, not something to correct by hand — please report it.',
      v_type, v_id, v_sum using errcode = '22023';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_check_ledger_balance on transactions;
create constraint trigger trg_check_ledger_balance
  after insert or update or delete on transactions
  deferrable initially deferred
  for each row execute function check_ledger_balance();

alter table transactions enable row level security;
drop policy if exists "Tenant isolation" on transactions;
drop policy if exists "Read own business ledger" on transactions;
create policy "Read own business ledger" on transactions
  for select to authenticated
  using (business_id = my_business_id());
-- No insert/update/delete policy for anyone — only the SECURITY
-- DEFINER posting triggers below (which run as their owner) write here.
revoke insert, update, delete on transactions from authenticated, anon;


-- ------------------------------------------------------------
-- D. Vouchers post themselves — the user has already told the app
--    exactly which accounts to debit/credit per line (voucher_lines);
--    this just mirrors those lines into the shared ledger.
-- ------------------------------------------------------------
create or replace function post_voucher_line_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v record;
begin
  select business_id, voucher_date, status, narration into v
    from vouchers where id = new.voucher_id;

  if v.status = 'posted' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    values
      (v.business_id, v.voucher_date, new.account_code, new.debit, new.credit,
       'voucher', new.voucher_id, coalesce(new.line_narration, v.narration));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_post_voucher_line on voucher_lines;
create trigger trg_post_voucher_line
  after insert on voucher_lines
  for each row execute function post_voucher_line_to_ledger();

-- Catches a draft voucher's lines up to the ledger once it's posted
-- (post_voucher()), and reverses every one of its postings on void.
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
    select new.business_id, new.voucher_date, l.account_code, l.debit, l.credit,
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

drop trigger if exists trg_post_voucher_status on vouchers;
create trigger trg_post_voucher_status
  after update of status on vouchers
  for each row execute function post_voucher_on_status_change();


-- ------------------------------------------------------------
-- E. Invoices post themselves on save (see the accounting-model note
--    at the top of this file) and reverse on void.
-- ------------------------------------------------------------
create or replace function post_invoice_entries(
  p_business_id uuid, p_date date, p_invoice_id uuid, p_no text,
  p_type text, p_category text, p_party_code text,
  p_subtotal numeric, p_net_total numeric, p_brokerage numeric
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_trade_account text;
  v_brokerage_account text;
begin
  if p_party_code is null then
    raise exception 'This invoice needs a party to post to the ledger (it is who we owe, or who owes us).';
  end if;

  if p_type = 'purchase' then
    v_trade_account := get_posting_account(p_business_id, array['purchases_' || p_category, 'purchases']);
    if v_trade_account is null then
      raise exception 'No "purchases" ledger account is set up for this business — add one in Settings → Posting Accounts.';
    end if;
    insert into transactions (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration) values
      (p_business_id, p_date, v_trade_account, p_subtotal, 0, 'invoice', p_invoice_id, 'Purchase ' || p_no),
      (p_business_id, p_date, p_party_code, 0, p_net_total, 'invoice', p_invoice_id, 'Purchase ' || p_no);
    if p_brokerage > 0 then
      v_brokerage_account := get_posting_account(p_business_id, array['brokerage_income_' || p_category, 'brokerage_income']);
      if v_brokerage_account is null then
        raise exception 'No "brokerage_income" ledger account is set up for this business — add one in Settings → Posting Accounts.';
      end if;
      insert into transactions (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration) values
        (p_business_id, p_date, v_brokerage_account, 0, p_brokerage, 'invoice', p_invoice_id, 'Brokerage on ' || p_no);
    end if;

  else -- sale
    v_trade_account := get_posting_account(p_business_id, array['sales_' || p_category, 'sales']);
    if v_trade_account is null then
      raise exception 'No "sales" ledger account is set up for this business — add one in Settings → Posting Accounts.';
    end if;
    insert into transactions (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration) values
      (p_business_id, p_date, p_party_code, p_net_total, 0, 'invoice', p_invoice_id, 'Sale ' || p_no);
    if p_brokerage > 0 then
      v_brokerage_account := get_posting_account(p_business_id, array['brokerage_expense_' || p_category, 'brokerage_expense']);
      if v_brokerage_account is null then
        raise exception 'No "brokerage_expense" ledger account is set up for this business — add one in Settings → Posting Accounts.';
      end if;
      insert into transactions (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration) values
        (p_business_id, p_date, v_brokerage_account, p_brokerage, 0, 'invoice', p_invoice_id, 'Brokerage on ' || p_no);
    end if;
    insert into transactions (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration) values
      (p_business_id, p_date, v_trade_account, 0, p_subtotal, 'invoice', p_invoice_id, 'Sale ' || p_no);
  end if;
end;
$$;

create or replace function post_invoice_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'posted' then
    perform post_invoice_entries(
      new.business_id, new.invoice_date, new.id, new.invoice_no,
      new.invoice_type, new.invoice_category, new.party_id,
      new.subtotal, new.net_total, new.brokerage_amount
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_post_invoice on invoices;
create trigger trg_post_invoice
  after insert on invoices
  for each row execute function post_invoice_to_ledger();

create or replace function post_invoice_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'posted' and old.status = 'draft' then
    perform post_invoice_entries(
      new.business_id, new.invoice_date, new.id, new.invoice_no,
      new.invoice_type, new.invoice_category, new.party_id,
      new.subtotal, new.net_total, new.brokerage_amount
    );
  elsif new.status = 'void' and old.status <> 'void' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    select business_id, current_date, account_code, credit, debit,
           'invoice', reference_id, 'Reversal (void): ' || coalesce(new.void_reason, 'no reason given')
      from transactions where reference_type = 'invoice' and reference_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_post_invoice_status on invoices;
create trigger trg_post_invoice_status
  after update of status on invoices
  for each row execute function post_invoice_on_status_change();


-- ------------------------------------------------------------
-- F. Expenses get the same lifecycle as vouchers/invoices
--    (migration_19 didn't cover them) plus their own posting: Dr the
--    expense account, Cr Cash or the specific bank account paid from.
-- ------------------------------------------------------------
alter table expenses
  add column if not exists account_code text,
  add column if not exists bank_account_id uuid references bank_accounts(id) on delete set null,
  add column if not exists status document_status not null default 'posted',
  add column if not exists posted_at timestamptz,
  add column if not exists posted_by uuid references auth.users(id) on delete set null,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users(id) on delete set null,
  add column if not exists void_reason text;

update expenses set posted_at = created_at where posted_at is null and status = 'posted';
create index if not exists idx_expenses_status on expenses (business_id, status);

alter table bank_accounts add column if not exists account_code text;

drop trigger if exists trg_lock_expense on expenses;
create trigger trg_lock_expense
  before update or delete on expenses
  for each row execute function block_locked_document_change();

drop trigger if exists trg_audit_log on expenses;
create trigger trg_audit_log
  after insert or update or delete on expenses
  for each row execute function log_audit();

create or replace function void_expense(p_id uuid, p_reason text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_status document_status;
begin
  select status into v_status from expenses where id = p_id;
  if v_status is null then raise exception 'Expense not found or you do not have access to it.'; end if;
  if v_status = 'void' then raise exception 'This expense is already void.'; end if;

  perform set_config('app.bypass_lifecycle_lock', 'on', true);
  update expenses
     set status = 'void', voided_at = now(), voided_by = auth.uid(), void_reason = p_reason
   where id = p_id;
  perform set_config('app.bypass_lifecycle_lock', 'off', true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function void_expense(uuid, text) to authenticated;
  end if;
end $$;

create or replace function post_expense_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense_account text;
  v_credit_account text;
begin
  if new.status <> 'posted' then
    return new;
  end if;

  v_expense_account := coalesce(new.account_code, get_posting_account(new.business_id, array['default_expense']));
  if v_expense_account is null then
    raise exception 'No expense ledger account is set up for this business — add one in Settings → Posting Accounts.';
  end if;

  if new.payment_method = 'cash' then
    v_credit_account := get_posting_account(new.business_id, array['cash']);
  elsif new.payment_method = 'bank' then
    select account_code into v_credit_account from bank_accounts where id = new.bank_account_id;
    v_credit_account := coalesce(v_credit_account, get_posting_account(new.business_id, array['bank']));
  else -- credit_card
    v_credit_account := get_posting_account(new.business_id, array['credit_card', 'bank']);
  end if;
  if v_credit_account is null then
    raise exception 'No % ledger account is set up for this business — add one in Settings → Posting Accounts.', new.payment_method;
  end if;

  insert into transactions (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration) values
    (new.business_id, new.expense_date, v_expense_account, new.amount, 0, 'expense', new.id, coalesce(new.notes, new.category)),
    (new.business_id, new.expense_date, v_credit_account, 0, new.amount, 'expense', new.id, coalesce(new.notes, new.category));
  return new;
end;
$$;

drop trigger if exists trg_post_expense on expenses;
create trigger trg_post_expense
  after insert on expenses
  for each row execute function post_expense_to_ledger();

create or replace function post_expense_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'void' and old.status <> 'void' then
    insert into transactions
      (business_id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration)
    select business_id, current_date, account_code, credit, debit,
           'expense', reference_id, 'Reversal (void): ' || coalesce(new.void_reason, 'no reason given')
      from transactions where reference_type = 'expense' and reference_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_post_expense_status on expenses;
create trigger trg_post_expense_status
  after update of status on expenses
  for each row execute function post_expense_on_status_change();
