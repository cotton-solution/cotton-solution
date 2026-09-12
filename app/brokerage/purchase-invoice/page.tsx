import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Brokerage Purchase Invoice"
      invoicePrefix="BPI"
      partyLabel="Vendor"
      includeBrokerage
    />
  );
}
