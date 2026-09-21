import { Suspense } from "react";
import { InvoiceFormWithWeighment } from "@/components/invoice-form-with-weighment";
import { InvoiceList } from "@/components/invoice-list";

export default function SalesInvoicesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Sale Invoice</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create and send a professional invoice to a customer.
        </p>
      </div>

      <Suspense fallback={null}>
        <InvoiceFormWithWeighment
          title="Sale Invoice"
          invoicePrefix="INV"
          category="general"
          invoiceType="sale"
          partyLabel="Customer"
          includeBrokerage={false}
        />
      </Suspense>

      <InvoiceList category="general" title="Sale invoices" defaultTypeFilter="sale" />
    </div>
  );
}
