"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, CircleAlert, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchBankAccounts,
  fetchReconciliations,
  saveReconciliation,
  demoBankAccounts,
  demoReconciliations,
  type BankAccount,
  type Reconciliation,
} from "@/lib/supabase/banking";
import { formatAmount, formatDayMonth } from "@/lib/format";
import { RecordsTable, type Column } from "@/components/records-table";

export default function ReconciliationPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>(isSupabaseConfigured ? [] : demoBankAccounts);
  const [rows, setRows] = useState<Reconciliation[]>(isSupabaseConfigured ? [] : demoReconciliations);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(false);
  const [bankAccountId, setBankAccountId] = useState("");
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [statementBalance, setStatementBalance] = useState(0);
  const [bookBalance, setBookBalance] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    Promise.all([fetchBankAccounts(), fetchReconciliations()]).then(([a, r]) => {
      setAccounts(a);
      setRows(r);
      setLoading(false);
    });
  };
  useEffect(refresh, []);

  useEffect(() => {
    if (!bankAccountId && accounts.length) setBankAccountId(accounts[0].id);
  }, [accounts, bankAccountId]);

  const difference = useMemo(() => statementBalance - bookBalance, [statementBalance, bookBalance]);

  async function handleSave() {
    if (!bankAccountId) {
      setError("Choose a bank account.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await saveReconciliation({
      bankAccountId,
      statementDate,
      statementBalance,
      bookBalance,
      status: Math.abs(difference) < 0.01 ? "reconciled" : "open",
      notes: notes || null,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setShowForm(false);
    setStatementBalance(0);
    setBookBalance(0);
    setNotes("");
    refresh();
  }

  const accountName = (id: string) => accounts.find((a) => a.id === id)?.accountName ?? id;

  const columns: Column<Reconciliation>[] = [
    { key: "date", header: "Statement Date", render: (r) => formatDayMonth(r.statementDate), searchValue: (r) => r.statementDate },
    { key: "account", header: "Bank Account", render: (r) => accountName(r.bankAccountId), searchValue: (r) => accountName(r.bankAccountId) },
    { key: "stmt", header: "Statement Balance", align: "right", render: (r) => <span className="figure">Rs {formatAmount(r.statementBalance)}</span> },
    { key: "book", header: "Book Balance", align: "right", render: (r) => <span className="figure">Rs {formatAmount(r.bookBalance)}</span> },
    {
      key: "diff",
      header: "Difference",
      align: "right",
      render: (r) => {
        const diff = r.statementBalance - r.bookBalance;
        return (
          <span className={`figure font-medium ${Math.abs(diff) < 0.01 ? "text-money-in" : "text-money-out"}`}>
            Rs {formatAmount(Math.abs(diff))}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${r.status === "reconciled" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {r.status === "reconciled" && <CheckCircle2 size={11} />}
          {r.status === "reconciled" ? "Reconciled" : "Open"}
        </span>
      ),
      searchValue: (r) => r.status,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bank Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">Match your books against the bank statement.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="shrink-0" disabled={!accounts.length}>
          <Plus size={16} /> New Reconciliation
        </Button>
      </div>

      <DataModeBanner demoMessage="Demo mode — entries are in-memory only. Connect Supabase to persist them (see README)." />

      {!accounts.length && !loading && (
        <div className="rounded-lg bg-amber-50 text-amber-700 text-xs font-medium px-3 py-2">
          Link a bank account first, from Banking → Bank Accounts.
        </div>
      )}

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Bank Account</Label>
              <Select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountName}</option>)}
              </Select>
            </div>
            <div>
              <Label>Statement Date</Label>
              <Input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
            </div>
            <div>
              <Label>Statement Balance (from bank)</Label>
              <Input type="number" value={statementBalance || ""} onChange={(e) => setStatementBalance(Number(e.target.value))} />
            </div>
            <div>
              <Label>Book Balance (your records)</Label>
              <Input type="number" value={bookBalance || ""} onChange={(e) => setBookBalance(Number(e.target.value))} />
            </div>
          </div>

          <div className={`rounded-lg px-3 py-2 text-xs font-medium ${Math.abs(difference) < 0.01 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            Difference: Rs {formatAmount(Math.abs(difference))}
            {Math.abs(difference) < 0.01 ? " — balances match" : " — outstanding items to track down"}
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. two cheques still outstanding" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Reconciliation"}</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <RecordsTable rows={rows} columns={columns} loading={loading} searchPlaceholder="Search reconciliations…" emptyLabel="No reconciliations recorded yet." />
      </div>
    </div>
  );
}
