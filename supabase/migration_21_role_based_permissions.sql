-- ============================================================
-- Migration 21: DATABASE-LEVEL ROLE PERMISSIONS
--
-- Until now, a role (admin / accountant / trader / viewer / custom)
-- only hid modules in the sidebar (lib/team-data.ts,
-- lib/modules.ts) — the API itself didn't know roles existed, so any
-- signed-in staff login could insert/update/delete in ANY table via
-- a direct request, whatever the UI showed them. This migration
-- makes the same rule the sidebar already enforces also the rule the
-- database enforces:
--
--   * A Viewer's default modules are {dashboard, reports} — neither
--     is writable — so a Viewer literally cannot create/edit/delete
--     anything, anywhere, not just in the vouchers screen.
--   * An Accountant (transactions, expenses, reports) can post
--     vouchers and expenses but not touch Sales/Purchases/Inventory
--     or Settings — including managing other staff logins.
--   * A Trader (sales, purchases, reports) can create invoices,
--     quotations and purchase orders but not vouchers, expenses,
--     inventory or Settings.
--   * Only the owner or an Admin-role staff login can manage staff
--     (business_members) — even a "custom" role with Settings access
--     cannot, since granting logins is more sensitive than editing
--     the Chart of Accounts.
--
-- READ access stays business-wide for every active staff login
-- (Reports has to read vouchers/invoices/expenses/inventory to mean
-- anything) — only INSERT/UPDATE/DELETE are gated by module. The
-- business owner always has full access to every module, in their
-- own business only (is_admin() is deliberately not used here —
-- see migration_16 for why the platform admin has no special access
-- to tenant data).
--
-- MAINTENANCE: has_module_access() below is the server-side twin of
-- DEFAULT_ROLE_MODULES in lib/team-data.ts. If a built-in role's
-- module set changes there, mirror the change here too, or the UI
-- and the database will disagree about what a role can do.
--
-- Requires migration_16 (my_business_id, owns_business) and
-- migration_19 (document status) to already be applied. Safe to run
-- on the live project — no data is changed, only which writes are
-- allowed. Idempotent. Run once in the Supabase SQL Editor.
-- ============================================================


-- ------------------------------------------------------------
-- A. has_module_access(): the one place a role's permissions are
--    decided. Everything below calls this instead of re-deriving
--    role logic per table.
-- ------------------------------------------------------------
create or replace function has_module_access(p_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from businesses
       where id = my_business_id() and owner_id = auth.uid()
    )
    or exists (
      select 1 from business_members m
       where m.business_id = my_business_id()
         and m.user_id = auth.uid()
         and m.is_active
         and (
           m.role = 'admin'
           or (m.role = 'custom' and p_module = any(m.module_keys))
           or (m.role = 'accountant' and p_module = any(array['dashboard', 'transactions', 'expenses', 'reports']))
           or (m.role = 'trader' and p_module = any(array['dashboard', 'sales', 'purchases', 'reports']))
           or (m.role = 'viewer' and p_module = any(array['dashboard', 'reports']))
         )
    );
$$;

grant execute on function has_module_access(text) to authenticated;

-- Staff management specifically: the owner, or an Admin-role login —
-- Settings access alone (e.g. a "custom" role with just Chart of
-- Accounts) is not enough to add or remove other people's access.
create or replace function can_manage_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from businesses where id = my_business_id() and owner_id = auth.uid())
    or exists (
      select 1 from business_members m
       where m.business_id = my_business_id()
         and m.user_id = auth.uid() and m.is_active and m.role = 'admin'
    );
$$;

grant execute on function can_manage_staff() to authenticated;


-- ------------------------------------------------------------
-- B. small helper macro pattern: for every table below, replace its
--    single "Tenant isolation" policy (business-wide read+write) with
--    a SELECT policy (any active member) and a write policy gated by
--    module. Where a table serves either Sales or Purchases
--    depending on a column on the row itself (invoices, weighment
--    slips, contracts), the check reads that column directly.
-- ------------------------------------------------------------

-- Sales-only tables
do $$
declare t text;
begin
  foreach t in array array['quotations']
  loop
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format('drop policy if exists "Read own business" on %I', t);
    execute format('drop policy if exists "Write requires module access" on %I', t);
    execute format(
      'create policy "Read own business" on %I for select to authenticated using (business_id = my_business_id())', t);
    execute format(
      'create policy "Write requires module access" on %I for insert to authenticated
         with check (business_id = my_business_id() and has_module_access(''sales''))', t);
    execute format(
      'create policy "Update requires module access" on %I for update to authenticated
         using (business_id = my_business_id() and has_module_access(''sales''))
         with check (business_id = my_business_id() and has_module_access(''sales''))', t);
    execute format(
      'create policy "Delete requires module access" on %I for delete to authenticated
         using (business_id = my_business_id() and has_module_access(''sales''))', t);
  end loop;
end $$;

-- Purchases-only tables
do $$
declare t text;
begin
  foreach t in array array['purchase_orders']
  loop
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format('drop policy if exists "Read own business" on %I', t);
    execute format('drop policy if exists "Write requires module access" on %I', t);
    execute format(
      'create policy "Read own business" on %I for select to authenticated using (business_id = my_business_id())', t);
    execute format(
      'create policy "Write requires module access" on %I for insert to authenticated
         with check (business_id = my_business_id() and has_module_access(''purchases''))', t);
    execute format(
      'create policy "Update requires module access" on %I for update to authenticated
         using (business_id = my_business_id() and has_module_access(''purchases''))
         with check (business_id = my_business_id() and has_module_access(''purchases''))', t);
    execute format(
      'create policy "Delete requires module access" on %I for delete to authenticated
         using (business_id = my_business_id() and has_module_access(''purchases''))', t);
  end loop;
end $$;

-- Inventory-only tables
do $$
declare t text;
begin
  foreach t in array array['inventory_items', 'warehouses', 'stock_movements']
  loop
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format('drop policy if exists "Read own business" on %I', t);
    execute format('drop policy if exists "Write requires module access" on %I', t);
    execute format(
      'create policy "Read own business" on %I for select to authenticated using (business_id = my_business_id())', t);
    execute format(
      'create policy "Write requires module access" on %I for insert to authenticated
         with check (business_id = my_business_id() and has_module_access(''inventory''))', t);
    execute format(
      'create policy "Update requires module access" on %I for update to authenticated
         using (business_id = my_business_id() and has_module_access(''inventory''))
         with check (business_id = my_business_id() and has_module_access(''inventory''))', t);
    execute format(
      'create policy "Delete requires module access" on %I for delete to authenticated
         using (business_id = my_business_id() and has_module_access(''inventory''))', t);
  end loop;
end $$;

-- Settings-only tables (posting_accounts; chart_of_accounts handled
-- separately below because it also needs the party sub-head write
-- path kept open to Sales/Purchases users who manage parties).
do $$
declare t text;
begin
  foreach t in array array['posting_accounts']
  loop
    execute format('drop policy if exists "Tenant isolation" on %I', t);
    execute format('drop policy if exists "Read own business" on %I', t);
    execute format('drop policy if exists "Write requires module access" on %I', t);
    execute format(
      'create policy "Read own business" on %I for select to authenticated using (business_id = my_business_id())', t);
    execute format(
      'create policy "Write requires module access" on %I for insert to authenticated
         with check (business_id = my_business_id() and has_module_access(''settings''))', t);
    execute format(
      'create policy "Update requires module access" on %I for update to authenticated
         using (business_id = my_business_id() and has_module_access(''settings''))
         with check (business_id = my_business_id() and has_module_access(''settings''))', t);
    execute format(
      'create policy "Delete requires module access" on %I for delete to authenticated
         using (business_id = my_business_id() and has_module_access(''settings''))', t);
  end loop;
end $$;

-- Chart of Accounts: Settings access, OR Sales/Purchases access (a
-- trader adding a new party sub head from the Parties popup still
-- needs to write here).
drop policy if exists "Tenant isolation" on chart_of_accounts;
create policy "Read own business" on chart_of_accounts
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on chart_of_accounts
  for insert to authenticated
  with check (business_id = my_business_id()
    and (has_module_access('settings') or has_module_access('sales') or has_module_access('purchases')));
create policy "Update requires module access" on chart_of_accounts
  for update to authenticated
  using (business_id = my_business_id()
    and (has_module_access('settings') or has_module_access('sales') or has_module_access('purchases')))
  with check (business_id = my_business_id()
    and (has_module_access('settings') or has_module_access('sales') or has_module_access('purchases')));
create policy "Delete requires module access" on chart_of_accounts
  for delete to authenticated
  using (business_id = my_business_id()
    and (has_module_access('settings') or has_module_access('sales') or has_module_access('purchases')));

-- Parties (customers/vendors): needed by both Sales and Purchases,
-- and by Settings (the Parties popup opens from Chart of Accounts too).
drop policy if exists "Tenant isolation" on parties_customers;
create policy "Read own business" on parties_customers
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on parties_customers
  for insert to authenticated
  with check (business_id = my_business_id()
    and (has_module_access('sales') or has_module_access('purchases') or has_module_access('settings')));
create policy "Update requires module access" on parties_customers
  for update to authenticated
  using (business_id = my_business_id()
    and (has_module_access('sales') or has_module_access('purchases') or has_module_access('settings')))
  with check (business_id = my_business_id()
    and (has_module_access('sales') or has_module_access('purchases') or has_module_access('settings')));
create policy "Delete requires module access" on parties_customers
  for delete to authenticated
  using (business_id = my_business_id()
    and (has_module_access('sales') or has_module_access('purchases') or has_module_access('settings')));

-- Expenses (RLS was previously the generic tenant policy from
-- migration_7; migration_20 replaced its lock/audit triggers but not
-- this policy).
drop policy if exists "Tenant isolation" on expenses;
create policy "Read own business" on expenses
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on expenses
  for insert to authenticated
  with check (business_id = my_business_id() and has_module_access('expenses'));
create policy "Update requires module access" on expenses
  for update to authenticated
  using (business_id = my_business_id() and has_module_access('expenses'))
  with check (business_id = my_business_id() and has_module_access('expenses'));
create policy "Delete requires module access" on expenses
  for delete to authenticated
  using (business_id = my_business_id() and has_module_access('expenses'));

-- Vouchers / voucher lines: Transactions module.
drop policy if exists "Tenant isolation" on vouchers;
create policy "Read own business" on vouchers
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on vouchers
  for insert to authenticated
  with check (business_id = my_business_id() and has_module_access('transactions'));
create policy "Update requires module access" on vouchers
  for update to authenticated
  using (business_id = my_business_id() and has_module_access('transactions'))
  with check (business_id = my_business_id() and has_module_access('transactions'));
create policy "Delete requires module access" on vouchers
  for delete to authenticated
  using (business_id = my_business_id() and has_module_access('transactions'));

drop policy if exists "Tenant isolation" on voucher_lines;
create policy "Read own business" on voucher_lines
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on voucher_lines
  for insert to authenticated
  with check (business_id = my_business_id() and has_module_access('transactions'));
create policy "Update requires module access" on voucher_lines
  for update to authenticated
  using (business_id = my_business_id() and has_module_access('transactions'))
  with check (business_id = my_business_id() and has_module_access('transactions'));
create policy "Delete requires module access" on voucher_lines
  for delete to authenticated
  using (business_id = my_business_id() and has_module_access('transactions'));

-- Invoices: Sale -> Sales module, Purchase -> Purchases module (the
-- row's own invoice_type column decides, on both read... no, SELECT
-- stays business-wide; only writes are gated).
drop policy if exists "Tenant isolation" on invoices;
create policy "Read own business" on invoices
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on invoices
  for insert to authenticated
  with check (business_id = my_business_id()
    and has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end));
create policy "Update requires module access" on invoices
  for update to authenticated
  using (business_id = my_business_id()
    and has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end))
  with check (business_id = my_business_id()
    and has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end));
create policy "Delete requires module access" on invoices
  for delete to authenticated
  using (business_id = my_business_id()
    and has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end));

-- Invoice lines: inherit invoice_type from the parent invoice.
drop policy if exists "Tenant isolation" on invoice_lines;
drop policy if exists "Tenant isolation via invoice" on invoice_lines;
create policy "Read via invoice" on invoice_lines
  for select to authenticated
  using (exists (select 1 from invoices i where i.id = invoice_id and i.business_id = my_business_id()));
create policy "Write requires module access" on invoice_lines
  for insert to authenticated
  with check (exists (
    select 1 from invoices i where i.id = invoice_id and i.business_id = my_business_id()
      and has_module_access(case i.invoice_type when 'sale' then 'sales' else 'purchases' end)
  ));
create policy "Update requires module access" on invoice_lines
  for update to authenticated
  using (exists (
    select 1 from invoices i where i.id = invoice_id and i.business_id = my_business_id()
      and has_module_access(case i.invoice_type when 'sale' then 'sales' else 'purchases' end)
  ))
  with check (exists (
    select 1 from invoices i where i.id = invoice_id and i.business_id = my_business_id()
      and has_module_access(case i.invoice_type when 'sale' then 'sales' else 'purchases' end)
  ));
create policy "Delete requires module access" on invoice_lines
  for delete to authenticated
  using (exists (
    select 1 from invoices i where i.id = invoice_id and i.business_id = my_business_id()
      and has_module_access(case i.invoice_type when 'sale' then 'sales' else 'purchases' end)
  ));

-- Invoice batches: either Sales or Purchases access opens the Multi
-- Invoice screen; each line's own invoice_type decides that line.
drop policy if exists "Tenant isolation" on invoice_batches;
create policy "Read own business" on invoice_batches
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on invoice_batches
  for insert to authenticated
  with check (business_id = my_business_id() and (has_module_access('sales') or has_module_access('purchases')));
create policy "Update requires module access" on invoice_batches
  for update to authenticated
  using (business_id = my_business_id() and (has_module_access('sales') or has_module_access('purchases')))
  with check (business_id = my_business_id() and (has_module_access('sales') or has_module_access('purchases')));
create policy "Delete requires module access" on invoice_batches
  for delete to authenticated
  using (business_id = my_business_id() and (has_module_access('sales') or has_module_access('purchases')));

do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'invoice_batch_lines') then
    execute 'drop policy if exists "Tenant isolation" on invoice_batch_lines';
    execute 'drop policy if exists "Read own business" on invoice_batch_lines';
    execute $p$create policy "Read own business" on invoice_batch_lines
      for select to authenticated
      using (exists (select 1 from invoice_batches b where b.id = batch_id and b.business_id = my_business_id()))$p$;
    execute $p$create policy "Write requires module access" on invoice_batch_lines
      for insert to authenticated
      with check (
        has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end)
        and exists (select 1 from invoice_batches b where b.id = batch_id and b.business_id = my_business_id())
      )$p$;
    execute $p$create policy "Update requires module access" on invoice_batch_lines
      for update to authenticated
      using (
        has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end)
        and exists (select 1 from invoice_batches b where b.id = batch_id and b.business_id = my_business_id())
      )
      with check (
        has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end)
        and exists (select 1 from invoice_batches b where b.id = batch_id and b.business_id = my_business_id())
      )$p$;
    execute $p$create policy "Delete requires module access" on invoice_batch_lines
      for delete to authenticated
      using (
        has_module_access(case invoice_type when 'sale' then 'sales' else 'purchases' end)
        and exists (select 1 from invoice_batches b where b.id = batch_id and b.business_id = my_business_id())
      )$p$;
  end if;
end $$;

-- Weighment slips: same Sale/Purchase split, on slip_type.
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'weighment_slips') then
    execute 'drop policy if exists "Tenant isolation" on weighment_slips';
    execute 'drop policy if exists "Read own business" on weighment_slips';
    execute 'create policy "Read own business" on weighment_slips for select to authenticated using (business_id = my_business_id())';
    execute $p$create policy "Write requires module access" on weighment_slips
      for insert to authenticated
      with check (business_id = my_business_id()
        and has_module_access(case slip_type when 'sale' then 'sales' else 'purchases' end))$p$;
    execute $p$create policy "Update requires module access" on weighment_slips
      for update to authenticated
      using (business_id = my_business_id()
        and has_module_access(case slip_type when 'sale' then 'sales' else 'purchases' end))
      with check (business_id = my_business_id()
        and has_module_access(case slip_type when 'sale' then 'sales' else 'purchases' end))$p$;
    execute $p$create policy "Delete requires module access" on weighment_slips
      for delete to authenticated
      using (business_id = my_business_id()
        and has_module_access(case slip_type when 'sale' then 'sales' else 'purchases' end))$p$;
  end if;
end $$;

-- Contracts: same Sale/Purchase split, on contract_type.
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'contracts') then
    execute 'drop policy if exists "Tenant isolation" on contracts';
    execute 'drop policy if exists "Read own business" on contracts';
    execute 'create policy "Read own business" on contracts for select to authenticated using (business_id = my_business_id())';
    execute $p$create policy "Write requires module access" on contracts
      for insert to authenticated
      with check (business_id = my_business_id()
        and has_module_access(case contract_type when 'sale' then 'sales' else 'purchases' end))$p$;
    execute $p$create policy "Update requires module access" on contracts
      for update to authenticated
      using (business_id = my_business_id()
        and has_module_access(case contract_type when 'sale' then 'sales' else 'purchases' end))
      with check (business_id = my_business_id()
        and has_module_access(case contract_type when 'sale' then 'sales' else 'purchases' end))$p$;
    execute $p$create policy "Delete requires module access" on contracts
      for delete to authenticated
      using (business_id = my_business_id()
        and has_module_access(case contract_type when 'sale' then 'sales' else 'purchases' end))$p$;
  end if;
end $$;


-- ------------------------------------------------------------
-- C. Staff management: owner or Admin-role login only.
-- ------------------------------------------------------------
drop policy if exists "Owner manages members" on business_members;
create policy "Owner or Admin manages members" on business_members
  for all to authenticated
  using (can_manage_staff())
  with check (can_manage_staff());
-- "Member can view own membership" (from migration_16) is unaffected.


-- ------------------------------------------------------------
-- D. Quotation lines / purchase order lines — migration_16 gave
--    these their own business_id and a generic tenant-isolation
--    policy; replace it so they follow their parent's module gate
--    too (otherwise a Viewer/Accountant could write lines directly
--    even though they can't touch the quotation/PO header).
-- ------------------------------------------------------------
drop policy if exists "Tenant isolation" on quotation_lines;
create policy "Read own business" on quotation_lines
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on quotation_lines
  for insert to authenticated
  with check (business_id = my_business_id() and has_module_access('sales'));
create policy "Update requires module access" on quotation_lines
  for update to authenticated
  using (business_id = my_business_id() and has_module_access('sales'))
  with check (business_id = my_business_id() and has_module_access('sales'));
create policy "Delete requires module access" on quotation_lines
  for delete to authenticated
  using (business_id = my_business_id() and has_module_access('sales'));

drop policy if exists "Tenant isolation" on purchase_order_lines;
create policy "Read own business" on purchase_order_lines
  for select to authenticated using (business_id = my_business_id());
create policy "Write requires module access" on purchase_order_lines
  for insert to authenticated
  with check (business_id = my_business_id() and has_module_access('purchases'));
create policy "Update requires module access" on purchase_order_lines
  for update to authenticated
  using (business_id = my_business_id() and has_module_access('purchases'))
  with check (business_id = my_business_id() and has_module_access('purchases'));
create policy "Delete requires module access" on purchase_order_lines
  for delete to authenticated
  using (business_id = my_business_id() and has_module_access('purchases'));
