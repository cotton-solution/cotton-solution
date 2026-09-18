"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { saveJournalVoucher } from "@/lib/supabase/vouchers";
import { useAccountDirectory } from "@/lib/hooks/use-account-directory";
import { useDocumentNumber } from "@/lib/hooks/use-document-number";

type JournalLine = {
  id: string;
  account: string;
  debit: number;
  credit: number;
};

function newLine(defaultAccount = ""): JournalLine {
  return {
    id: Math.random().toString(36).slice(2, 9),
    account: defaultAccount,
    debit: 0,
    credit: 0,
  };
}

export function JournalVoucherForm() {
  const { number: voucherNo, ready: numberReady } = useDocumentNumber(
    "JV",
    "vouchers",
    "voucher_no"
  );
  const { accounts, loading: accountsLoading } = useAccountDirectory();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([newLine(), newLine()]);

  // Once the real Chart of Accounts loads, point any still-empty lines
  // at its first account instead of leaving them unset.
  useEffect(() => {
    if (accounts.length === 0) return;
    setLines((prev) =>
      prev.map((l) => (l.account ? l : { ...l, account: accounts[0].code }))
    );
  }, [accounts]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalDebit = useMemo(
    () => lines.reduce((s, l) => s + l.debit, 0),
    [lines]
  );
  const totalCredit = useMemo(
    () => lines.reduce((s, l) => s + l.credit, 0),
    [lines]
  );
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  function updateLine(id: string, patch: Partial<JournalLine>) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
    setSaved(false);
  }

  function addLine() {
    setLines((prev) => [...prev, newLine(accounts[0]?.code ?? "")]);
    setSaved(false);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 2 ? prev.filter((l) => l.id !== id) : prev));
    setSaved(false);
  }

  async function handleSave() {
    if (!isBalanced) return;
    setError(null);
    setSaving(true);
    const { error } = await saveJournalVoucher(
      { voucherNo, date, narration },
      lines.map((l) => ({ account: l.account, debit: l.debit, credit: l.credit }))
    );
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Journal Voucher
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Voucher #{" "}
            <span className="font-medium text-slate-700">
              {numberReady ? voucherNo : "Assigning…"}
            </span>
          </p>
        </div>
        {saved && (
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
            Saved
          </span>
        )}
      </div>

      <DataModeBanner />

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
          <CircleAlert size={14} />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="jv-date">Date</Label>
            <Input
              id="jv-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div>
            <Label htmlFor="jv-narration">Narration</Label>
            <Input
              id="jv-narration"
              value={narration}
              onChange={(e) => {
                setNarration(e.target.value);
                setSaved(false);
              }}
              placeholder="Reason for this entry"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Account
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600 w-32">
                    Debit
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600 w-32">
                    Credit
                  </th>
                  <th className="px-2 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">
                      <Select
                        value={line.account}
                        disabled={accountsLoading || accounts.length === 0}
                        onChange={(e) =>
                          updateLine(line.id, { account: e.target.value })
                        }
                        className="h-9"
                      >
                        {accounts.length === 0 && (
                          <option value="">
                            {accountsLoading ? "Loading accounts…" : "No accounts yet"}
                          </option>
                        )}
                        {accounts.map((a) => (
                          <option key={a.code} value={a.code}>
                            {a.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={line.debit || ""}
                        onChange={(e) =>
                          updateLine(line.id, {
                            debit: parseFloat(e.target.value) || 0,
                            credit: 0,
                          })
                        }
                        className="h-9 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={line.credit || ""}
                        onChange={(e) =>
                          updateLine(line.id, {
                            credit: parseFloat(e.target.value) || 0,
                            debit: 0,
                          })
                        }
                        className="h-9 text-right"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => removeLine(line.id)}
                        aria-label="Remove line"
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-medium text-slate-900">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totalDebit.toLocaleString("en-PK")}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {totalCredit.toLocaleString("en-PK")}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="border-t border-slate-200 px-3 py-2 bg-slate-50">
            <button
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              <Plus size={16} />
              Add line
            </button>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            isBalanced
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isBalanced ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {isBalanced
            ? "Entry is balanced."
            : `Debit and credit must be equal before saving (difference: ${Math.abs(
                totalDebit - totalCredit
              ).toLocaleString("en-PK")}).`}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button onClick={handleSave} disabled={!isBalanced || saving}>
          {saving ? "Saving…" : "Save Voucher"}
        </Button>
      </div>
    </div>
  );
}
