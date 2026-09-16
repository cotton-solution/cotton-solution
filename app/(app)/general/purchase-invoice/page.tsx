import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Purchase Invoice"
      invoicePrefix="GPI"
      category="general"
      invoiceType="purchase"
      partyLabel="Vendor"
      includeBrokerage={false}
    />
  );
}
