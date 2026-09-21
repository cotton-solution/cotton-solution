# Bahar-e-Madina — Accounting Software

A **multi-tenant SaaS accounting service** for small and medium
businesses. Businesses sign up at `/signup`, each gets its own fully
isolated set of accounts, parties, vouchers, invoices and reports —
no business ever sees another business's data. The service owner
manages subscriptions (yearly billing) from a separate `/admin` panel.
Built with Next.js (App Router) + Tailwind CSS + Supabase.

Every business gets the same 9-module menu — Dashboard, Transactions,
Banking, Sales & Receivables, Purchases & Payables, Inventory,
Expenses, Financial Reports, Settings & Administration. See **"Rebuilt
as a generic 9-module accounting app"** further down for the full
module list and what each one covers.

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
2b. Run `supabase/migration_5_team_access.sql`, `migration_6_new_vouchers.sql`,
   `migration_7_generic_accounting.sql` and
   `migration_8_voucher_line_items.sql`, in that order, in the same
   SQL Editor — they add team/staff logins, the newer voucher types,
   the Banking / Quotations / Purchase Orders / Inventory / Expenses /
   Company Profile tables, and multi-row voucher entry. (A brand-new
   project just needs `schema.sql` then these four, in order — see
   each migration's own comment for what it adds.)
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

**Step: Chart of Accounts management** ✅
- Full Chart of Accounts page at `/accounts-forms/chart-of-accounts`,
  added next to Party Master under Accounts Forms → Master Setup
  - Filters: Account Type, Name search, "show inactive" toggle
  - Scrollable existing-accounts list (left) with type + active/inactive
    badges
  - Account form (right): Code, Type (Asset/Liability/Equity/
    Income/Expense), Name, Parent Account (for sub-accounts), Active toggle
  - Code auto-suggested from the account type's numbering block
    (1=Asset, 2=Liability, 3=Equity, 4=Income, 5=Expense) when creating —
    editable before saving; locked once the account exists so codes
    already used on vouchers/reports never change under you
  - New / Edit / Remove / Save / Close actions; Remove is blocked if the
    account still has sub-accounts under it
  - Wired to `chart_of_accounts` (already in `schema.sql`, auto-seeded
    per business) with an in-memory demo fallback, same pattern as Party
    Master
  - If you already ran the old `schema.sql`, run
    **`supabase/migration_4_chart_of_accounts.sql`** once in the SQL
    editor to add the `is_active`/`updated_at` columns this screen needs
    (a fresh project can just run the updated `schema.sql` directly)

**Step: User Access & Security** ✅
- New "User Access" module (sidebar + dashboard card), visible to the
  business owner and to any staff login given the Admin role
- `/user-access`: add a team member (name, email, role), see everyone
  who's been added, change anyone's role, and Deactivate/Reactivate a
  login without deleting it
- Roles: **Admin** (everything, including User Access), **Accountant**
  (Accounts Forms + Reports), **Trader** (Trader + Reports), **Viewer**
  (Reports only), **Custom** (owner hand-picks exactly which modules)
- The sidebar, mobile nav, dashboard cards and route guard all now
  narrow themselves to a staff login's assigned modules — a Trader
  role never sees Brokerage even if the business category includes it
- Creating a login needs the Supabase **service role** key, which must
  stay server-only — see `SUPABASE_SERVICE_ROLE_KEY` in
  `.env.local.example` and `app/api/team/invite/route.ts`. Only the
  business owner can add/manage team members
- A brand-new temporary password is shown once right after adding
  someone — share it with them and have them change it after they log
  in (there's no email/SMTP step required for this to work)
- If you already ran an older `schema.sql`, run
  **`supabase/migration_5_team_access.sql`** once in the SQL editor (a
  fresh project can just run the updated `schema.sql` directly)
- **Known limitation:** access control here is enforced at the UI/route
  level (what a staff login can navigate to), not yet at the database
  row level per module — every login on a business can still read/write
  the same tenant data a Supabase RLS tenant boundary already isolates
  by business. Fine for trusted staff; if you need e.g. a Viewer who
  truly cannot submit vouchers even via a direct API call, that needs
  follow-up RLS work per table

**Step: Bank Receipt, Bank Payment & Contra Vouchers** ✅
- Three new voucher forms under Accounts Forms → Vouchers, next to the
  existing Cash Receiving/Payment and Bank Cheque Deposit/Issue ones:
  - **Bank Receipt Voucher** — customer pays straight into a bank
    account (online transfer / cheque deposit), instead of cash
  - **Bank Payment Voucher** — pay a vendor by bank transfer, online
    payment, or pay order
  - **Contra Voucher** — move your own money between cash and a bank
    account (Cash → Bank or Bank → Cash); no customer/vendor involved,
    so it has its own simpler form (date, direction, bank account,
    amount, narration)
- Bank Receipt/Payment reuse the same voucher form component as the
  rest (mobile + PC friendly by the same pattern already in the app)
- If you already ran an older `schema.sql`, run
  **`supabase/migration_6_new_vouchers.sql`** once in the SQL editor to
  widen the `vouchers.voucher_type` check constraint (a fresh project
  can just run the updated `schema.sql` directly)

**Step: Financial Overview dashboard** ✅
- `/` is no longer a menu of module cards — it is now a real financial
  overview, built from the rows the app already writes:
  - **Cash position** (dark ledger panel): total cash + bank, with every
    bank account and cash-in-hand listed as ledger rows, negatives in
    parentheses
  - **Receivable / Payable** with an ageing breakdown (0–30 / 31–60 /
    61–90 / 90+) and the net position
  - **Month-to-date figures strip**: Sales, Purchases, Brokerage earned,
    Paid out — each with a % change against last month
  - **Last 12 months chart** (hand-drawn inline SVG, no chart library):
    toggles between "Money in / out" and "Sales / purchases", hover or
    keyboard-focus a month to read its exact figures
  - **Largest balances**: top parties by exposure, in either direction
  - **Recent activity**: latest invoices and vouchers as one feed
  - **Start something**: one-click launchers for the daily jobs
    (receive cash, pay cash, sale invoice, weighment slip, journal
    voucher, add a party), filtered by the modules that login can see
  - Module cards are kept, but as a quiet strip at the bottom
- `lib/supabase/dashboard.ts` aggregates `invoices` + `vouchers` +
  `parties_customers` into the dashboard shape; if Supabase isn't
  connected (or a query fails) it falls back to a realistic demo book
  and says so. A connected business with no records yet gets honest
  zeroes and empty-state copy, not fake numbers
- New money formatting layer (`lib/format.ts`): South Asian digit
  grouping (48,25,300), `Rs` prefix, lakh/crore short forms for chart
  axes, and relative dates for the activity feed
- Design tokens added to `tailwind.config.ts`: a `ledger` palette for
  the dark panel and semantic `money` colours (in / out / due) so a
  colour on screen always means something
- All amounts are set in IBM Plex Mono with `tabular-nums` via the new
  `.figure` class, so digits line up column-to-column like a printed
  ledger. Fonts are wired through `lib/fonts.ts`

**Step: Navigation & information architecture** ✅
- The module registry (`lib/modules.ts`) now declares every *page*,
  not just every module — each module carries `children` grouped into
  named sections (Receipts / Payments / Adjustments / Master setup,
  Ledgers / Cash & bank / Financial statements, and so on). Adding a
  screen is still a one-line edit in one file
- New `NavTree` component drives **both** the desktop sidebar and the
  mobile drawer, so the two can't drift apart. Modules expand in place,
  the module you're in opens automatically, and every voucher, report
  and master screen is now reachable in one click instead of
  dashboard → module hub → card → form
- A **Dashboard** link sits at the top of the nav — previously the only
  way back was the logo
- New **command palette** (`Ctrl`/`⌘` + `K`, or the Search button in the
  header): searches every screen the signed-in user is entitled to, by
  name and by the words people actually use at the mandi — rokar,
  kanta, sauda, khata, bhao — with arrow keys and Enter to jump
- New **breadcrumb trail** under the business name, resolved against the
  registry so labels read like the sidebar ("Cash Receiving Voucher",
  not the URL slug); moves to its own row on mobile
- Header rebuilt: working avatar **menu** (name, email, role, User
  access, Log out — the avatar was previously inert), and the financial
  year badge is now computed from today's date on a July–June year
  instead of the hardcoded "FY 2026-27"
- Removed the dead **Exit** button from the sidebar and mobile drawer
  (it had no handler and did nothing)

**Step: Critical data-correctness fixes** ✅
- **Sequential document numbering** (`lib/hooks/use-document-number.ts`):
  every invoice, voucher, contract and weighment slip used to pick
  `PREFIX-<random 4-digit number>`, which could collide at any time —
  two people saving a Cash Receiving Voucher in the same minute had a
  real chance of landing on the same number, and nothing stopped it.
  Numbers are now read as the highest existing one for that prefix,
  scoped to the business by RLS, plus one — the way a paper voucher
  book works. Demo mode counts up a session-only sequence instead of
  calling `Math.random()`
- **Live Party directory** (`lib/hooks/use-party-directory.ts`): every
  form that needs a party dropdown — Invoices, Contracts, Weighment
  slips, Vouchers, Multi Invoice batches — imported a hardcoded
  3-party demo list directly, so a customer added in Party Master
  (which does read/write Supabase) never appeared anywhere else in the
  app. All six forms now share one hook that reads the real Party
  Master list, with a clear "No parties yet — add one in Party Master"
  state and a disabled Save until a party exists
- **Live Chart of Accounts** (`lib/hooks/use-account-directory.ts`):
  same bug on the Journal Voucher form, which posted against a
  hardcoded 10-row list instead of the accounts actually created on
  the (live) Chart of Accounts screen. It now reads real active
  accounts, same pattern as parties

**Step: List pages for invoices & vouchers** ✅
- New `RecordsTable` component: search box, filter chips, a totals
  footer, loading/empty states — the shared shell for "find something
  I already saved," which no module had before
- New `RecordDetailDrawer`: click any row to see the full record —
  party, amounts, WHT/brokerage breakdown, narration — with a **Print**
  button, instead of a saved document being unreachable the moment you
  left its form
- **Invoice list** (`components/invoice-list.tsx`), added under the
  cards on the **Brokerage**, **General** and **Crops** hub pages:
  search by invoice # or party, filter by Sale/Purchase, running total
  of the filtered rows
- **Voucher list** (`components/voucher-list.tsx`), added under
  **Accounts Forms**: search by voucher #, party or narration, filter
  by Receipts / Payments / Journal / Contra
- `lib/supabase/invoices.ts` and `lib/supabase/vouchers.ts` gained
  `fetchInvoices()` / `fetchVouchers()`, scoped to the signed-in
  business exactly like every save already was
- `lib/demo-records.ts`: realistic sample invoices and vouchers for
  demo mode, so the new list pages aren't empty on first look — shaped
  identically to the Supabase result so the list components never need
  to know which source they got
- **Known limitation:** these lists are read + print, not yet edit —
  correcting a saved invoice or voucher still means voiding it by hand
  and re-entering it. Inline edit is a reasonable next step once this
  is confirmed useful

**Still to come (next steps):**
- Dashboard figures are derived from invoice/voucher rows, not from a
  posted ledger — once double-entry posting lands they should read
  `transactions` balances instead (the UI won't need to change)
- General ledger posting: vouchers/invoices don't yet write into the
  `transactions` table (the actual double-entry ledger) — Trial
  Balance/P&L/Balance Sheet reports still show static mock data rather
  than being computed from real records
- A reports layer that reads real Supabase data instead of the mock
  tables in `lib/report-data.ts`
- Party Master's Switch button (Customer ↔ Vendor view) is still cosmetic

**Step: Rebuilt as a generic 9-module accounting app** ✅
- The cotton/crop-trading-specific modules — **Crops**, **Brokerage**,
  **Trader**, **General** — have been removed. The app is now a
  generic accounting product, with a fixed 9-item menu
  (`lib/modules.ts`) that every business gets, in this order:
  1. **Dashboard** — financial overview, cash flow & recent activity
  2. **Transactions** — every voucher (was "Accounts Forms")
  3. **Banking** *(new)* — Bank Accounts, Reconciliation, Credit Cards
  4. **Sales & Receivables** — Invoices, Customers, **Quotations** *(new)*
  5. **Purchases & Payables** — Bills, Suppliers, **Purchase Orders** *(new)*
  6. **Inventory** *(new)* — Items Catalog, Warehouses, Stock Movements
  7. **Expenses** *(new)* — category-wise daily expense tracking
  8. **Financial Reports** — every report (was "Accounts Reports")
  9. **Settings & Administration** — Company Profile *(new)*, Chart of
     Accounts, User Permissions
- Business category (`shopkeeper`/`wholesaler`/etc.) no longer changes
  which modules are visible — every business gets the same 9. The
  category field is kept as descriptive info only.
- Customers and Vendors share one party directory (`can_also_be_vendor`
  flag) — **Sales → Customers** is the full editor, **Purchases →
  Suppliers** is a filtered read view of the same data.
- Sale invoices and Purchase bills reuse the existing generic invoice
  engine (`invoice_category = 'general'`) — no schema change needed
  there.
- **If you already ran an older `schema.sql`**, run
  **`supabase/migration_7_generic_accounting.sql`** once in the SQL
  editor. It adds (a fresh project can just run the updated
  `schema.sql` + this migration, in order):
  - `currency`, `tax_number`, `address`, `website` columns on
    `businesses` (Company Profile)
  - `bank_accounts`, `bank_reconciliations`, `credit_cards` (Banking)
  - `quotations` + `quotation_lines` (Sales — Quotations/Estimates)
  - `purchase_orders` + `purchase_order_lines` (Purchases — POs)
  - `warehouses`, `inventory_items`, `stock_movements` (Inventory)
  - `expenses` (Expenses)
  - Row Level Security on every new table, same
    `business_id = my_business_id()` tenant-isolation pattern as
    everything else
  - Widens the `business_members` role check to also accept `sales` /
    `purchases` (the `trader` role value is kept for backward
    compatibility — the app now labels it "Sales & Purchases")
- **Known limitation:** the new Banking, Quotations, Purchase Orders,
  Inventory and Expenses modules are full CRUD against real tables,
  but — like invoices — they don't yet post into the double-entry
  ledger, so they won't appear in Trial Balance/P&L/Balance Sheet
  until that posting layer is built. Vouchers (see below) do post to
  the ledger.

**Step: Per-business branding + one voucher-entry system for every voucher type** ✅
- **Branding is now per-business, not platform-wide.** The sidebar,
  mobile menu and header used to always show the platform's own name
  and logo (`site_settings` — set by the service owner in `/admin`),
  even though this is meant to be a paid product where every business
  sees its own identity. They now show `business.name` /
  `business.logoUrl` (edited in **Settings → Company Profile**, which
  gained a Logo URL field), and fall back to the platform's branding
  only for the moment before the business record has loaded.
  `businesses` gained a `logo_url` column (in
  `migration_7_generic_accounting.sql`). Logo is a URL field for
  now — pasting a link to an already-hosted image — not a file
  upload; that would need a Supabase Storage bucket wired up.
- Fixed a duplicate "Dashboard" sidebar entry (`nav-tree.tsx` had a
  hardcoded Dashboard link left over from before Dashboard became a
  real module in the registry).
- **Every voucher type now uses one shared multi-row entry screen**
  (`components/voucher-editor.tsx`), replacing the old one-party,
  one-amount form — deliberately modelled on the classic desktop
  accounting-software pattern (entry bar + grid), not a modern
  always-editable table:
  - **Select Account** ("A/c No" field's "…" button) opens a
    **Search Accounts** popup (`components/account-search-modal.tsx`)
    with a Name search box, an Account Type filter (Party / Asset /
    Liability / Equity / Revenue / Expense / All), and a results
    table — merging every party (customer/vendor) and every Chart of
    Accounts head into one searchable list.
  - **One entry bar, not N editable rows.** Pick an account, type a
    narration, type an amount, press **Enter** (or "Add Row") — the
    row drops into the grid below and the entry bar clears itself,
    ready for the next line immediately (keyboard flow: pick account
    → Enter moves to Narration → Enter moves to Amount → Enter commits
    and refocuses the account field). Clicking a row already in the
    grid loads it back into the entry bar to edit; a trash icon on
    each row deletes it outright.
  - **Dr/Cr is automatic** for every voucher except Journal: Cash
    Receiving/Payment always debit/credit "Cash in Hand"
    automatically; Bank vouchers ask which bank ledger head is the
    other side; Contra fixes one side to Cash (shown as a locked
    label in the entry bar, no search needed) and the other to a
    chosen bank head; Journal Voucher alone stays fully manual (the
    entry bar has both a Dr and a Cr field, only one filled per row)
    since that's what a journal entry is for.
  - **Cash Payment (WHT)** keeps the gross/WHT%/net calculation, now
    applied to the whole voucher's rows at once, and posts the
    withheld amount to a WHT-payable account you pick per voucher.
  - **Save** writes the voucher, flashes "Saved", and reopens a
    blank voucher at the next number — like turning to a fresh page
    in a paper voucher book.
  - **Clear** resets the on-screen form. If the voucher on screen was
    already saved (opened via "Open"), Clear deletes it from the
    database and reopens that same voucher number blank, ready for
    fresh entry.
  - **Open** searches previously saved vouchers of that type by
    number or narration and loads one back into the editor.
  - **Delete** removes the currently opened voucher (asks for
    confirmation first).
  - **Close** discards any unsaved changes and returns to a blank,
    next-numbered voucher.
  - Every voucher — not just Journal — now writes to `voucher_lines`
    (see `migration_8_voucher_line_items.sql`, which adds `party_id`
    and `line_narration` to that table). `Contra`, `Crops`,
    `Brokerage`, `Trader` and `General` no longer exist as separate
    concepts here — this is one generic ledger-posting engine every
    voucher type configures.
  - **Not yet built:** the reference software's live "Cash in Hand" /
    "Account Balance" readout at the top of the voucher (would need a
    running-balance query per account) — out of scope for now, noted
    here so it isn't mistaken for an oversight.

- **If you already ran `migration_7_generic_accounting.sql`**, also
  run **`supabase/migration_8_voucher_line_items.sql`** once in the
  SQL editor. A fresh project just runs `schema.sql` then all the
  migrations in order (`migration_2` → `migration_8`).

## Tech stack
- Next.js 14 (App Router), TypeScript
- Tailwind CSS
- lucide-react icons
- Supabase (Postgres, Auth, Row Level Security) — multi-tenant backend

---

## Company Profile permissions (`migration_9_company_profile_permissions.sql`)

Run **`supabase/migration_9_company_profile_permissions.sql`** once in the
Supabase SQL editor.

- The **company name** can only be changed by a platform admin, from the
  Service Admin dashboard → Edit business. Owners and staff see it as a
  locked field. This is enforced by a database trigger, not just the UI.
- Every other Company Profile field (logo, contact, address, tax number,
  currency, category, website) can be edited by the business owner **or**
  by a staff login that has the Settings module (built-in "Admin" role, or
  a custom role with Settings ticked).

## Voucher print / PDF

Print and Download PDF on every voucher screen produce a half-A4
(A5 landscape, 210 × 148.5 mm) voucher with the business letterhead.
Longer vouchers continue on extra half-A4 pages. Uses the `pdf-lib`
package (run `npm install`).


## Login page texts (`migration_10_login_page_text.sql`)

Run **`supabase/migration_10_login_page_text.sql`** once in the Supabase SQL
Editor. It lets the service admin edit, from **Website Setting → Login Page**,
the line under the website name, the login heading ("Welcome back"), the
login sub-line and the copyright line. Text can use `{siteName}` and `{year}`.
Until the migration is run the site simply shows the built-in defaults.


---

## Transactions menu — latest layout

The sidebar no longer expands: clicking a module (Transactions, Banking,
Sales…) opens that module's own page. On **Transactions** the vouchers are
grouped as:

1. **Receipts** — Cash Receiving Voucher, Bank Receipts Voucher
2. **Payments** — Cash Payment Voucher, Bank Issue Voucher, Cash Payment Voucher (WHT)
3. **Adjustments** — Journal Voucher, IBFT (Inter Bank Fund Transfer)

Notes:
- *Bank Receipts Voucher* is the old **Bank Cheque Deposit** form (bank account +
  optional cheque #/date), still saved as type `bank_cheque_deposit`.
- *Bank Issue Voucher* is the old **Bank Payment Voucher**, renamed
  (`/transactions/bank-issue-voucher`, type `bank_payment`, numbers stay `BPV-…`).
- *IBFT* is new (`/transactions/ibft`): the "From Bank Account" is credited and
  the bank account(s) picked in the rows are debited. **Run
  `supabase/migration_11_ibft_voucher.sql` once** before saving an IBFT.
- Contra Voucher and Bank Cheque Issue were removed from the menu. Vouchers
  already saved under those types still show in Recent vouchers. Their old URLs
  (and the old Bank Payment Voucher / Bank Cheque Deposit URLs) now redirect.
- `supabase/migration_8_ibft_voucher.sql` and `components/ibft-voucher-form.tsx`
  are empty leftovers from an earlier attempt and can be deleted.


---

## Banking, Weighment & company name

- **Banking** was removed from the sidebar/menus (and from the default Accountant
  role). Its old URLs redirect to the dashboard; the database tables are untouched.
- **Weighment** is a new tab under **Purchases** (`/purchases/weighment`) and **Sales**
  (`/sales/weighment`). Fill Date, Vehicle No, Product, Weight, Party → Save. Each
  entry gets an ID (`PUR-1001` / `SAL-1001`) and appears in the list below with its
  final weight (editable until it is moved). **Move to Purchase / Sale** opens the
  bill / invoice with the party, product and weight filled in; saving that bill marks
  the weighment *Moved* — it can only be moved once.
  **Run `supabase/migration_12_weighments.sql` once** before using it.
- **Company name**: the header now always shows the company name from Settings →
  Company Profile. If the company can't be loaded, Company Profile now shows the real
  reason (and if migration 7's profile columns are missing, the name still loads and a
  notice says which migration to run).

- **"infinite recursion detected in policy for relation businesses"** (company name shows
  as "My Business", Company Profile can't load): run
  `supabase/migration_13_fix_rls_recursion.sql` once in the Supabase SQL Editor.

- **Party heads in Chart of Accounts**: Settings → Chart of Accounts now lists the heads
  **Buyers (62), Sellers (63) and Misc Parties (64)** with every party under its head
  (read-only there — parties are still added/edited in Party Master). Party Master has a new
  **Party Type (Head)** field. **Run `supabase/migration_14_party_types.sql` once** so the type
  can be saved; until then every party shows under Buyers. Sellers automatically count as
  vendors (Suppliers, Purchase Orders, Purchase Weighment).
