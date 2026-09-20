"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Cash Payment Voucher"
      numberPrefix="CPV"
      voucherType="cash_payment"
      mode="single"
      anchor={{ kind: "cash", side: "credit" }}
      narrationTemplate={(name) => `Cash Payment To ${name}`}
    />
  );
}
