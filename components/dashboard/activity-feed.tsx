"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  BookOpen,
  Repeat,
  ReceiptText,
} from "lucide-react";
import { formatAmount, formatRelativeDay } from "@/lib/format";
import type { ActivityItem } from "@/lib/dashboard";

const KIND: Record<
  ActivityItem["kind"],
  { icon: typeof FileText; tint: string; sign: "+" | "-" | "" }
> = {
  sale_invoice: { icon: FileText, tint: "text-brand-700 bg-brand-50", sign: "+" },
  purchase_invoice: { icon: ReceiptText, tint: "text-money-out bg-orange-50", sign: "-" },
  receipt: { icon: ArrowDownLeft, tint: "text-brand-700 bg-brand-50", sign: "+" },
  payment: { icon: ArrowUpRight, tint: "text-money-out bg-orange-50", sign: "-" },
  journal: { icon: BookOpen, tint: "text-slate-600 bg-slate-100", sign: "" },
  contra: { icon: Repeat, tint: "text-slate-600 bg-slate-100", sign: "" },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[15px] font-semibold text-slate-900">
          Recent activity
        </h2>
        <Link
          href="/accounts-reports/daily-vouchers"
          className="text-[12px] font-medium text-brand-700 hover:text-brand-800"
        >
          Day book
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="px-5 pb-6 text-[13px] text-slate-500">
          Nothing posted yet. Your invoices and vouchers will appear here as
          you record them.
        </p>
      ) : (
        <ul className="rule-t divide-y divide-slate-100">
          {items.map((item) => {
            const meta = KIND[item.kind];
            const Icon = meta.icon;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
                >
                  <Icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900">
                    {item.party ?? item.title}
                  </span>
                  <span className="block truncate text-[12px] text-slate-500">
                    {item.party ? `${item.title} · ` : ""}
                    {item.reference} · {formatRelativeDay(item.date)}
                  </span>
                </span>
                <span
                  className={`figure shrink-0 text-[13px] ${
                    meta.sign === "+"
                      ? "text-money-in"
                      : meta.sign === "-"
                      ? "text-money-out"
                      : "text-slate-600"
                  }`}
                >
                  {meta.sign}
                  {formatAmount(item.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
