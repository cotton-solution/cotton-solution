"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Printer,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { useBusiness } from "@/components/business-provider";
import { fetchAccountLedgerReport, type AccountLedgerReport } from "@/lib/supabase/ledger";

const ROWS_PER_PAGE = 20;

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function fmtMoney(n: number): string {
  return Math.round(Math.abs(n)).toLocaleString("en-PK");
}
function fmtBalance(n: number): string {
  if (n === 0) return fmtMoney(0);
  return `${fmtMoney(n)} ${n > 0 ? "Dr" : "Cr"}`;
}

export type AccountLedgerPreviewParams = {
  accountCode: string;
  filterLabel: string;
  from?: string;
  to?: string;
};

/**
 * The Account Ledger "Preview" — a print-preview window sized like a
 * sheet of A4, with the same first/prev/page-number/next/last
 * controls as the legacy desktop software's report viewer. Renders
 * every page in the DOM (only the current one visible on screen) so
 * Print always produces the complete ledger, not just what's on
 * screen.
 */
export function AccountLedgerPreviewModal({
  params,
  onClose,
}: {
  params: AccountLedgerPreviewParams;
  onClose: () => void;
}) {
  const { business } = useBusiness();
  const [report, setReport] = useState<AccountLedgerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAccountLedgerReport(params.accountCode, { from: params.from, to: params.to }).then((r) => {
      if (!cancelled) {
        setReport(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.accountCode, params.from, params.to]);

  const pages = useMemo(() => {
    if (!report) return [];
    // Page 1 gets one fewer row of room for the fuller header; every
    // later page repeats a compact header instead.
    const first = report.entries.slice(0, ROWS_PER_PAGE);
    const rest = report.entries.slice(ROWS_PER_PAGE);
    const chunks = [first];
    for (let i = 0; i < rest.length; i += ROWS_PER_PAGE) {
      chunks.push(rest.slice(i, i + ROWS_PER_PAGE));
    }
    return chunks.length ? chunks : [[]];
  }, [report]);

  const totalPages = pages.length;
  const now = new Date();

  useEffect(() => {
    document.body.classList.add("ledger-printing");
    return () => document.body.classList.remove("ledger-printing");
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-slate-900/70 overflow-y-auto py-6 px-3 print:bg-white print:py-0 print:px-0">
      <style>{`
        @media print {
          body.ledger-printing > *:not(#ledger-print-root) { display: none !important; }
          #ledger-print-root { position: static !important; background: white !important; }
          .ledger-toolbar { display: none !important; }
          .ledger-page { box-shadow: none !important; margin: 0 !important; display: block !important; }
          .ledger-page + .ledger-page { break-before: page; }
        }
      `}</style>

      <div id="ledger-print-root" className="w-full flex flex-col items-center">
        {/* toolbar */}
        <div className="ledger-toolbar sticky top-0 z-10 mb-4 flex items-center gap-1 rounded-lg bg-white shadow-lg border border-slate-200 px-2 py-1.5">
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
            aria-label="First page"
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs text-slate-500 px-2 tabular-nums">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-30"
            aria-label="Last page"
          >
            <ChevronsRight size={15} />
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Printer size={14} />
            Print
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-white text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading ledger…
          </div>
        )}

        {!loading && report && (
          <>
            {pages.map((pageEntries, idx) => {
              const isCurrent = idx + 1 === page;
              const isFirst = idx === 0;
              const isLast = idx === pages.length - 1;
              return (
                <div
                  key={idx}
                  className={`ledger-page bg-white shadow-2xl mb-6 print:mb-0 ${isCurrent ? "block" : "hidden print:block"}`}
                  style={{ width: "210mm", minHeight: "297mm", padding: "14mm" }}
                >
                  {isFirst ? (
                    <>
                      <p className="text-base font-bold text-slate-900">{business?.name ?? "Business"}</p>
                      {business?.address && <p className="text-[11px] text-slate-500">{business.address}</p>}
                      {(business?.contactPhone || business?.contactEmail) && (
                        <p className="text-[11px] text-slate-500">
                          {[business?.contactPhone && `Tel: ${business.contactPhone}`, business?.contactEmail]
                            .filter(Boolean)
                            .join("   ")}
                        </p>
                      )}
                      <div className="bg-gradient-to-r from-indigo-100 to-violet-100 border-y border-indigo-200 px-4 py-3 mt-3 -mx-[14mm]">
                        <p className="text-center text-lg font-bold text-slate-800 tracking-wide mb-2">
                          Account Ledger
                        </p>
                        <div className="flex items-start justify-between px-[14mm]">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Account: <span className="font-bold">{report.accountCode} — {report.accountName}</span>
                            </p>
                            {report.accountAddress && (
                              <p className="text-xs text-slate-600 mt-0.5">Address: {report.accountAddress}</p>
                            )}
                            {report.accountContact && (
                              <p className="text-xs text-slate-600">Contact #: {report.accountContact}</p>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 text-right shrink-0">
                            <p>Printed Date: {now.toLocaleDateString("en-GB")}</p>
                            <p>Printed Time: {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-slate-600 mt-2 px-[14mm]">{params.filterLabel}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline justify-between border-b border-slate-300 pb-2 mb-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {report.accountCode} — {report.accountName}
                      </p>
                      <p className="text-xs text-slate-400">(continued)</p>
                    </div>
                  )}

                  <table className="w-full text-[12px] mt-3">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left font-semibold text-slate-700 py-1.5 pr-2">Voucher #</th>
                        <th className="text-left font-semibold text-slate-700 py-1.5 pr-2">Date</th>
                        <th className="text-left font-semibold text-slate-700 py-1.5 pr-2">Narration</th>
                        <th className="text-right font-semibold text-slate-700 py-1.5 pr-2">Debit</th>
                        <th className="text-right font-semibold text-slate-700 py-1.5 pr-2">Credit</th>
                        <th className="text-right font-semibold text-slate-700 py-1.5">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFirst && (
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <td className="py-1.5 pr-2 text-slate-400">—</td>
                          <td className="py-1.5 pr-2 text-slate-400">—</td>
                          <td className="py-1.5 pr-2 font-medium text-slate-700">Opening Balance</td>
                          <td className="py-1.5 pr-2 text-right tabular-nums">
                            {report.openingBalance > 0 ? fmtMoney(report.openingBalance) : ""}
                          </td>
                          <td className="py-1.5 pr-2 text-right tabular-nums">
                            {report.openingBalance < 0 ? fmtMoney(report.openingBalance) : ""}
                          </td>
                          <td className="py-1.5 text-right tabular-nums font-medium">
                            {fmtBalance(report.openingBalance)}
                          </td>
                        </tr>
                      )}
                      {pageEntries.map((e) => (
                        <tr key={e.id} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 whitespace-nowrap">{e.voucherNo}</td>
                          <td className="py-1.5 pr-2 whitespace-nowrap">{fmtDate(e.date)}</td>
                          <td className="py-1.5 pr-2">{e.narration || "—"}</td>
                          <td className="py-1.5 pr-2 text-right tabular-nums">{e.debit ? fmtMoney(e.debit) : ""}</td>
                          <td className="py-1.5 pr-2 text-right tabular-nums">{e.credit ? fmtMoney(e.credit) : ""}</td>
                          <td className="py-1.5 text-right tabular-nums font-medium">{fmtBalance(e.balance)}</td>
                        </tr>
                      ))}
                      {isFirst && report.entries.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            No transactions in this range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {isLast && (
                      <tfoot>
                        <tr className="border-t-2 border-slate-400 font-semibold text-slate-800">
                          <td colSpan={3} className="py-2 text-right">TOTALS:</td>
                          <td className="py-2 text-right tabular-nums">{fmtMoney(report.totalDebit)}</td>
                          <td className="py-2 text-right tabular-nums">{fmtMoney(report.totalCredit)}</td>
                          <td className="py-2 text-right tabular-nums">{fmtBalance(report.closingBalance)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>

                  <p className="mt-4 text-[10px] text-slate-400 text-right">
                    Page {idx + 1} of {totalPages}
                  </p>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
