-- ============================================================
-- Migration: Generic accounting modules — Banking, Quotations,
-- Purchase Orders, Inventory, Expenses, and Company Profile
-- fields (currency, tax info, address).
-- Safe to run on the already-deployed project (only ADDS things).
-- Requires migration_5 (business_members / my_business_id()) to
-- already be applied.
-- ============================================================

-- ------------------------------------------------------------
-- Company profile: currency, tax registration, address, website.
-- Logo/name/contact already exist on `businesses` from schema.sql.
-- ------------------------------------------------------------
alter table businesses
  add column if not exists currency text not null default 'PKR',
  add column if not exists tax_number text,
  add column if not exists address text,
  add column if not exists website text;

-- ------------------------------------------------------------
-- Banking: bank accounts + credit cards
-- ------------------------------------------------------------
create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  account_name text not null,
  bank_name text not null,
  account_number text,
  branch text,
  opening_balance numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bank_reconciliations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  bank_account_id uuid not null references bank_accounts(id) on delete cascade,
  statement_date date not null,
  statement_balance numeric(14, 2) not null default 0,
  book_balance numeric(14, 2) not null default 0,
  difference numeric(14, 2) generated always as (statement_balance - book_balance) stored,
  status text not null default 'open' check (status in ('open', 'reconciled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists credit_cards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  card_name text not null,
  bank_name text not null,
  last_four text,
  credit_limit numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  statement_day integer check (statement_day between 1 and 31),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Quotations / Estimates (Sales & Receivables)
-- ------------------------------------------------------------
create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  quote_no text not null,
  quote_date date not null default current_date,
  party_id text,
  subtotal numeric(14, 2) not null default 0,
  net_total numeric(14, 2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'converted')),
  valid_until date,
  notes text,
  converted_invoice_id uuid references invoices(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (business_id, quote_no)
);

create table if not exists quotation_lines (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references quotations(id) on delete cascade,
  description text,
  unit text,
  qty numeric(12, 2) not null default 0,
  rate numeric(12, 2) not null default 0,
  amount numeric(14, 2) generated always as (qty * rate) stored
);

-- ------------------------------------------------------------
-- Purchase Orders (Purchases & Payables)
-- ------------------------------------------------------------
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  po_no text not null,
  po_date date not null default current_date,
  party_id text,
  subtotal numeric(14, 2) not null default 0,
  net_total numeric(14, 2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'received', 'cancelled')),
  expected_date date,
  notes text,
  created_at timestamptz not null default now(),
  unique (business_id, po_no)
);

create table if not exists purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  description text,
  unit text,
  qty numeric(12, 2) not null default 0,
  rate numeric(12, 2) not null default 0,
  amount numeric(14, 2) generated always as (qty * rate) stored
);

-- ------------------------------------------------------------
-- Inventory: warehouses, items, stock movements
-- ------------------------------------------------------------
create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  name text not null,
  location text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  sku text not null,
  name text not null,
  unit text not null default 'Pcs',
  reorder_level numeric(12, 2) not null default 0,
  unit_cost numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  item_id uuid not null references inventory_items(id) on delete cascade,
  warehouse_id uuid references warehouses(id) on delete set null,
  movement_type text not null check (movement_type in ('in', 'out')),
  qty numeric(12, 2) not null default 0,
  reference text,
  notes text,
  movement_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Expenses (Expense Management)
-- ------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  expense_date date not null default current_date,
  category text not null,
  amount numeric(14, 2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bank', 'credit_card')),
  notes text,
  receipt_note text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Row Level Security — every new tenant table joins the same
-- business_id = my_business_id() isolation used everywhere else.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'bank_accounts', 'bank_reconciliations', 'credit_cards',
      'quotations', 'purchase_orders', 'warehouses',
      'inventory_items', 'stock_movements', 'expenses'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "Tenant isolation" on %I;', t);
    execute format(
      'create policy "Tenant isolation" on %I
         for all using (business_id = my_business_id() or is_admin())
         with check (business_id = my_business_id() or is_admin());',
      t
    );
  end loop;
end $$;

-- Child tables: isolated via their parent's business_id.
alter table quotation_lines enable row level security;
drop policy if exists "Tenant isolation via quotation" on quotation_lines;
create policy "Tenant isolation via quotation" on quotation_lines
  for all using (
    quotation_id in (select id from quotations where business_id = my_business_id() or is_admin())
  )
  with check (
    quotation_id in (select id from quotations where business_id = my_business_id() or is_admin())
  );

alter table purchase_order_lines enable row level security;
drop policy if exists "Tenant isolation via PO" on purchase_order_lines;
create policy "Tenant isolation via PO" on purchase_order_lines
  for all using (
    purchase_order_id in (select id from purchase_orders where business_id = my_business_id() or is_admin())
  )
  with check (
    purchase_order_id in (select id from purchase_orders where business_id = my_business_id() or is_admin())
  );

create index if not exists idx_bank_accounts_business on bank_accounts(business_id);
create index if not exists idx_credit_cards_business on credit_cards(business_id);
create index if not exists idx_quotations_business_date on quotations(business_id, quote_date);
create index if not exists idx_po_business_date on purchase_orders(business_id, po_date);
create index if not exists idx_inventory_items_business on inventory_items(business_id);
create index if not exists idx_stock_movements_business_item on stock_movements(business_id, item_id);
create index if not exists idx_expenses_business_date on expenses(business_id, expense_date);

-- ------------------------------------------------------------
-- business_members role check: widen to add "sales" / "purchases"
-- (the generic accounting equivalents of the old "trader" role).
-- The "trader" value itself is kept in the constraint so existing
-- rows keep working — the app now just labels it "Sales & Purchases".
-- ------------------------------------------------------------
alter table business_members drop constraint if exists business_members_role_check;
alter table business_members add constraint business_members_role_check check (
  role in ('admin', 'accountant', 'trader', 'sales', 'purchases', 'viewer', 'custom')
);
