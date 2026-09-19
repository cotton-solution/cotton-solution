"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Cash Receiving Voucher"
      numberPrefix="CRV"
      voucherType="cash_receiving"
      mode="single"
      anchor={{ kind: "cash", side: "debit" }}
      narrationTemplate={(name) => `Cash Received From ${name}`}
    />
  );
}
