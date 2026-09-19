"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { LedgerAccount } from "@/lib/hooks/use-ledger-accounts";

const TYPE_LABELS: Record<string, string> = {
  all: "-- ALL ACCOUNTS --",
  party: "Party",
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

/** Best-effort account-type guess for a Chart of Accounts row, from
 *  its code's leading digit (1=Asset, 2=Liability, 3=Equity,
 *  4=Revenue, 5=Expense) — the convention this app's chart already
 *  follows (see lib/coa-data.ts). */
function coaTypeFromCode(code: string): string {
  switch (code.charAt(0)) {
    case "1":
      return "asset";
    case "2":
      return "liability";
    case "3":
      return "equity";
    case "4":
      return "revenue";
    case "5":
      return "expense";
    default:
      return "asset";
  }
}

function typeOf(a: LedgerAccount): string {
  return a.kind === "party" ? "party" : coaTypeFromCode(a.sublabel);
}

/**
 * The "Search Accounts" popup — Name search, an Account Type filter,
 * and a results table, opened from the "…" button next to A/c No.
 * Mirrors the desktop accounting-software pattern the user asked to
 * match, built with the app's own components.
 */
export function AccountSearchModal({
  accounts,
  onSelect,
  onClose,
}: {
  accounts: LedgerAccount[];
  onSelect: (account: LedgerAccount) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = name.trim().toLowerCase();
    return accounts.filter((a) => {
      if (typeFilter !== "all" && typeOf(a) !== typeFilter) return false;
      if (!q) return true;
      return a.label.toLowerCase().includes(q) || a.sublabel.toLowerCase().includes(q);
    });
  }, [accounts, name, typeFilter]);

  function confirmSelection() {
    const picked = results.find((a) => a.ref === highlighted) ?? results[0];
    if (picked) onSelect(picked);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl border border-slate-200 mt-10 sm:mt-0 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Search Accounts</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmSelection();
              }}
              placeholder="Type to search…"
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Account Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left font-medium px-4 py-2 w-32">A/c No</th>
                <th className="text-left font-medium px-4 py-2">Name</th>
                <th className="text-left font-medium px-4 py-2 w-28">A/c Type</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-slate-400 py-8">
                    No accounts match.
                  </td>
                </tr>
              ) : (
                results.slice(0, 300).map((a) => (
                  <tr
                    key={a.ref}
                    onClick={() => setHighlighted(a.ref)}
                    onDoubleClick={() => onSelect(a)}
                    className={`cursor-pointer border-t border-slate-100 ${
                      highlighted === a.ref ? "bg-brand-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-500 figure">{a.sublabel}</td>
                    <td className="px-4 py-2 text-slate-900">{a.label}</td>
                    <td className="px-4 py-2 text-slate-500 capitalize">{typeOf(a)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmSelection}
            disabled={results.length === 0}
            className="h-9 px-4 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
