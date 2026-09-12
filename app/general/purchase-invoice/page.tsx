import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Purchase Invoice"
      invoicePrefix="GPI"
      partyLabel="Vendor"
      includeBrokerage={false}
    />
  );
}
