import { WeighmentForm } from "@/components/weighment-form";

export default function Page() {
  return (
    <WeighmentForm
      title="Sale Weighment"
      slipPrefix="SW"
      slipType="sale"
      partyLabel="Customer"
    />
  );
}
