import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Bank Payment Voucher"
      voucherPrefix="BPV"
      partyLabel="Vendor"
      voucherType="bank_payment"
      showBankAccount
    />
  );
}
