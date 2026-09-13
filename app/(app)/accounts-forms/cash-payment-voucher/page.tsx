import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Cash Payment Voucher"
      voucherPrefix="CPV"
      partyLabel="Vendor"
      voucherType="cash_payment"
    />
  );
}
