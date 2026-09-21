-- ============================================================
-- Bahar-e-Madina Commission Agent — Supabase schema
-- Multi-tenant SaaS: every registered business gets its own
-- isolated set of accounts, parties, vouchers, contracts, etc.
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TENANCY: businesses + admin_users
-- ============================================================

-- One row per customer that signs up for the service.
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact_email text,
  contact_phone text,
  business_category text check (
    business_category in (
      'shopkeeper', 'wholesaler', 'distributor', 'trader', 'manufacturer'
    )
  ),
  plan text not null default 'standard',
  subscription_status text not null default 'trial' check (
    subscription_status in ('trial', 'active', 'expired', 'suspended')
  ),
  subscription_expires_at date,
  billing_status text not null default 'unbilled' check (
    billing_status in ('billed', 'unbilled')
  ),
  last_billed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_businesses_owner on businesses(owner_id);

-- Service-owner / support staff. Rows here are added manually by you
-- from the SQL editor after the person has signed up normally — see
-- README "Becoming an admin".
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Helper functions used throughout RLS policies below
-- ------------------------------------------------------------
-- Resolves to the caller's business whether they're the owner, or a
-- staff login added from the User Access screen (business_members,
-- defined further down). Every tenant table filters on
-- business_id = my_business_id(), so this one function is the only
-- place that needs to know about both kinds of access.
create or replace function my_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select id from businesses where owner_id = auth.uid() limit 1),
    (select business_id from business_members
       where user_id = auth.uid() and is_active limit 1)
  );
$$;

create or replace function is_business_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from businesses where owner_id = auth.uid());
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

-- Customers can update their business's display info, but never grant
-- themselves an active subscription — only an admin update can change
-- these three columns.
create or replace function protect_subscription_fields()
returns trigger
language plpgsql
security definer
as $$
begin
  if not is_admin() then
    new.subscription_status := old.subscription_status;
    new.subscription_expires_at := old.subscription_expires_at;
    new.plan := old.plan;
    new.billing_status := old.billing_status;
    new.last_billed_at := old.last_billed_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_subscription on businesses;
create trigger trg_protect_subscription
  before update on businesses
  for each row execute function protect_subscription_fields();

-- Every new business starts with its own default chart of accounts
-- and standard crop units, seeded automatically on signup.
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

drop trigger if exists trg_seed_new_business on businesses;
create trigger trg_seed_new_business
  after insert on businesses
  for each row execute function seed_new_business();

-- Automatically create a business (tenant) the moment someone signs up.
-- The business name comes from the "business_name" field the sign-up
-- form passes into auth.signUp's options.data; falls back to the part
-- of their email before the @ if that's somehow missing.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Staff logins created from the User Access screen carry this flag
  -- in their metadata so they get a business_members row instead of
  -- a brand-new business of their own.
  if coalesce((new.raw_user_meta_data->>'skip_business_creation')::boolean, false) then
    return new;
  end if;

  insert into businesses (owner_id, name, contact_email, business_category)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'business_name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    nullif(new.raw_user_meta_data->>'business_category', '')
  )
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================
-- APPLICATION TABLES — each tenant table carries a business_id
-- that defaults to the caller's own business, so the app's existing
-- insert code doesn't need to pass it explicitly.
-- ============================================================

-- ------------------------------------------------------------
-- Chart of Accounts (per business)
-- ------------------------------------------------------------
create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null check (
    account_type in ('party', 'asset', 'liability', 'equity', 'income', 'expense')
  ),
  parent_code text,
  is_group boolean not null default false, -- true = a sub head (groups other accounts)
  created_at timestamptz not null default now(),
  unique (business_id, code)
);

-- ------------------------------------------------------------
-- Customers / Vendors (Party Master) — per business
-- ------------------------------------------------------------
create table if not exists parties_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  party_id text not null, -- e.g. 6210001, unique within the business
  name text not null,
  name_urdu text,
  english_business_name text,
  party_group text,
  town text,
  sector text,
  address text,
  city text,
  mobile text,
  phone text,
  email text,
  fax text,
  stn text,
  ntn_cnic text,
  bank_account text,
  contact_person text,
  can_also_be_vendor boolean not null default false,
  sub_head_code text, -- Party sub head override; empty = follows the ID block (62… Buyer, 63… Seller, 64… Misc)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, party_id)
);

-- ------------------------------------------------------------
-- Staff logins (User Access & Security) — one row per person the
-- business owner has invited, besides themselves.
-- ------------------------------------------------------------
create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null check (
    role in ('admin', 'accountant', 'trader', 'viewer', 'custom')
  ),
  -- Only used when role = 'custom'; built-in roles get their modules
  -- from a fixed map in the app (lib/team-data.ts).
  module_keys text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists idx_business_members_business on business_members(business_id);
create index if not exists idx_business_members_user on business_members(user_id);

-- Cross-table look-ups used by the businesses / business_members policies.
-- They are SECURITY DEFINER so the look-up doesn't re-run row-level security
-- (two policies that query each other's table recurse forever otherwise).
create or replace function is_member_of(b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from business_members m
    where m.business_id = b and m.user_id = auth.uid() and m.is_active
  );
$$;

create or replace function owns_business(b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from businesses where id = b and owner_id = auth.uid());
$$;

-- ------------------------------------------------------------
-- Standard Crop Units (e.g. Cotton @ 40 KGS / Maund) — per business
-- ------------------------------------------------------------
create table if not exists crop_units (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  crop text not null,
  unit_name text not null,
  kgs_per_unit numeric(10, 3) not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Vouchers (Cash Receiving/Payment, Bank Cheque Deposit/Issue, WHT)
-- ------------------------------------------------------------
create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  voucher_no text not null,
  voucher_type text not null check (
    voucher_type in (
      'cash_receiving', 'cash_payment', 'journal',
      'bank_cheque_deposit', 'bank_cheque_issue', 'cash_payment_wht',
      'bank_receipt', 'bank_payment',
      'contra_cash_to_bank', 'contra_bank_to_cash',
      'ibft'
    )
  ),
  voucher_date date not null,
  party_id text,
  bank_account text,
  cheque_no text,
  cheque_date date,
  gross_amount numeric(14, 2) not null default 0,
  wht_percent numeric(5, 2) not null default 0,
  wht_amount numeric(14, 2) not null default 0,
  net_amount numeric(14, 2) not null default 0,
  narration text,
  created_at timestamptz not null default now(),
  unique (business_id, voucher_no)
);

-- Multi-line debit/credit entries, used by Journal Vouchers
create table if not exists voucher_lines (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers(id) on delete cascade,
  account_code text,
  debit numeric(14, 2) not null default 0,
  credit numeric(14, 2) not null default 0
);

-- ------------------------------------------------------------
-- General ledger postings (generated from vouchers / invoices)
-- ------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  transaction_date date not null,
  account_code text,
  debit numeric(14, 2) not null default 0,
  credit numeric(14, 2) not null default 0,
  reference_type text, -- 'voucher' | 'invoice' | 'weighment' | 'contract'
  reference_id uuid,
  narration text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Purchase / Sale Contracts
-- ------------------------------------------------------------
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  contract_no text not null,
  contract_type text not null check (contract_type in ('purchase', 'sale')),
  contract_date date not null,
  delivery_date date,
  party_id text,
  crop text,
  unit text,
  quantity numeric(12, 2) not null default 0,
  rate numeric(12, 2) not null default 0,
  advance numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (business_id, contract_no)
);

-- ------------------------------------------------------------
-- Weighbridge Weighment Slips
-- ------------------------------------------------------------
create table if not exists weighment_slips (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  slip_no text not null,
  slip_type text not null check (slip_type in ('purchase', 'sale')),
  slip_date date not null,
  vehicle_no text,
  party_id text,
  crop text,
  bags integer not null default 0,
  gross_weight numeric(10, 2) not null default 0,
  tare_weight numeric(10, 2) not null default 0,
  net_weight numeric(10, 2) generated always as (gross_weight - tare_weight) stored,
  created_at timestamptz not null default now(),
  unique (business_id, slip_no)
);

-- ------------------------------------------------------------
-- Invoices (Brokerage / General / Crop — Purchase & Sale)
-- ------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  invoice_no text not null,
  invoice_category text not null check (
    invoice_category in ('brokerage', 'general', 'crop')
  ),
  invoice_type text not null check (invoice_type in ('purchase', 'sale')),
  invoice_date date not null,
  party_id text,
  subtotal numeric(14, 2) not null default 0,
  brokerage_percent numeric(5, 2) not null default 0,
  brokerage_amount numeric(14, 2) not null default 0,
  net_total numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (business_id, invoice_no)
);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text,
  unit text,
  qty numeric(12, 2) not null default 0,
  rate numeric(12, 2) not null default 0,
  amount numeric(14, 2) generated always as (qty * rate) stored
);

-- ------------------------------------------------------------
-- Batch header for Multi Invoice screens
-- ------------------------------------------------------------
create table if not exists invoice_batches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default my_business_id() references businesses(id) on delete cascade,
  batch_label text not null,
  batch_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists invoice_batch_lines (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references invoice_batches(id) on delete cascade,
  party_id text,
  invoice_type text not null check (invoice_type in ('purchase', 'sale')),
  amount numeric(14, 2) not null default 0
);

-- ------------------------------------------------------------
-- Helpful indexes
-- ------------------------------------------------------------
create index if not exists idx_vouchers_business_date on vouchers(business_id, voucher_date);
create index if not exists idx_transactions_business_account on transactions(business_id, account_code);
create index if not exists idx_transactions_business_date on transactions(business_id, transaction_date);
create index if not exists idx_invoices_business_party on invoices(business_id, party_id);
create index if not exists idx_contracts_business_party on contracts(business_id, party_id);
create index if not exists idx_weighment_business_party on weighment_slips(business_id, party_id);
create index if not exists idx_parties_business on parties_customers(business_id);

-- ============================================================
-- Row Level Security — every tenant only ever sees its own data;
-- admins (rows in admin_users) can see everything for support.
-- ============================================================

-- ---- businesses: special-cased (owner sees only their own row) ----
alter table businesses enable row level security;

drop policy if exists "Owner or admin can view business" on businesses;
drop policy if exists "Owner, member or admin can view business" on businesses;
create policy "Owner, member or admin can view business" on businesses
  for select using (
    owner_id = auth.uid()
    or is_admin()
    or is_member_of(id)
  );

drop policy if exists "Owner can create own business" on businesses;
create policy "Owner can create own business" on businesses
  for insert with check (owner_id = auth.uid());

drop policy if exists "Owner or admin can update business" on businesses;
create policy "Owner or admin can update business" on businesses
  for update using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());

drop policy if exists "Admin can delete business" on businesses;
create policy "Admin can delete business" on businesses
  for delete using (is_admin());

-- ---- admin_users: only admins can read; managed via SQL editor ----
alter table admin_users enable row level security;

drop policy if exists "Admins can view admin list" on admin_users;
create policy "Admins can view admin list" on admin_users
  for select using (is_admin());

-- ---- tenant-scoped tables: standard "own business, or admin" policy ----
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'chart_of_accounts', 'parties_customers', 'crop_units',
      'vouchers', 'transactions', 'contracts',
      'weighment_slips', 'invoices', 'invoice_batches'
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

-- ---- business_members: NOT part of the generic loop above — only the
-- owner (or a support admin) may manage the member list, and a staff
-- login may only ever read their own row (never each other's). ----
alter table business_members enable row level security;

drop policy if exists "Owner manages members" on business_members;
create policy "Owner manages members" on business_members
  for all using (
    owns_business(business_id) or is_admin()
  )
  with check (
    owns_business(business_id) or is_admin()
  );

drop policy if exists "Member can view own membership" on business_members;
create policy "Member can view own membership" on business_members
  for select using (user_id = auth.uid());

-- ---- child tables: isolated via their parent''s business_id ----
alter table voucher_lines enable row level security;
drop policy if exists "Tenant isolation via voucher" on voucher_lines;
create policy "Tenant isolation via voucher" on voucher_lines
  for all using (
    voucher_id in (
      select id from vouchers where business_id = my_business_id() or is_admin()
    )
  )
  with check (
    voucher_id in (
      select id from vouchers where business_id = my_business_id() or is_admin()
    )
  );

alter table invoice_lines enable row level security;
drop policy if exists "Tenant isolation via invoice" on invoice_lines;
create policy "Tenant isolation via invoice" on invoice_lines
  for all using (
    invoice_id in (
      select id from invoices where business_id = my_business_id() or is_admin()
    )
  )
  with check (
    invoice_id in (
      select id from invoices where business_id = my_business_id() or is_admin()
    )
  );

alter table invoice_batch_lines enable row level security;
drop policy if exists "Tenant isolation via batch" on invoice_batch_lines;
create policy "Tenant isolation via batch" on invoice_batch_lines
  for all using (
    batch_id in (
      select id from invoice_batches where business_id = my_business_id() or is_admin()
    )
  )
  with check (
    batch_id in (
      select id from invoice_batches where business_id = my_business_id() or is_admin()
    )
  );

-- ============================================================
-- Becoming an admin (service owner)
-- ============================================================
-- The /admin panel is separate from customer accounts. To use it:
--   1. Sign up for a normal account once, at /signup, with your own
--      email (this also creates a "business" row for you, which you
--      can ignore).
--   2. In the Supabase SQL editor, find your user id:
--        select id, email from auth.users where email = 'you@example.com';
--   3. Grant yourself admin access:
--        insert into admin_users (id, email)
--        values ('<the uuid from step 2>', 'you@example.com');
--   4. Log in at /admin/login with that same email & password.

