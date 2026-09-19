"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Bank Cheque Deposit"
      numberPrefix="BCD"
      voucherType="bank_cheque_deposit"
      mode="single"
      anchor={{ kind: "bank", side: "debit" }}
      narrationTemplate={(name) => `Cheque Received From ${name}`}
      showCheque
    />
  );
}
