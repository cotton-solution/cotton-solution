"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { reports } from "@/lib/reports";
import { AccountLedgerDialog } from "@/components/account-ledger-dialog";
import { AccountBalancesDialog } from "@/components/account-balances-dialog";

export default function FinancialReportsPage() {
  const [openDialog, setOpenDialog] = useState<"account-ledger" | "account-balances" | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Financial Reports
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          One-click access to key financial reports.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          const dialog = "dialog" in r ? r.dialog : undefined;
          const cardBody = (
            <>
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
                {r.label}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{r.description}</p>
            </>
          );

          // Reports with a matching filter popup open it first — the popup's
          // own Preview button is what navigates to the report itself.
          return dialog ? (
            <button
              key={r.href}
              type="button"
              onClick={() => setOpenDialog(dialog)}
              className="group text-left rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-600/40 transition-colors"
            >
              {cardBody}
            </button>
          ) : (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-600/40 transition-colors"
            >
              {cardBody}
            </Link>
          );
        })}
      </div>

      {openDialog === "account-ledger" && (
        <AccountLedgerDialog onClose={() => setOpenDialog(null)} />
      )}
      {openDialog === "account-balances" && (
        <AccountBalancesDialog onClose={() => setOpenDialog(null)} />
      )}
    </div>
  );
}
