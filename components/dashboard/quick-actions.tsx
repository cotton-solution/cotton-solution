"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  FileText,
  ReceiptText,
  Scale,
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
 * The jobs a commission agent does every day, one click from the
 * dashboard — so nobody has to walk Dashboard → module → card → form
 * to enter a receipt.
 */
const ACTIONS: Action[] = [
  {
    label: "Receive cash",
    href: "/accounts-forms/cash-receiving-voucher",
    icon: ArrowDownLeft,
    modules: ["accounts-forms"],
    tone: "in",
  },
  {
    label: "Pay cash",
    href: "/accounts-forms/cash-payment-voucher",
    icon: ArrowUpRight,
    modules: ["accounts-forms"],
    tone: "out",
  },
  {
    label: "Sale invoice",
    href: "/brokerage/sale-invoice",
    icon: FileText,
    modules: ["brokerage"],
  },
  {
    label: "Sale invoice",
    href: "/general/sale-invoice",
    icon: FileText,
    modules: ["general"],
  },
  {
    label: "Purchase invoice",
    href: "/general/purchase-invoice",
    icon: ReceiptText,
    modules: ["general"],
  },
  {
    label: "Weighment slip",
    href: "/crops/purchase-weighment",
    icon: Scale,
    modules: ["crops"],
  },
  {
    label: "Journal voucher",
    href: "/accounts-forms/journal-voucher",
    icon: BookOpen,
    modules: ["accounts-forms"],
  },
  {
    label: "Add a party",
    href: "/accounts-forms/party-master",
    icon: UserPlus,
    modules: ["accounts-forms"],
  },
];

export function QuickActions({ allowed }: { allowed: ModuleKey[] }) {
  const set = new Set(allowed);
  const seen = new Set<string>();
  const actions = ACTIONS.filter((a) => {
    if (!a.modules.some((m) => set.has(m))) return false;
    // "Sale invoice" exists in both Brokerage and General — show one.
    if (seen.has(a.label)) return false;
    seen.add(a.label);
    return true;
  }).slice(0, 6);

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
