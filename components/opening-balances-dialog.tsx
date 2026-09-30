"use client";

import { useEffect, useMemo, useState } from "react";
import { Landmark, Search } from "lucide-react";
import { PopupWindow } from "@/components/popup-window";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useLedgerAccounts } from "@/lib/hooks/use-ledger-accounts";
import { accountTypes, type AccountType } from "@/lib/coa-data";
import { fetchOpeningBalances, saveOpeningBalance } from "@/lib/supabase/opening-balances";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Draft = { debit: string; credit: string };

/**
 * "Accounts Opening Balances" popup — the legacy desktop grid, minus
 * the Crop Season column (not used here). One row per account; typing
 * a debit or credit and pressing Save posts a real, balanced opening
 * entry to the ledger (migration_23) so the Account Ledger / Trial
 * Balance reports carry it from day one.
 */
export function OpeningBalancesDialog({ onClose }: { onClose: () => void }) {
  const { accounts, loading: accountsLoading } = useLedgerAccounts();
  const [saved, setSaved] = useState<Record<string, { debit: number; credit: number }>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [accountType, setAccountType] = useState<AccountType | "all">("all");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchOpeningBalances().then((rows) => {
      const map: Record<string, { debit: number; credit: number }> = {};
      for (const r of rows) map[r.accountCode] = { debit: r.openingDebit, credit: r.openingCredit };
      setSaved(map);
      setLoading(false);
    });
  }, []);

  const rows = useMemo(() => {
    const code = (ref: string) => ref.replace(/^(coa|party):/, "");
    return accounts
      .filter((a) => accountType === "all" || a.accountType === accountType)
      .filter((a) => {
        const q = filter.trim().toLowerCase();
        if (!q) return true;
        return a.label.toLowerCase().includes(q) || code(a.ref).includes(q);
      })
      .map((a) => ({ code: code(a.ref), name: a.label }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, accountType, filter]);

  function draftFor(code: string): Draft {
    if (drafts[code]) return drafts[code];
    const s = saved[code];
    return { debit: s?.debit ? String(s.debit) : "", credit: s?.credit ? String(s.credit) : "" };
  }

  function setDraft(code: string, field: "debit" | "credit", value: string) {
    const current = draftFor(code);
    setDrafts((d) => ({ ...d, [code]: { ...current, [field]: value } }));
  }

  async function handleSaveRow(code: string) {
    const d = draftFor(code);
    const debit = parseFloat(d.debit) || 0;
    const credit = parseFloat(d.credit) || 0;
    setSavingCode(code);
    setError(null);
    const { error: err } = await saveOpeningBalance(code, debit, credit);
    setSavingCode(null);
    if (err) {
      setError(err);
      return;
    }
    setSaved((s) => ({ ...s, [code]: { debit, credit } }));
    setDrafts((d) => {
      const next = { ...d };
      delete next[code];
      return next;
    });
  }

  async function handleSaveAll() {
    const changed = Object.keys(drafts);
    for (const code of changed) {
      await handleSaveRow(code);
    }
  }

  function handleClear(code: string) {
    setDrafts((d) => {
      const next = { ...d };
      delete next[code];
      return next;
    });
  }

  const dirtyCount = Object.keys(drafts).length;

  return (
    <PopupWindow
      title="Accounts Opening Balances"
      icon={<Landmark size={15} className="text-slate-500" />}
      maxWidth="max-w-4xl"
      onClose={onClose}
      footer={
        <>
          {dirtyCount > 0 && (
            <span className="text-xs text-slate-400 mr-auto">
              {dirtyCount} unsaved row{dirtyCount > 1 ? "s" : ""}
            </span>
          )}
          <Button onClick={handleSaveAll} disabled={dirtyCount === 0 || !!savingCode}>
            {savingCode ? "Saving…" : "Save"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {!isSupabaseConfigured && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This is demo mode — connect Supabase to set real opening balances.
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-slate-500 mb-1">Account Type</label>
          <Select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType | "all")}>
            <option value="all">All Types</option>
            {accountTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500 mb-1">Account Name</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name or code…"
              className="w-full h-10 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto thin-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left font-medium text-slate-600 w-24">A/c No.</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">A/c Name</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600 w-36">Opening Debit</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600 w-36">Opening Credit</th>
                <th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(loading || accountsLoading) && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">Loading…</td>
                </tr>
              )}
              {!loading && !accountsLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">No accounts match.</td>
                </tr>
              )}
              {!loading &&
                !accountsLoading &&
                rows.map((r) => {
                  const d = draftFor(r.code);
                  const isDirty = !!drafts[r.code];
                  return (
                    <tr key={r.code} className={isDirty ? "bg-amber-50/40" : "hover:bg-slate-50/60"}>
                      <td className="px-3 py-1.5 font-mono text-xs text-slate-500">{r.code}</td>
                      <td className="px-3 py-1.5 text-slate-800">{r.name}</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={d.debit}
                          onChange={(e) => setDraft(r.code, "debit", e.target.value)}
                          placeholder="0"
                          className="w-full h-8 rounded-md border border-slate-200 px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-brand-600"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={d.credit}
                          onChange={(e) => setDraft(r.code, "credit", e.target.value)}
                          placeholder="0"
                          className="w-full h-8 rounded-md border border-slate-200 px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-brand-600"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {isDirty && (
                          <button
                            type="button"
                            onClick={() => handleClear(r.code)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            Undo
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Only rows you've edited (highlighted) are saved when you press Save.
        An account should carry either a debit or a credit, not both.
      </p>
    </PopupWindow>
  );
}
