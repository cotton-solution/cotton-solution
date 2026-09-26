"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Download, Filter, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportConfig } from "@/lib/report-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchAccountLedgerReport, fetchTrialBalance, type AccountLedgerReport } from "@/lib/supabase/ledger";
import { AccountLedgerReportView } from "@/components/account-ledger-report";

function formatCell(value: string | number, isNumeric: boolean) {
  if (!isNumeric || typeof value !== "number") return value;
  const formatted = Math.abs(value).toLocaleString("en-PK");
  return value < 0 ? `(${formatted})` : formatted;
}

/** Human-readable summary of the filters chosen in the popup this
 *  report was opened from (Account Ledger / Accounts Balances), read
 *  straight off the URL — nothing here is fabricated, it just echoes
 *  back what was picked so the person can see the report matches. */
function filterSummary(params: URLSearchParams): string[] {
  const bits: string[] = [];
  const accountLabel = params.get("accountLabel");
  if (accountLabel) bits.push(`Account: ${accountLabel}`);

  const dateMode = params.get("dateMode");
  if (dateMode === "single" && params.get("date")) bits.push(`Date: ${params.get("date")}`);
  else if (dateMode === "range" && params.get("from") && params.get("to"))
    bits.push(`Range: ${params.get("from")} to ${params.get("to")}`);
  else if (dateMode === "all") bits.push("All Dates");

  const accountsShown = params.get("accountsShown");
  if (accountsShown) bits.push(`Accounts: ${accountsShown}`);
  const partiesShown = params.get("partiesShown");
  if (partiesShown) bits.push(`Parties: ${partiesShown}`);
  const headType = params.get("headType");
  if (headType) bits.push(`Head Type: ${headType}`);
  const closingValueMoreThan = params.get("closingValueMoreThan");
  if (closingValueMoreThan) bits.push(`Closing > ${closingValueMoreThan}`);

  const flagLabels: Record<string, string> = {
    showSimpleCpNarration: "Simple CP Narration",
    showJvNarration: "JV Narration",
    showOnlyPurchases: "Purchases Only",
    showOnlySale: "Sale Only",
    showOnlyPayments: "Payments Only",
    withAdvancePendingCheque: "With Advance/Pending Cheque",
    sortByVoucherNo: "Sorted by Voucher No",
    excludeNoTransaction: "Excl. No-Transaction Accounts",
    extended: "Extended",
    simpleReport: "Simple Report",
    printUrdu: "Print Urdu",
  };
  for (const [key, label] of Object.entries(flagLabels)) {
    if (params.get(key) === "1") bits.push(label);
  }
  return bits;
}

export function ReportViewer({ report, slug }: { report: ReportConfig; slug?: string }) {
  const searchParams = useSearchParams();
  const activeFilters = useMemo(() => filterSummary(searchParams), [searchParams]);
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-09-12");

  // When Supabase is connected, Account Ledger / Accounts Balances read
  // the real ledger the posting engine writes to (migration_20) instead
  // of the illustrative rows in lib/report-data.ts. `null` = still on
  // the mock (either not applicable to this report, or not fetched yet).
  const [liveRows, setLiveRows] = useState<(string | number)[][] | null>(null);
  const [liveColumns, setLiveColumns] = useState<string[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveEmpty, setLiveEmpty] = useState(false);
  // The Account Ledger report renders its own printable layout
  // (letterhead + opening balance + running balance) rather than the
  // generic table used by every other report.
  const [ledgerReport, setLedgerReport] = useState<AccountLedgerReport | null>(null);

  const accountRef = searchParams.get("account");
  const accountLabel = searchParams.get("accountLabel") ?? "";
  const dateMode = searchParams.get("dateMode");
  const rangeFrom = dateMode === "range" ? searchParams.get("from") ?? undefined : undefined;
  const rangeTo = dateMode === "range" ? searchParams.get("to") ?? undefined : undefined;
  const singleDate = dateMode === "single" ? searchParams.get("date") ?? undefined : undefined;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (slug === "account-ledger" && accountRef) {
      const code = accountRef.replace(/^(coa|party):/, "");
      setLiveLoading(true);
      fetchAccountLedgerReport(code, {
        from: singleDate ?? rangeFrom,
        to: singleDate ?? rangeTo,
      }).then((rep) => {
        setLedgerReport(rep);
        setLiveLoading(false);
      });
    } else if (slug === "account-balances") {
      setLiveLoading(true);
      fetchTrialBalance({ from: singleDate ?? rangeFrom, to: singleDate ?? rangeTo }).then(
        (trial) => {
          const rows = trial.map((t) => [
            t.accountCode,
            t.accountName,
            t.accountType,
            t.debit,
            t.credit,
            t.closingBalance,
          ]) as (string | number)[][];
          setLiveColumns([
            "A/c No",
            "Account Name",
            "Type",
            "Debit",
            "Credit",
            "Closing Balance",
          ]);
          setLiveRows(rows);
          setLiveEmpty(rows.length === 0);
          setLiveLoading(false);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, accountRef, dateMode, rangeFrom, rangeTo, singleDate]);

  const isLiveCapableSlug = slug === "account-ledger" || slug === "account-balances";
  const usingLiveData = liveColumns !== null || ledgerReport !== null;
  const columns = liveColumns ?? report.columns;
  const rows = liveColumns
    ? liveRows!
    : isSupabaseConfigured && isLiveCapableSlug
    ? [] // a real business's own books — never show illustrative mock numbers here
    : report.rows;
  const numericCols = liveColumns ? [3, 4, 5] : report.numericCols;

  function handleExportCsv() {
    const header = columns.join(",");
    const body = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          {report.title}
          {usingLiveData && (
            <span className="text-[11px] font-medium uppercase tracking-wide rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5">
              Live
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{report.description}</p>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs text-brand-800">
          <Filter size={13} className="shrink-0" />
          {activeFilters.map((f) => (
            <span key={f} className="rounded-full bg-white border border-brand-200 px-2 py-0.5">
              {f}
            </span>
          ))}
        </div>
      )}

      {isSupabaseConfigured && slug === "account-ledger" && !accountRef && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Pick an account from the Account Ledger popup (Reports → General Ledger) to see its real ledger here.
        </div>
      )}

      {slug === "account-ledger" ? (
        <>
          {accountRef && (
            <div className="flex justify-end print:hidden">
              <Button
                variant="secondary"
                onClick={() => window.print()}
                aria-label="Print ledger"
              >
                <Printer size={16} />
                Print
              </Button>
            </div>
          )}

          {liveLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500 rounded-xl border border-slate-200 bg-white shadow-card">
              <Loader2 size={14} className="animate-spin" />
              Loading the ledger…
            </div>
          )}

          {!liveLoading && ledgerReport && (
            <AccountLedgerReportView report={ledgerReport} filterLabel={activeFilters.join(" · ") || "All Dates"} />
          )}
        </>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <Label htmlFor="from-date">From Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="to-date">To Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 sm:flex-none">Generate</Button>
                <Button
                  variant="secondary"
                  onClick={() => window.print()}
                  aria-label="Print report"
                >
                  <Printer size={16} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportCsv}
                  aria-label="Export as CSV"
                >
                  <Download size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
            {liveLoading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500 border-b border-slate-100">
                <Loader2 size={14} className="animate-spin" />
                Loading the ledger…
              </div>
            )}
            {!liveLoading && usingLiveData && liveEmpty && (
              <div className="px-4 py-6 text-sm text-slate-400 text-center">
                No ledger entries yet for this selection.
              </div>
            )}
            <div className="overflow-x-auto thin-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {columns.map((col, i) => (
                      <th
                        key={col}
                        className={cn(
                          "px-4 py-3 font-medium text-slate-600 whitespace-nowrap",
                          numericCols?.includes(i)
                            ? "text-right"
                            : "text-left"
                        )}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50/60">
                      {row.map((cell, ci) => {
                        const isNumeric = numericCols?.includes(ci);
                        return (
                          <td
                            key={ci}
                            className={cn(
                              "px-4 py-3 whitespace-nowrap text-slate-700",
                              isNumeric && "text-right tabular-nums"
                            )}
                          >
                            {formatCell(cell, !!isNumeric)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
