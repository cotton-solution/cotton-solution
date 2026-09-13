import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Crop Purchase Invoice"
      invoicePrefix="CPI"
      category="crop"
      invoiceType="purchase"
      partyLabel="Vendor"
      includeBrokerage
    />
  );
}
