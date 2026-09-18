"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  FileText,
  ReceiptText,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/lib/modules";

type Action = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Any one of these modules is enough to show the action. */
  modules: ModuleKey[];
  tone?: "in" | "out";
};

/**
 * The jobs a business does every day, one click from the dashboard —
 * so nobody has to walk Dashboard → module → form to enter a receipt.
 */
const ACTIONS: Action[] = [
  {
    label: "Receive cash",
    href: "/transactions/cash-receiving-voucher",
    icon: ArrowDownLeft,
    modules: ["transactions"],
    tone: "in",
  },
  {
    label: "Pay cash",
    href: "/transactions/cash-payment-voucher",
    icon: ArrowUpRight,
    modules: ["transactions"],
    tone: "out",
  },
  {
    label: "Sale invoice",
    href: "/sales/invoices",
    icon: FileText,
    modules: ["sales"],
  },
  {
    label: "Purchase bill",
    href: "/purchases/bills",
    icon: ReceiptText,
    modules: ["purchases"],
  },
  {
    label: "Journal voucher",
    href: "/transactions/journal-voucher",
    icon: BookOpen,
    modules: ["transactions"],
  },
  {
    label: "Add a customer",
    href: "/sales/customers",
    icon: UserPlus,
    modules: ["sales"],
  },
];

export function QuickActions({ allowed }: { allowed: ModuleKey[] }) {
  const set = new Set(allowed);
  const actions = ACTIONS.filter((a) => a.modules.some((m) => set.has(m))).slice(0, 6);

  if (actions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <h2 className="px-5 py-4 text-[15px] font-semibold text-slate-900">
        Start something
      </h2>
      <div className="rule-t grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col gap-2 bg-white px-4 py-4 hover:bg-brand-50/60 transition-colors"
            >
              <Icon
                size={17}
                className={
                  a.tone === "in"
                    ? "text-money-in"
                    : a.tone === "out"
                    ? "text-money-out"
                    : "text-slate-400 group-hover:text-brand-700"
                }
              />
              <span className="text-[13px] font-medium text-slate-800">
                {a.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
