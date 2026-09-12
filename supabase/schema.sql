-- ============================================================
-- Bahar-e-Madina Commission Agent — Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Chart of Accounts
-- ------------------------------------------------------------
create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  account_type text not null check (
    account_type in ('asset', 'liability', 'equity', 'income', 'expense')
  ),
  parent_code text references chart_of_accounts(code),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Customers / Vendors (Party Master)
-- Maps to Chart of Accounts under Accounts Receivable (prefix 62)
-- ------------------------------------------------------------
create table if not exists parties_customers (
  id uuid primary key default gen_random_uuid(),
  party_id text unique not null, -- e.g. 6210001
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Standard Crop Units (e.g. Cotton @ 40 KGS / Maund)
-- ------------------------------------------------------------
create table if not exists crop_units (
  id uuid primary key default gen_random_uuid(),
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
  voucher_no text unique not null,
  voucher_type text not null check (
    voucher_type in (
      'cash_receiving', 'cash_payment', 'journal',
      'bank_cheque_deposit', 'bank_cheque_issue', 'cash_payment_wht'
    )
  ),
  voucher_date date not null,
  party_id text references parties_customers(party_id),
  bank_account text,
  cheque_no text,
  cheque_date date,
  gross_amount numeric(14, 2) not null default 0,
  wht_percent numeric(5, 2) not null default 0,
  wht_amount numeric(14, 2) not null default 0,
  net_amount numeric(14, 2) not null default 0,
  narration text,
  created_at timestamptz not null default now()
);

-- Multi-line debit/credit entries, used by Journal Vouchers
create table if not exists voucher_lines (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers(id) on delete cascade,
  account_code text references chart_of_accounts(code),
  debit numeric(14, 2) not null default 0,
  credit numeric(14, 2) not null default 0
);

-- ------------------------------------------------------------
-- General ledger postings (generated from vouchers / invoices)
-- ------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  account_code text references chart_of_accounts(code),
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
  contract_no text unique not null,
  contract_type text not null check (contract_type in ('purchase', 'sale')),
  contract_date date not null,
  delivery_date date,
  party_id text references parties_customers(party_id),
  crop text,
  unit text,
  quantity numeric(12, 2) not null default 0,
  rate numeric(12, 2) not null default 0,
  advance numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Weighbridge Weighment Slips
-- ------------------------------------------------------------
create table if not exists weighment_slips (
  id uuid primary key default gen_random_uuid(),
  slip_no text unique not null,
  slip_type text not null check (slip_type in ('purchase', 'sale')),
  slip_date date not null,
  vehicle_no text,
  party_id text references parties_customers(party_id),
  crop text,
  bags integer not null default 0,
  gross_weight numeric(10, 2) not null default 0,
  tare_weight numeric(10, 2) not null default 0,
  net_weight numeric(10, 2) generated always as (gross_weight - tare_weight) stored,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Invoices (Brokerage / General / Crop — Purchase & Sale)
-- ------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  invoice_category text not null check (
    invoice_category in ('brokerage', 'general', 'crop')
  ),
  invoice_type text not null check (invoice_type in ('purchase', 'sale')),
  invoice_date date not null,
  party_id text references parties_customers(party_id),
  subtotal numeric(14, 2) not null default 0,
  brokerage_percent numeric(5, 2) not null default 0,
  brokerage_amount numeric(14, 2) not null default 0,
  net_total numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
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
  batch_label text not null,
  batch_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists invoice_batch_lines (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references invoice_batches(id) on delete cascade,
  party_id text references parties_customers(party_id),
  invoice_type text not null check (invoice_type in ('purchase', 'sale')),
  amount numeric(14, 2) not null default 0
);

-- ------------------------------------------------------------
-- Helpful indexes
-- ------------------------------------------------------------
create index if not exists idx_vouchers_date on vouchers(voucher_date);
create index if not exists idx_transactions_account on transactions(account_code);
create index if not exists idx_transactions_date on transactions(transaction_date);
create index if not exists idx_invoices_party on invoices(party_id);
create index if not exists idx_contracts_party on contracts(party_id);
create index if not exists idx_weighment_party on weighment_slips(party_id);

-- ------------------------------------------------------------
-- Row Level Security
-- Enabled on every table. The policy below allows any authenticated
-- user full access, matching a single-tenant internal office tool.
-- Tighten this (e.g. by role or branch) before exposing it beyond
-- trusted staff.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'chart_of_accounts', 'parties_customers', 'crop_units',
      'vouchers', 'voucher_lines', 'transactions', 'contracts',
      'weighment_slips', 'invoices', 'invoice_lines',
      'invoice_batches', 'invoice_batch_lines'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "Authenticated full access" on %I;', t);
    execute format(
      'create policy "Authenticated full access" on %I
         for all using (auth.role() = ''authenticated'')
         with check (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- Seed data (matches the demo data used in the app's mock mode)
-- ------------------------------------------------------------
insert into chart_of_accounts (code, name, account_type) values
  ('1010001', 'Cash in Hand', 'asset'),
  ('1020001', 'HBL - Multan Cotton Market Branch', 'asset'),
  ('1020002', 'MCB - Vehari Branch', 'asset'),
  ('4010001', 'Brokerage Commission Income', 'income'),
  ('5010001', 'Office & Admin Expenses', 'expense'),
  ('5010002', 'Labour & Loading Charges', 'expense'),
  ('2010001', 'Withholding Tax Payable', 'liability'),
  ('6210001', 'Muhammad Ashraf & Sons', 'asset'),
  ('6210002', 'Al-Barkat Cotton Factory', 'asset'),
  ('6210003', 'DHA Traders', 'asset')
on conflict do nothing;

insert into crop_units (crop, unit_name, kgs_per_unit) values
  ('Cotton', 'Maund', 40),
  ('Wheat', 'Maund', 37.324)
on conflict do nothing;

insert into parties_customers (
  party_id, name, name_urdu, english_business_name, party_group,
  town, sector, address, city, mobile, phone, email, stn, ntn_cnic,
  bank_account, contact_person, can_also_be_vendor
) values
  (
    '6210001', 'Muhammad Ashraf & Sons', 'محمد اشرف اینڈ سنز',
    'Muhammad Ashraf & Sons', 'Bopari', 'Multan', 'Cotton',
    'Cotton Market, Hussain Agahi Road', 'Multan', '0300-1234567',
    '061-4567890', 'ashraf.sons@example.com', 'STN-11-2233',
    '36302-1234567-1', 'PK00HABB0001234567890', 'Muhammad Ashraf', true
  ),
  (
    '6210002', 'Al-Barkat Cotton Factory', 'البرکت کاٹن فیکٹری',
    'Al-Barkat Cotton Factory (Pvt) Ltd', 'Cotton Factory', 'Khanewal',
    'Ginning Factory', 'Multan Road, Industrial Area', 'Khanewal',
    '0301-9988776', '065-2233445', 'info@albarkatcotton.example',
    'STN-09-8871', '3520112223', 'PK00MEZN0009876543210', 'Zafar Iqbal', false
  ),
  (
    '6210003', 'DHA Traders', 'ڈی ایچ اے ٹریڈرز', 'DHA Traders',
    'DHA Group', 'Bahawalpur', 'General Trading', 'Model Town Market',
    'Bahawalpur', '0333-4455667', null, null, null, '31303-7654321-9',
    null, 'Imran Sheikh', true
  )
on conflict do nothing;
