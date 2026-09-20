"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Cash Payment Voucher (WHT)"
      numberPrefix="CPW"
      voucherType="cash_payment_wht"
      mode="single"
      anchor={{ kind: "cash", side: "credit" }}
      narrationTemplate={(name) => `Payment To ${name}`}
      withholdingTax
    />
  );
}
