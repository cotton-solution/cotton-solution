"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Bank Payment Voucher"
      numberPrefix="BPV"
      voucherType="bank_payment"
      mode="single"
      anchor={{ kind: "bank", side: "credit" }}
      narrationTemplate={(name) => `Payment To ${name}`}
    />
  );
}
