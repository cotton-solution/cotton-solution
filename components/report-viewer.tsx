"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Download, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportConfig } from "@/lib/report-data";

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

export function ReportViewer({ report }: { report: ReportConfig }) {
  const searchParams = useSearchParams();
  const activeFilters = useMemo(() => filterSummary(searchParams), [searchParams]);
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-09-12");

  function handleExportCsv() {
    const header = report.columns.join(",");
    const body = report.rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
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
        <h1 className="text-xl font-semibold text-slate-900">
          {report.title}
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
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {report.columns.map((col, i) => (
                  <th
                    key={col}
                    className={cn(
                      "px-4 py-3 font-medium text-slate-600 whitespace-nowrap",
                      report.numericCols?.includes(i)
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
              {report.rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/60">
                  {row.map((cell, ci) => {
                    const isNumeric = report.numericCols?.includes(ci);
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
    </div>
  );
}
