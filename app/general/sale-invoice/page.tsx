import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Sale Invoice"
      invoicePrefix="GSI"
      partyLabel="Customer"
      includeBrokerage={false}
    />
  );
}
