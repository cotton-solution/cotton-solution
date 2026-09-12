import { WeighmentForm } from "@/components/weighment-form";

export default function Page() {
  return (
    <WeighmentForm
      title="Purchase Weighment"
      slipPrefix="PW"
      partyLabel="Vendor"
    />
  );
}
