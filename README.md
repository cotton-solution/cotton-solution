# Bahar-e-Madina Commission Agent

A **multi-tenant SaaS accounting service** for cotton/wheat commission
agents. Businesses sign up at `/signup`, each gets its own fully
isolated set of accounts, parties, vouchers, contracts and reports —
no business ever sees another business's data. The service owner
manages subscriptions (yearly billing) from a separate `/admin` panel.
Built with Next.js (App Router) + Tailwind CSS + Supabase.

- **Customers** (businesses) → sign up / log in at `/signup` and `/login`.
- **You** (service owner) → sign in at `/admin/login` to see every
  registered business and its subscription status, and to activate /
  renew / suspend accounts.

## One-time setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000

### Connecting Supabase (required for real multi-tenant use — the app works in single-user demo mode without it)

1. Create a project at https://supabase.com
2. In the Supabase dashboard, open **SQL Editor**, paste the contents of
   `supabase/schema.sql`, and run it. This creates every table (businesses,
   chart of accounts, parties, vouchers, contracts, weighment slips,
   invoices, etc.), enables Row Level Security scoped per business, and
   sets up the triggers that automatically create and seed a new
   business the moment someone signs up.
3. Copy `.env.local.example` to `.env.local` and fill in your project's
   **Project URL** and **anon public key** (Project Settings → API).
4. Restart `npm run dev`. Every form in the app (Party Master, vouchers,
   contracts, weighment slips, invoices, multi-invoice batches) will now
   read/write your real Supabase database instead of in-memory demo data
   — each page shows a green "Connected to Supabase" banner instead of
   the amber "Demo mode" one.
5. Once Supabase is connected, `/login` and `/signup` use real Supabase
   Auth instead of the local demo login. For quick testing, you can turn
   off "Confirm email" under Authentication → Providers → Email in the
   Supabase dashboard so new accounts can log in immediately.
6. When someone signs up at `/signup` (with a Business/Company name),
   a Postgres trigger automatically creates their isolated "business"
   row, seeded with a default chart of accounts and standard crop units
   (Cotton @ 40 KGS, Wheat @ 37.324 KGS/Maund) — they never see any
   other business's data, enforced by Row Level Security, not just app
   code.
7. **Becoming an admin** (to use `/admin`): sign up once for a normal
   account, find your user id in the SQL editor
   (`select id from auth.users where email = '...'`), then run
   `insert into admin_users (id, email) values ('<uuid>', 'you@x.com');`.
   Now `/admin/login` with that email/password gets you into the
   service-owner panel.

Until you connect Supabase, every form still works fully in demo mode —
nothing persists between page loads, the whole app is click-through
end to end, and `/admin` isn't usable (there's no real database to
check who's an admin against).

## Progress

**Step 1: Dashboard shell** ✅
- Root layout with fixed left sidebar (desktop) and sliding drawer (mobile)
- Top header: unit identity, FY badge, live clock, user avatar
- Dashboard home with the 5 module cards (Accounts Forms, Accounts Reports,
  Brokerage, General, Crops)
- Placeholder pages for each module route so navigation works end-to-end
- Fully responsive: sidebar collapses to a hamburger + drawer below the
  `lg` breakpoint; tables/cards designed to work down to mobile widths

**Step 2: Accounts Forms** ✅
- Shared form primitives: `Button`, `Input`, `Select`, `Label`, `Checkbox`
  (components/ui) reused by all forms going forward
- Accounts Forms hub page with 6 voucher quick-access cards (Cash Receiving,
  Cash Payment, Journal, Bank Cheque Deposit, Bank Cheque Issue, Cash
  Payment WHT) — each links to its own page (form UI to come)
- Full Customer / Party Master page at `/accounts-forms/party-master`:
  - Filters: Town, Sector, Name search
  - Scrollable existing-parties list (left) with live filtering
  - Full profile form (right): Party ID, Party Group, Name (Urdu +
    English), Business Name, Town/Sector/City, Address, Mobile/Phone/Fax,
    Email, Contact Person, STN #, NTN/CNIC #, Bank Account #
  - "Can also be a vendor" toggle + a Switch button to view the party as
    Customer/Vendor
  - New / Edit / Remove / Save / Switch / Close actions, wired to in-memory
    sample data (3 demo parties) — ready to swap for Supabase in a later step
  - Responsive: list stacks above the form on mobile

**Step 3: Accounts Reports** ✅
- Reports hub page with 9 one-click report cards (Account Ledger, Account
  Payable/Receivable, Bank Statement, Cash Book, Daily Vouchers Details,
  Trial Balance, P&L, Balance Sheet)
- Shared `ReportViewer` component reused by every report: From/To date
  filters, Generate button, Print (browser print), Export as CSV
- Each report renders realistic mock tabular data with right-aligned,
  comma-formatted numeric columns and negative values in parentheses
- Table wrapped in `overflow-x-auto` so wide reports scroll horizontally
  on mobile instead of clipping
- Single dynamic route (`/accounts-reports/[slug]`) driven by a config
  object (`lib/report-data.ts`) — adding a new report later is just a new
  config entry, no new page file needed

**Step 4: Brokerage & General** ✅
- Reusable `InvoiceForm` component: date, party dropdown, editable line
  items (description/unit/qty/rate/amount) with add/remove rows, live
  subtotal, and an optional Brokerage % field (auto-calculates commission
  and net total) — used by all 4 single invoices
- Reusable `MultiInvoiceForm` component: batch entry table (party, type,
  amount) with add/remove rows and a running total — used by both
  Multi Invoice screens
- Brokerage hub (`/brokerage`): Purchase Invoice, Sale Invoice, Multi
  Invoice, Multi Invoice New — all functional against mock party data
- General hub (`/general`): Purchase Invoice, Sale Invoice, Multi Invoice
  — same components, brokerage field hidden since General invoices don't
  carry commission
- All forms responsive: line-item tables scroll horizontally on narrow
  screens instead of clipping

**Step 5: Crops** ✅
- Crops hub (`/crops`) with 7 cards: Crop Units, Purchase/Sale Contracts,
  Purchase/Sale Weighment, Crop Purchase/Sale Invoice
- `/crops/units`: editable table of standard crop units (pre-seeded with
  Cotton @ 40 KGS/Maund and Wheat @ 37.324 KGS/Maund), add/remove your own
- Reusable `ContractForm`: party, crop, unit, quantity, rate, advance —
  auto-calculates contract value and balance due
- Reusable `WeighmentForm`: vehicle #, party, crop, bag count, gross/tare
  weight — auto-calculates net weight
- Crop Purchase/Sale Invoice pages reuse the same `InvoiceForm` from
  Step 4 (with brokerage %), so crop invoicing gets commission calculation
  for free

**Step 6: Voucher Entry Forms** ✅
- Reusable `SimpleVoucherForm` (configurable): powers Cash Receiving
  Voucher, Cash Payment Voucher, Bank Cheque Deposit, Bank Cheque Issue,
  and Cash Payment Voucher (WHT)
  - Bank Cheque Deposit/Issue add bank account + cheque #/date fields
  - WHT voucher adds a withholding % field that auto-computes tax
    deducted and net payment
- New `JournalVoucherForm`: multi-line debit/credit entry against a mock
  chart of accounts, with a running balance check — Save is disabled and
  a warning banner shows until total debit equals total credit
- All 6 voucher cards on the Accounts Forms hub now open fully working
  forms instead of placeholders

**Step 7: Supabase Backend** ✅
- `supabase/schema.sql`: full Postgres schema — chart_of_accounts,
  parties_customers, crop_units, vouchers + voucher_lines, transactions,
  contracts, weighment_slips, invoices + invoice_lines, invoice_batches —
  with indexes, Row Level Security on every table, and seed data matching
  the app's demo parties/crop units
- `lib/supabase/client.ts`: Supabase client that's `null` until
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set —
  the app keeps running in demo mode with mock data until you connect a
  real project (no crashes, no required setup)
- `lib/supabase/parties.ts`: typed fetch/save/delete helpers for the
  Party Master table, mapping between the app's `Party` type and the
  database's snake_case columns
- Party Master page now actually reads from and writes to Supabase when
  configured, with a status banner showing whether you're in demo mode
  or connected, plus inline error messages if a save/delete fails
- `.env.local.example` added for the two required environment variables

**Step 8: Login / Authentication** ✅
- Restructured routing into two route groups so the login screen has no
  sidebar: `(app)` — the full dashboard shell, now auth-protected — and
  `(auth)` — login, sign up, forgot password with a minimal shell
- `/login`: two-column "Account Management Portal" screen (branding +
  feature highlights on the left, form on the right) in the site's own
  emerald/slate theme — email, password, "Forgotten password?" link, and
  a "Create new account" button, matching the layout you shared but
  restyled to match this app instead of Facebook's
- `/signup`: full name, email, password + confirm, with a "check your
  email" screen when Supabase requires email confirmation
- `/forgot-password`: sends a real Supabase reset email when connected
- `AuthProvider` + `AuthGate`: every dashboard route now requires a
  session — signed-out visitors are redirected to `/login` automatically;
  signing in sends you back to the dashboard
- Uses real Supabase Auth when configured; in demo mode (no env vars set)
  any email/password combination logs you in locally so the app still
  works end-to-end without a backend
- Sidebar/mobile "Log Out" buttons now actually sign out and redirect to
  `/login`; the header avatar shows your real initials instead of a
  hardcoded "HH"

**Step 9: Wire Remaining Modules to Supabase** ✅
- All 6 vouchers, both contract types, both weighment slips, all 6
  invoices, and all 3 Multi Invoice batches now save to Supabase when
  configured, using the same `DataModeBanner` pattern as Party Master —
  each form shows whether it's in demo mode or connected, and surfaces
  any save error inline
- New helpers: `lib/supabase/vouchers.ts` (simple vouchers + multi-line
  Journal Vouchers), `contracts.ts`, `weighment.ts`, `invoices.ts`
  (header + line items), `invoice-batches.ts`
- Chart of Accounts restructured as proper `{code, name}` pairs
  (`lib/chart-of-accounts.ts`) so Journal Voucher entries post against
  real account codes instead of free text
- `supabase/schema.sql` updated: party foreign keys now reference the
  human-readable `party_id` (e.g. `6210001`) instead of an internal UUID,
  matching what the app actually uses everywhere; added seed data for
  the chart of accounts
- In demo mode (no Supabase configured) every form still works exactly
  as before — the "Saved" badge just reflects local state instead of a
  database write

**Step 10: Multi-tenant SaaS + Service Admin Panel** ✅
- New `businesses` table (tenant record: name, contact info, plan,
  subscription status, expiry date) — one row per signed-up company
- Every data table (chart of accounts, parties, crop units, vouchers,
  transactions, contracts, weighment slips, invoices, invoice batches)
  now carries a `business_id`, defaulted automatically to the caller's
  own business
- Row Level Security rewritten so a signed-in user can only ever
  read/write rows belonging to their own business — enforced in
  Postgres, not just in the app
- Signing up now asks for a **Business / Company name**; a Postgres
  trigger creates that business automatically and seeds it with its
  own default chart of accounts + standard crop units, so every new
  customer starts with a clean, working setup
- `businesses.subscription_status` (`trial` / `active` / `expired` /
  `suspended`) + `subscription_expires_at` model the yearly billing —
  a `BusinessGate` blocks the dashboard with a renewal notice if a
  business's subscription has expired or been suspended
- A trigger (`protect_subscription_fields`) stops customers from
  granting themselves an active subscription directly — only an admin
  update can change plan/status/expiry
- New **`/admin`** section, completely separate from the customer app:
  `/admin/login` (checks membership in a new `admin_users` table, not
  just a valid login) and `/admin` — a dashboard listing every
  registered business with its plan, status and expiry, plus
  one-click "Activate +1yr", "Suspend" and "Reinstate" actions
- `lib/supabase/businesses.ts`: typed helpers for fetching your own
  business, fetching all businesses (admin), and updating a business's
  subscription (admin)

**Step 11: Account categories, approval workflow & Billing panel** ✅
- Sign up now also asks for a **Business category**: Shopkeeper,
  Wholesaler, Distributor, Trader, or Manufacturer — stored on the
  business record and shown throughout `/admin`
- New signups now start as a **New Account Request** (pending) and
  cannot use the dashboard until an admin approves them — `BusinessGate`
  shows a "waiting for approval" screen instead of blocking only on
  expired/suspended
- `/admin` sidebar reorganized into a real menu:
  **Dashboard** (overview stats) → **Accounts** (New Account Requests /
  Active Accounts / Expired Accounts) → **Billing** (Billed Accounts /
  Unbilled Accounts) → **Logout**
- Every account row has **View**, **Edit**, and **Delete** — View shows
  full details, Edit updates name/category/contact info, Delete
  permanently removes the business and cascades to all of its data
  (parties, vouchers, invoices, everything)
- New Account Requests get an **Approve** button (grants a year of
  access); Expired Accounts get **Renew +1yr**; Active Accounts get
  **Suspend**/**Reinstate**
- New independent `billing_status` (`billed` / `unbilled`) tracks
  whether this year's invoice has been collected, separate from
  subscription status — **Mark Billed** / **Mark Unbilled** buttons
  move accounts between the two Billing tabs
- If you already ran the old `schema.sql` on a live Supabase project,
  run **`supabase/migration_2_categories_billing.sql`** once in the SQL
  editor to add the new columns/policies without touching existing data
  (a fresh project can just run the updated `schema.sql` directly)

**Still to come (next steps):**
- General ledger posting: vouchers/invoices don't yet write into the
  `transactions` table (the actual double-entry ledger) — Trial
  Balance/P&L/Balance Sheet reports still show static mock data rather
  than being computed from real records
- A reports layer that reads real Supabase data instead of the mock
  tables in `lib/report-data.ts`
- Party Master's Switch button (Customer ↔ Vendor view) is still cosmetic

## Tech stack
- Next.js 14 (App Router), TypeScript
- Tailwind CSS
- lucide-react icons
- Supabase (Postgres, Auth, Row Level Security) — multi-tenant backend
