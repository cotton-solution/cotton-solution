import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Brokerage Purchase Invoice"
      invoicePrefix="BPI"
      category="brokerage"
      invoiceType="purchase"
      partyLabel="Vendor"
      includeBrokerage
    />
  );
}
