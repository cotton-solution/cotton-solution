"use client";

import { useBusiness } from "@/components/business-provider";
import type { AccountLedgerReport } from "@/lib/supabase/ledger";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtMoney(n: number): string {
  return Math.round(Math.abs(n)).toLocaleString("en-PK");
}

function fmtBalance(n: number): string {
  if (n === 0) return `${fmtMoney(0)}`;
  return `${fmtMoney(n)} ${n > 0 ? "Dr" : "Cr"}`;
}

/**
 * The printable Account Ledger — one party or account's full running
 * balance, laid out the way the legacy desktop software prints it:
 * the business's own letterhead, a title bar, the account's details
 * and the Voucher #/Date/Narration/Debit/Credit/Balance table with an
 * opening-balance row and a totals row. This is what "Preview" in the
 * Account Ledger popup (Reports → General Ledger) opens.
 */
export function AccountLedgerReportView({
  report,
  filterLabel,
}: {
  report: AccountLedgerReport;
  filterLabel: string;
}) {
  const { business } = useBusiness();
  const now = new Date();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden print:border-0 print:shadow-none">
      {/* letterhead */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-base font-bold text-slate-900 leading-tight">
          {business?.name ?? "Business"}
        </p>
        {business?.address && (
          <p className="text-[12px] text-slate-500 leading-snug">{business.address}</p>
        )}
        {(business?.contactPhone || business?.contactEmail) && (
          <p className="text-[12px] text-slate-500 leading-snug">
            {[business?.contactPhone && `Tel: ${business.contactPhone}`, business?.contactEmail]
              .filter(Boolean)
              .join("   ")}
          </p>
        )}
      </div>

      {/* title bar + account details */}
      <div className="bg-gradient-to-r from-indigo-100 to-violet-100 border-y border-indigo-200 px-5 py-3">
        <p className="text-center text-xl font-bold text-slate-800 tracking-wide mb-3">
          Account Ledger
        </p>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Account:{" "}
              <span className="font-bold">
                {report.accountCode} — {report.accountName}
              </span>
            </p>
            {report.accountAddress && (
              <p className="text-xs text-slate-600 mt-0.5">Address: {report.accountAddress}</p>
            )}
            {report.accountContact && (
              <p className="text-xs text-slate-600">Contact #: {report.accountContact}</p>
            )}
          </div>
          <div className="text-xs text-slate-600 sm:text-right shrink-0">
            <p>Printed Date: {now.toLocaleDateString("en-GB")}</p>
            <p>
              Printed Time:{" "}
              {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <p className="text-xs font-medium text-slate-600 mt-2">{filterLabel}</p>
      </div>

      {/* table */}
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 whitespace-nowrap">Voucher #</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 whitespace-nowrap">Date</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Narration</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600 whitespace-nowrap">Debit</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600 whitespace-nowrap">Credit</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600 whitespace-nowrap">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="bg-slate-50/60">
              <td className="px-4 py-2.5 text-slate-400">—</td>
              <td className="px-4 py-2.5 text-slate-400">—</td>
              <td className="px-4 py-2.5 font-medium text-slate-700">Opening Balance</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                {report.openingBalance > 0 ? fmtMoney(report.openingBalance) : ""}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                {report.openingBalance < 0 ? fmtMoney(report.openingBalance) : ""}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-800">
                {fmtBalance(report.openingBalance)}
              </td>
            </tr>
            {report.entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{e.voucherNo}</td>
                <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="px-4 py-2.5 text-slate-700">{e.narration || "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {e.debit ? fmtMoney(e.debit) : ""}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                  {e.credit ? fmtMoney(e.credit) : ""}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-800">
                  {fmtBalance(e.balance)}
                </td>
              </tr>
            ))}
            {report.entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No transactions in this range — only the opening balance applies.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-800">
              <td colSpan={3} className="px-4 py-2.5 text-right">TOTALS:</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoney(report.totalDebit)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoney(report.totalCredit)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmtBalance(report.closingBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
