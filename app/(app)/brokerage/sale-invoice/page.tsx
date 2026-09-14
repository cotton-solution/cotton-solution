import { InvoiceForm } from "@/components/invoice-form";

export default function Page() {
  return (
    <InvoiceForm
      title="Brokerage Sale Invoice"
      invoicePrefix="BSI"
      category="brokerage"
      invoiceType="sale"
      partyLabel="Customer"
      includeBrokerage
    />
  );
}
