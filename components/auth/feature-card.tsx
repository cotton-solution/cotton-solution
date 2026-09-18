import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group flex items-start gap-3 rounded-[12px] border border-slate-200 bg-white p-4 transition-shadow duration-200 ease-out hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.08)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-green-50">
        <Icon size={18} className="text-green-800" strokeWidth={2} />
      </div>
      <div className="pt-0.5">
        <p className="text-sm font-semibold leading-5 text-slate-900">
          {title}
        </p>
        <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
