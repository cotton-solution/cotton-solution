import { SimpleVoucherForm } from "@/components/simple-voucher-form";

export default function Page() {
  return (
    <SimpleVoucherForm
      title="Cash Receiving Voucher"
      voucherPrefix="CRV"
      partyLabel="Customer"
      voucherType="cash_receiving"
    />
  );
}
