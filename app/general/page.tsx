import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { generalCards } from "@/lib/general";

export default function GeneralPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">General</h1>
        <p className="text-sm text-slate-500 mt-1">
          Direct purchase/sale invoices without brokerage commission.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {generalCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-600/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-300 group-hover:text-brand-600 transition-colors"
                />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-900">
                {c.label}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{c.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
