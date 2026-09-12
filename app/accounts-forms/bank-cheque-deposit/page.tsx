import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Bank Cheque Deposit"
      voucherPrefix="BCD"
      partyLabel="Customer"
      showBankAccount
      showCheque
    />
  );
}
