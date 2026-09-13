import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Sale Invoice"
      invoicePrefix="GSI"
      category="general"
      invoiceType="sale"
      partyLabel="Customer"
      includeBrokerage={false}
    />
  );
}
