import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Crop Sale Invoice"
      invoicePrefix="CSI"
      category="crop"
      invoiceType="sale"
      partyLabel="Customer"
      includeBrokerage
    />
  );
}
