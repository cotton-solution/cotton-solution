"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Bank Receipt Voucher"
      numberPrefix="BRV"
      voucherType="bank_receipt"
      mode="single"
      anchor={{ kind: "bank", side: "debit" }}
      narrationTemplate={(name) => `Received From ${name}`}
    />
  );
}
