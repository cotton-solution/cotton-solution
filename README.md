# Bahar-e-Madina Commission Agent

Enterprise accounting, brokerage & agricultural commission management system.
Built with Next.js (App Router) + Tailwind CSS.

## One-time setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000

### Connecting Supabase (optional — the app works in demo mode without it)

1. Create a project at https://supabase.com
2. In the Supabase dashboard, open **SQL Editor**, paste the contents of
   `supabase/schema.sql`, and run it. This creates every table (chart of
   accounts, parties, vouchers, contracts, weighment slips, invoices,
   etc.), enables Row Level Security, and seeds the 3 demo parties +
   standard crop units.
3. Copy `.env.local.example` to `.env.local` and fill in your project's
   **Project URL** and **anon public key** (Project Settings → API).
4. Restart `npm run dev`. The Party Master page (`/accounts-forms/party-master`)
   will now read and write from your real Supabase database instead of the
   in-memory demo data — you'll see a green "Connected to Supabase" banner
   at the top of that page instead of the amber "Demo mode" one.

Every other module still uses in-memory mock data for now (see "Still to
come" below) — Party Master is wired first as the reference pattern;
follow `lib/supabase/parties.ts` as the template to wire the rest.

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

**Still to come (next steps):**
- Wire the remaining modules (vouchers, contracts, weighment, invoices,
  reports) to Supabase the same way Party Master was wired in Step 7
- Login/authentication (currently the app opens straight into the dashboard)

## Tech stack
- Next.js 14 (App Router), TypeScript
- Tailwind CSS
- lucide-react icons
- Supabase (Postgres) — to be added in a later step
