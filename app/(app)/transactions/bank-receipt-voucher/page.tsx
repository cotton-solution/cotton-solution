import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Bank Receipt Voucher"
      voucherPrefix="BRV"
      partyLabel="Customer"
      voucherType="bank_receipt"
      showBankAccount
    />
  );
}
