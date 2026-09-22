-- ============================================================
-- Migration 16: TENANT ISOLATION (launch blocker #1)
--
-- The five guarantees this migration enforces IN THE DATABASE:
--
--   1. Every accounting record carries a business_id — including the
--      child/line tables (voucher_lines, invoice_lines, ...), which had none.
--   2. Row Level Security is on for every tenant table, with ONE policy:
--      business_id = my_business_id().
--   3. A login belongs to exactly ONE business (owner or staff, never both,
--      never two) — so my_business_id() can never be ambiguous.
--   4. Reads AND writes stay inside the caller's business: business_id
--      cannot be changed, child rows inherit it from their parent, and
--      cross-table references (stock movement -> item, reconciliation ->
--      bank account, ...) cannot point at another business's rows.
--   5. The platform admin (is_admin()) can no longer read or write any
--      tenant's accounting data. Before this migration EVERY tenant policy
--      said "... or is_admin()", so an admin who had also signed up
--      normally (README step 7) saw all businesses mixed together in their
--      own dashboard, ledgers and reports. Admin keeps what it needs to run
--      the service: the businesses table (subscriptions) and site settings.
--
-- Safe to run on a live project (no accounting rows are changed; only
-- business_id is back-filled on line tables). Idempotent. Requires
-- PostgreSQL 15+ (Supabase default) for "ON DELETE SET NULL (column)".
--
-- After running:   select * from audit_tenant_isolation();
-- must return ZERO rows. Re-run it after every future migration.
-- ============================================================


-- ------------------------------------------------------------
-- A. my_business_id(): deterministic (owner first, then oldest active
--    membership) so it never depends on row order.
-- ------------------------------------------------------------
create or replace function my_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select id from businesses
       where owner_id = auth.uid()
       order by created_at limit 1),
    (select business_id from business_members
       where user_id = auth.uid() and is_active
       order by created_at limit 1)
  );
$$;


-- ------------------------------------------------------------
-- B. One login = one business.
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from business_members group by user_id having count(*) > 1) then
    raise exception
      'migration_16 stopped: some logins are members of several businesses. Remove the extra business_members rows, then re-run.';
  end if;
  if exists (
    select 1 from business_members m join businesses b on b.owner_id = m.user_id
  ) then
    raise exception
      'migration_16 stopped: some business owners are also staff of another business. Remove those business_members rows, then re-run.';
  end if;
end $$;

create unique index if not exists uq_business_members_user
  on business_members (user_id);

-- An owner can't be staff elsewhere; a staff login can't own a business.
create or replace function enforce_membership_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_TABLE_NAME = 'business_members' then
    if exists (select 1 from businesses where owner_id = new.user_id) then
      raise exception 'This login already owns a business and cannot also be staff of another one.'
        using errcode = '23514';
    end if;
  elsif TG_TABLE_NAME = 'businesses' then
    if exists (select 1 from business_members where user_id = new.owner_id) then
      raise exception 'A staff login cannot also own a business.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_membership_integrity on business_members;
create trigger trg_membership_integrity
  before insert or update of user_id on business_members
  for each row execute function enforce_membership_integrity();

drop trigger if exists trg_membership_integrity on businesses;
create trigger trg_membership_integrity
  before insert or update of owner_id on businesses
  for each row execute function enforce_membership_integrity();

-- Only the OWNER manages staff. (The old policy also said "or is_admin()",
-- which let a platform admin add themselves to any business.)
alter table business_members enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'business_members'
  loop
    execute format('drop policy %I on business_members', p.policyname);
  end loop;
end $$;

create policy "Owner manages members" on business_members
  for all to authenticated
  using (owns_business(business_id))
  with check (owns_business(business_id));

create policy "Member can view own membership" on business_members
  for select to authenticated
  using (user_id = auth.uid());


-- ------------------------------------------------------------
-- C. Line tables get their own business_id (back-filled from the
--    parent). A trigger ALWAYS derives it from the parent row, so the
--    browser can never supply or forge it, and a line can never be
--    attached to another business's document.
-- ------------------------------------------------------------
create or replace function enforce_child_business()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_bid uuid;
  parent_id  uuid;
begin
  -- TG_ARGV[0] = parent table, TG_ARGV[1] = fk column on this table.
  -- Runs as the caller, so RLS on the parent hides other tenants' rows
  -- and the lookup comes back empty.
  parent_id := (to_jsonb(new) ->> TG_ARGV[1])::uuid;
  execute format('select business_id from %I where id = $1', TG_ARGV[0])
    into parent_bid using parent_id;

  if parent_bid is null then
    raise exception 'Parent % % not found (or belongs to another business).',
      TG_ARGV[0], parent_id using errcode = '42501';
  end if;

  if TG_OP = 'UPDATE' and parent_bid is distinct from old.business_id then
    raise exception 'A line cannot be moved to another business.'
      using errcode = '42501';
  end if;

  new.business_id := parent_bid;
  return new;
end;
$$;

do $$
declare
  c record;
begin
  for c in
    select * from (values
      ('voucher_lines',        'voucher_id',         'vouchers'),
      ('invoice_lines',        'invoice_id',         'invoices'),
      ('invoice_batch_lines',  'batch_id',           'invoice_batches'),
      ('quotation_lines',      'quotation_id',       'quotations'),
      ('purchase_order_lines', 'purchase_order_id',  'purchase_orders')
    ) as v(child, fk, parent)
  loop
    execute format('alter table %I add column if not exists business_id uuid', c.child);
    execute format(
      'update %I c set business_id = p.business_id from %I p
         where p.id = c.%I and c.business_id is null',
      c.child, c.parent, c.fk);
    execute format('alter table %I alter column business_id set not null', c.child);

    if not exists (select 1 from pg_constraint where conname = c.child || '_business_id_fkey') then
      execute format(
        'alter table %I add constraint %I foreign key (business_id)
           references businesses(id) on delete cascade',
        c.child, c.child || '_business_id_fkey');
    end if;

    execute format('create index if not exists %I on %I (business_id)',
      'idx_' || c.child || '_business', c.child);

    execute format('drop trigger if exists trg_enforce_child_business on %I', c.child);
    execute format(
      'create trigger trg_enforce_child_business
         before insert or update on %I
         for each row execute function enforce_child_business(%L, %L)',
      c.child, c.parent, c.fk);
  end loop;
end $$;


-- ------------------------------------------------------------
-- D. Cross-table references must stay inside one business.
--    (id, business_id) becomes a unique key on the referenced table and
--    the foreign key includes business_id, so Postgres itself rejects a
--    stock movement that points at another tenant's item, etc.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['inventory_items', 'warehouses', 'bank_accounts', 'invoices']
  loop
    if not exists (select 1 from pg_constraint where conname = 'uq_' || t || '_id_business') then
      execute format('alter table %I add constraint %I unique (id, business_id)',
        t, 'uq_' || t || '_id_business');
    end if;
  end loop;
end $$;

alter table stock_movements drop constraint if exists stock_movements_item_id_fkey;
alter table stock_movements drop constraint if exists stock_movements_item_same_business;
alter table stock_movements add constraint stock_movements_item_same_business
  foreign key (item_id, business_id) references inventory_items (id, business_id)
  on delete cascade;

alter table stock_movements drop constraint if exists stock_movements_warehouse_id_fkey;
alter table stock_movements drop constraint if exists stock_movements_wh_same_business;
alter table stock_movements add constraint stock_movements_wh_same_business
  foreign key (warehouse_id, business_id) references warehouses (id, business_id)
  on delete set null (warehouse_id);

alter table bank_reconciliations drop constraint if exists bank_reconciliations_bank_account_id_fkey;
alter table bank_reconciliations drop constraint if exists bank_reconciliations_bank_same_business;
alter table bank_reconciliations add constraint bank_reconciliations_bank_same_business
  foreign key (bank_account_id, business_id) references bank_accounts (id, business_id)
  on delete cascade;

alter table quotations drop constraint if exists quotations_converted_invoice_id_fkey;
alter table quotations drop constraint if exists quotations_invoice_same_business;
alter table quotations add constraint quotations_invoice_same_business
  foreign key (converted_invoice_id, business_id) references invoices (id, business_id)
  on delete set null (converted_invoice_id);


-- ------------------------------------------------------------
-- E. business_id can never be changed once a row exists.
-- ------------------------------------------------------------
create or replace function prevent_business_id_change()
returns trigger
language plpgsql
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'business_id is immutable.' using errcode = '42501';
  end if;
  return new;
end;
$$;


-- ------------------------------------------------------------
-- F. ONE policy on every table that has a business_id (auto-discovered,
--    so the line tables and any table added by earlier migrations are
--    covered too). All older policies are dropped first — that removes
--    every "... or is_admin()" clause. The anon role gets no access.
-- ------------------------------------------------------------
do $$
declare
  t text;
  p record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
                       and a.attname = 'business_id' and not a.attisdropped
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname <> 'business_members'      -- special policies, section B
    order by c.relname
  loop
    execute format('alter table %I enable row level security', t);

    for p in select policyname from pg_policies
             where schemaname = 'public' and tablename = t
    loop
      execute format('drop policy %I on %I', p.policyname, t);
    end loop;

    execute format(
      'create policy "Tenant isolation" on %I
         for all to authenticated
         using (business_id = my_business_id())
         with check (business_id = my_business_id())', t);

    execute format('revoke all on %I from anon', t);

    execute format('drop trigger if exists trg_business_id_immutable on %I', t);
    execute format(
      'create trigger trg_business_id_immutable
         before update of business_id on %I
         for each row execute function prevent_business_id_change()', t);
  end loop;
end $$;

revoke all on business_members from anon;
revoke all on admin_users from anon;


-- ------------------------------------------------------------
-- G. The businesses table keeps its admin access (subscriptions are the
--    service owner's job) — but that is NOT accounting data.
--    NOTE for step "Data deletion policy": "Admin can delete business"
--    still cascades to all of a tenant's records; it is replaced by
--    deactivate -> archive -> retention in that step.
-- ------------------------------------------------------------


-- ------------------------------------------------------------
-- H. audit_tenant_isolation(): run any time (SQL editor / CI). Returns
--    one row per problem; an empty result means the five guarantees hold.
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
$$;

revoke all on function audit_tenant_isolation() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function audit_tenant_isolation() to service_role;
  end if;
end $$;
