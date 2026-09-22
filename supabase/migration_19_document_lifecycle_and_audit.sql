-- ============================================================
-- Migration 19: document lifecycle + audit trail
--
--   Draft -> Posted -> Void   (vouchers & invoices)
--
--   * A posted voucher/invoice can no longer be silently edited or
--     hard-deleted from the app — only void_voucher()/void_invoice()
--     can change it after that, and voiding is itself an UPDATE, so
--     the original entry is never lost. Correcting a mistake is now
--     "void it, enter a new one" everywhere, not just documented in
--     the README as a limitation.
--   * Every insert/update/delete on the core accounting tables is
--     written to audit_log automatically (who, when, old value, new
--     value) — nobody has to remember to log anything.
--
-- Safe to run on the live project: every existing voucher/invoice is
-- back-filled to status = 'posted' (they were already final under the
-- old all-or-nothing model), so nothing already saved becomes
-- editable or deletable that wasn't before — it becomes correctly
-- protected. Idempotent. Run once in the Supabase SQL Editor.
-- ============================================================


-- ------------------------------------------------------------
-- A. status columns
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type document_status as enum ('draft', 'posted', 'void');
  end if;
end $$;

alter table vouchers
  add column if not exists status document_status not null default 'posted',
  add column if not exists posted_at timestamptz,
  add column if not exists posted_by uuid references auth.users(id) on delete set null,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users(id) on delete set null,
  add column if not exists void_reason text;

alter table invoices
  add column if not exists status document_status not null default 'posted',
  add column if not exists posted_at timestamptz,
  add column if not exists posted_by uuid references auth.users(id) on delete set null,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users(id) on delete set null,
  add column if not exists void_reason text;

update vouchers set posted_at = created_at where posted_at is null and status = 'posted';
update invoices set posted_at = created_at where posted_at is null and status = 'posted';

create index if not exists idx_vouchers_status on vouchers (business_id, status);
create index if not exists idx_invoices_status on invoices (business_id, status);


-- ------------------------------------------------------------
-- B. a posted document is locked: no header/line edits, no hard
--    delete. void_voucher()/void_invoice() are the only way through
--    (they flip a session-local flag so their own UPDATE is let by).
-- ------------------------------------------------------------
create or replace function block_locked_document_change()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    if old.status <> 'draft' then
      raise exception
        'This % has already been posted and cannot be deleted — void it instead (Void keeps the original entry and its audit trail; a new correcting entry can then be posted).',
        TG_TABLE_NAME using errcode = '42501';
    end if;
    return old;
  end if;

  -- UPDATE: allowed while still a draft, or when the change IS the
  -- lifecycle transition itself (post_voucher/void_voucher set this).
  if old.status <> 'draft'
     and current_setting('app.bypass_lifecycle_lock', true) is distinct from 'on' then
    raise exception
      'This % has already been posted and cannot be edited — void it and post a new one instead (keeps the audit trail intact).',
      TG_TABLE_NAME using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_voucher on vouchers;
create trigger trg_lock_voucher
  before update or delete on vouchers
  for each row execute function block_locked_document_change();

drop trigger if exists trg_lock_invoice on invoices;
create trigger trg_lock_invoice
  before update or delete on invoices
  for each row execute function block_locked_document_change();

-- NOTE: line-level (voucher_lines / invoice_lines) locking was
-- considered here too, but a fresh voucher/invoice is created as
-- header-insert-then-lines-insert with status='posted' by default, so
-- a per-row lines trigger can't reliably tell "first save" apart from
-- "someone editing a posted voucher's lines directly" without an
-- app-side transaction boundary. The header-level lock above is the
-- real guarantee: the app always updates the header before touching
-- lines (see saveVoucherWithLines), so that UPDATE is rejected first
-- and the line changes are never reached. Closing the residual gap of
-- writing to voucher_lines directly (bypassing the header) is a
-- follow-up — move voucher/invoice creation into one RPC transaction.


-- ------------------------------------------------------------
-- C. lifecycle RPCs — the only way to move a document forward once
--    it's no longer a draft. SECURITY INVOKER: RLS still decides
--    whether the caller can even see the row.
-- ------------------------------------------------------------
create or replace function post_voucher(p_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_status document_status;
begin
  select status into v_status from vouchers where id = p_id;
  if v_status is null then raise exception 'Voucher not found.'; end if;
  if v_status <> 'draft' then raise exception 'This voucher is already %.', v_status; end if;

  perform set_config('app.bypass_lifecycle_lock', 'on', true);
  update vouchers set status = 'posted', posted_at = now(), posted_by = auth.uid() where id = p_id;
  perform set_config('app.bypass_lifecycle_lock', 'off', true);
end;
$$;

create or replace function void_voucher(p_id uuid, p_reason text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_status document_status;
begin
  select status into v_status from vouchers where id = p_id;
  if v_status is null then raise exception 'Voucher not found or you do not have access to it.'; end if;
  if v_status = 'void' then raise exception 'This voucher is already void.'; end if;

  perform set_config('app.bypass_lifecycle_lock', 'on', true);
  update vouchers
     set status = 'void', voided_at = now(), voided_by = auth.uid(), void_reason = p_reason
   where id = p_id;
  perform set_config('app.bypass_lifecycle_lock', 'off', true);
end;
$$;

create or replace function post_invoice(p_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_status document_status;
begin
  select status into v_status from invoices where id = p_id;
  if v_status is null then raise exception 'Invoice not found.'; end if;
  if v_status <> 'draft' then raise exception 'This invoice is already %.', v_status; end if;

  perform set_config('app.bypass_lifecycle_lock', 'on', true);
  update invoices set status = 'posted', posted_at = now(), posted_by = auth.uid() where id = p_id;
  perform set_config('app.bypass_lifecycle_lock', 'off', true);
end;
$$;

create or replace function void_invoice(p_id uuid, p_reason text default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_status document_status;
begin
  select status into v_status from invoices where id = p_id;
  if v_status is null then raise exception 'Invoice not found or you do not have access to it.'; end if;
  if v_status = 'void' then raise exception 'This invoice is already void.'; end if;

  perform set_config('app.bypass_lifecycle_lock', 'on', true);
  update invoices
     set status = 'void', voided_at = now(), voided_by = auth.uid(), void_reason = p_reason
   where id = p_id;
  perform set_config('app.bypass_lifecycle_lock', 'off', true);
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function post_voucher(uuid), void_voucher(uuid, text),
                             post_invoice(uuid), void_invoice(uuid, text)
      to authenticated;
  end if;
end $$;


-- ------------------------------------------------------------
-- D. audit trail — every insert/update/delete on the core accounting
--    tables, automatically. Nobody can turn this off from the app:
--    the trigger runs as SECURITY DEFINER and the table has no
--    insert/update/delete policy for anyone but the trigger itself.
-- ------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create index if not exists idx_audit_log_business_record
  on audit_log (business_id, table_name, record_id, changed_at desc);

alter table audit_log enable row level security;
drop policy if exists "Read own business audit log" on audit_log;
create policy "Read own business audit log" on audit_log
  for select to authenticated
  using (business_id = my_business_id());
-- No insert/update/delete policy for anyone: only the SECURITY DEFINER
-- trigger function below (which runs as its owner) can write here.
revoke insert, update, delete on audit_log from authenticated, anon;

create or replace function log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bid uuid;
  rid uuid;
begin
  if TG_OP = 'DELETE' then
    bid := old.business_id;
    rid := old.id;
  else
    bid := new.business_id;
    rid := new.id;
  end if;

  insert into audit_log (business_id, table_name, record_id, action, changed_by, old_data, new_data)
  values (
    bid, TG_TABLE_NAME, rid, lower(TG_OP), auth.uid(),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if TG_OP = 'DELETE' then return old; else return new; end if;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'vouchers', 'voucher_lines', 'invoices', 'invoice_lines',
    'chart_of_accounts', 'parties_customers', 'business_members'
  ]
  loop
    execute format('drop trigger if exists trg_audit_log on %I', t);
    execute format(
      'create trigger trg_audit_log
         after insert or update or delete on %I
         for each row execute function log_audit()', t);
  end loop;
end $$;
