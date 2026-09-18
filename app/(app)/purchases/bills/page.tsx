import { InvoiceForm } from "@/components/invoice-form";
import { InvoiceList } from "@/components/invoice-list";

export default function PurchaseBillsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Bills</h1>
        <p className="text-sm text-slate-500 mt-1">
          Record a bill received from a supplier or vendor.
        </p>
      </div>

      <InvoiceForm
        title="Purchase Bill"
        invoicePrefix="BILL"
        category="general"
        invoiceType="purchase"
        partyLabel="Vendor"
        includeBrokerage={false}
      />

      <InvoiceList category="general" title="Bills" defaultTypeFilter="purchase" />
    </div>
  );
}
