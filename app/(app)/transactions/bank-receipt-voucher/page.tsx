"use client";

import { VoucherEditor } from "@/components/voucher-editor";

/**
 * "Bank Receipts Voucher" is the renamed Bank Cheque Deposit form (bank
 * account + optional cheque #/date). It keeps the `bank_cheque_deposit`
 * voucher type so vouchers already saved under that type still open here.
 */
export default function Page() {
  return (
    <VoucherEditor
      title="Bank Receipts Voucher"
      numberPrefix="BRV"
      voucherType="bank_cheque_deposit"
      mode="single"
      anchor={{ kind: "bank", side: "debit" }}
      narrationTemplate={(name) => `Received From ${name}`}
      showCheque
    />
  );
}
