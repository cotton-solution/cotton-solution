import { ModulePlaceholder } from "@/components/module-placeholder";
import { vouchers } from "@/lib/vouchers";

export default function Page() {
  const item = vouchers.find(
    (v) => v.href === "/accounts-forms/bank-cheque-issue"
  )!;
  return (
    <ModulePlaceholder
      title={item.label}
      description={item.description}
      icon={item.icon}
    />
  );
}
