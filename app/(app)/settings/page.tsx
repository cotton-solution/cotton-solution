"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, BookOpen, ShieldCheck, Landmark, Wallet } from "lucide-react";
import { OpeningBalancesDialog } from "@/components/opening-balances-dialog";

const cards = [
  { label: "Company Profile", href: "/settings/company-profile", icon: Building2, description: "Business details, logo, tax info & currency" },
  { label: "Chart of Accounts", href: "/settings/chart-of-accounts", icon: BookOpen, description: "Account codes and types" },
  {
    label: "Opening Balances",
    icon: Wallet,
    description: "What every account stood at before you started using this system",
    dialog: "opening-balances" as const,
  },
  { label: "Posting Accounts", href: "/settings/posting-accounts", icon: Landmark, description: "Which ledger account each type of sale, purchase & expense posts to" },
  { label: "User Permissions", href: "/settings/user-access", icon: ShieldCheck, description: "Role-based access control for your team" },
];

export default function SettingsPage() {
  const [openDialog, setOpenDialog] = useState<"opening-balances" | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings &amp; Administration</h1>
        <p className="text-sm text-slate-500 mt-1">Company setup, chart of accounts and team access.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          const cardBody = (
            <>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-600 transition-colors" />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-900">{c.label}</h2>
              <p className="mt-1 text-xs text-slate-500">{c.description}</p>
            </>
          );

          if ("dialog" in c && c.dialog) {
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => setOpenDialog(c.dialog)}
                className="group text-left rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-600/40 transition-colors"
              >
                {cardBody}
              </button>
            );
          }
          return (
            <Link key={c.href} href={c.href!} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-600/40 transition-colors">
              {cardBody}
            </Link>
          );
        })}
      </div>

      {openDialog === "opening-balances" && (
        <OpeningBalancesDialog onClose={() => setOpenDialog(null)} />
      )}
    </div>
  );
}
