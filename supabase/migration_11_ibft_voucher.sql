-- ============================================================
-- Migration 11: IBFT (Inter Bank Fund Transfer) voucher type.
-- ------------------------------------------------------------
-- IBFT is saved like every other voucher (header + voucher_lines: the
-- "From" bank is credited, the "To" bank(s) debited), so no new columns
-- are needed — this only widens the allowed voucher_type values.
--
-- Safe to run on the already-deployed project: no data is touched and
-- every existing voucher keeps working. Run once in the Supabase SQL
-- Editor. (Running it twice is harmless.)
-- ============================================================

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
