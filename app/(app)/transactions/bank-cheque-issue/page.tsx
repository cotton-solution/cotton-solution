import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Bank Cheque Issue"
      voucherPrefix="BCI"
      partyLabel="Vendor"
      voucherType="bank_cheque_issue"
      showBankAccount
      showCheque
    />
  );
}
