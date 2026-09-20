-- ============================================================
-- Migration: IBFT (Inter Bank Fund Transfer) voucher.
-- Safe to run on the already-deployed project: it only adds one
-- nullable column and widens a check constraint — no data is touched
-- and every existing voucher keeps working.
--
-- Run this once in the Supabase SQL Editor (after migration_7).
-- ============================================================

-- The destination bank of an IBFT. (`bank_account` holds the source.)
alter table vouchers add column if not exists to_bank_account text;

alter table vouchers drop constraint if exists vouchers_voucher_type_check;

alter table vouchers add constraint vouchers_voucher_type_check check (
  voucher_type in (
    'cash_receiving', 'cash_payment', 'journal',
    'bank_cheque_deposit', 'bank_cheque_issue', 'cash_payment_wht',
    'bank_receipt', 'bank_payment',
    'contra_cash_to_bank', 'contra_bank_to_cash',
    'ibft'
  )
);
