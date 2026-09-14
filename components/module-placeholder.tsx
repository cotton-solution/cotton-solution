import { LucideIcon } from "lucide-react";

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={22} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        <p className="mt-4 text-xs text-slate-400">
          This module is being built in the next step.
        </p>
      </div>
    </div>
  );
}
