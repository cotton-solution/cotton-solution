"use client";

import { VoucherEditor } from "@/components/voucher-editor";

export default function Page() {
  return (
    <VoucherEditor
      title="Journal Voucher"
      numberPrefix="JV"
      voucherType="journal"
      mode="dual"
      anchor={{ kind: "none" }}
      narrationTemplate={(name) => name}
    />
  );
}
