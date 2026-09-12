import { ContractForm } from "@/components/contract-form";

export default function Page() {
  return (
    <ContractForm
      title="Sale Contract"
      invoicePrefix="SC"
      contractType="sale"
      partyLabel="Customer"
    />
  );
}
