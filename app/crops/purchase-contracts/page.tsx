import { ContractForm } from "@/components/contract-form";

export default function Page() {
  return (
    <ContractForm
      title="Purchase Contract"
      invoicePrefix="PC"
      partyLabel="Vendor"
    />
  );
}
