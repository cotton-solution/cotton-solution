import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { vouchers, masterSetupCards } from "@/lib/vouchers";

export default function AccountsFormsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Accounts Forms
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create vouchers or manage customer / party master records.
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Vouchers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((v) => {
            const Icon = v.icon;
            return (
              <Link
                key={v.href}
                href={v.href}
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
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {v.label}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{v.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Master Setup
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          {masterSetupCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-600/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <card.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {card.label}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {card.description}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-brand-600 transition-colors shrink-0 ml-3"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
