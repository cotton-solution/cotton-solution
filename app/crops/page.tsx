import { ModulePlaceholder } from "@/components/module-placeholder";
import { navSections } from "@/lib/nav";

export default function CropsPage() {
  const item = navSections.find((n) => n.href === "/crops")!;
  return (
    <ModulePlaceholder
      title={item.label}
      description="Crop unit setup, Purchase/Sale Contracts, Weighment slips and Crop Purchase/Sale invoices will appear here."
      icon={item.icon}
    />
  );
}
