"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatAmount, formatDelta } from "@/lib/format";

type Figure = {
  label: string;
  value: number;
  previous?: number;
  /** Whether going up is good news for this figure. */
  upIsGood: boolean;
};

/**
 * The four headline numbers a business owner checks first — balance
 * figures (Bank Balance, Outstanding Invoices) sit next to flow
 * figures (Total Sales, Total Expenses) on one rule-separated strip.
 */
export function FiguresStrip({
  bankBalance,
  sales,
  salesPrev,
  outstandingInvoices,
  expenses,
  expensesPrev,
  periodLabel,
}: {
  bankBalance: number;
  sales: number;
  salesPrev: number;
  outstandingInvoices: number;
  expenses: number;
  expensesPrev: number;
  periodLabel: string;
}) {
  const figures: Figure[] = [
    { label: "Bank Balance", value: bankBalance, upIsGood: true },
    { label: "Total Sales", value: sales, previous: salesPrev, upIsGood: true },
    { label: "Outstanding Invoices", value: outstandingInvoices, upIsGood: false },
    { label: "Total Expenses", value: expenses, previous: expensesPrev, upIsGood: false },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <p className="px-5 pt-4 text-[12px] text-slate-500">{periodLabel}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-slate-100 lg:divide-y-0 lg:divide-x lg:divide-slate-100">
        {figures.map((f) => {
          const hasTrend = f.previous !== undefined;
          const delta =
            hasTrend && f.previous! > 0
              ? ((f.value - f.previous!) / f.previous!) * 100
              : 0;
          const flat = Math.abs(delta) < 0.5;
          const good = f.upIsGood ? delta > 0 : delta < 0;
          const Icon = flat ? Minus : delta > 0 ? TrendingUp : TrendingDown;
          return (
            <div key={f.label} className="px-5 py-4">
              <p className="text-[12.5px] text-slate-500">{f.label}</p>
              <p className="figure mt-1 text-[20px] leading-none font-medium text-slate-900">
                <span className="text-slate-400 text-[13px] mr-1">Rs</span>
                {formatAmount(f.value)}
              </p>
              {hasTrend ? (
                <p
                  className={`mt-2 flex items-center gap-1 text-[12px] ${
                    flat ? "text-slate-500" : good ? "text-money-in" : "text-money-out"
                  }`}
                >
                  <Icon size={13} />
                  <span className="figure">{flat ? "0%" : formatDelta(delta)}</span>
                  <span className="text-slate-400">vs last month</span>
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-slate-400">as of today</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
