"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Bank Cheque Issue"
      numberPrefix="BCI"
      voucherType="bank_cheque_issue"
      mode="single"
      anchor={{ kind: "bank", side: "credit" }}
      narrationTemplate={(name) => `Cheque Issued To ${name}`}
      showCheque
    />
  );
}
