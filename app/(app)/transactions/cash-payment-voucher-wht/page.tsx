import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Cash Payment Voucher (WHT)"
      voucherPrefix="CPW"
      partyLabel="Vendor"
      voucherType="cash_payment_wht"
      showWht
    />
  );
}
