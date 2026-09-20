"use client";

import { VoucherEditor } from "@/components/voucher-editor";

/**
 * IBFT — Inter Bank Fund Transfer. Money leaves the "From Bank Account"
 * (credited) and lands in the bank account(s) picked in the entry rows
 * (debited). No customer or vendor is involved.
 */
export default function Page() {
  return (
    <VoucherEditor
      title="IBFT — Inter Bank Fund Transfer"
      numberPrefix="IBFT"
      voucherType="ibft"
      mode="single"
      anchor={{ kind: "bank", side: "credit" }}
      anchorLabel="From Bank Account"
      narrationTemplate={(name) => `Funds Transferred To ${name}`}
    />
  );
}
