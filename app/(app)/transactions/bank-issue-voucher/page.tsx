import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Bank Issue Voucher"
      voucherPrefix="BPV"
      partyLabel="Vendor"
      voucherType="bank_payment"
      showBankAccount
    />
  );
}
