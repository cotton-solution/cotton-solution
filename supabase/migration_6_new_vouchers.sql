-- ============================================================
-- Migration: Bank Receipt, Bank Payment & Contra Vouchers.
-- Safe to run on the already-deployed project (only widens a check
-- constraint — no data is touched, existing vouchers keep working).
-- ============================================================

alter table vouchers drop constraint if exists vouchers_voucher_type_check;

alter table vouchers add constraint vouchers_voucher_type_check check (
  voucher_type in (
    'cash_receiving', 'cash_payment', 'journal',
    'bank_cheque_deposit', 'bank_cheque_issue', 'cash_payment_wht',
    'bank_receipt', 'bank_payment',
    'contra_cash_to_bank', 'contra_bank_to_cash'
  )
);
