"use client";

import { useEffect, useState } from "react";
import { Plus, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchBankAccounts,
  saveBankAccount,
  demoBankAccounts,
  type BankAccount,
} from "@/lib/supabase/banking";
import { formatAmount } from "@/lib/format";
import { RecordsTable, type Column } from "@/components/records-table";

const emptyForm: Omit<BankAccount, "id"> = {
  accountName: "",
  bankName: "",
  accountNumber: "",
  branch: "",
  openingBalance: 0,
  isActive: true,
};

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>(
    isSupabaseConfigured ? [] : demoBankAccounts
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    fetchBankAccounts().then((rows) => {
      setAccounts(rows);
      setLoading(false);
    });
  };
  useEffect(refresh, []);

  async function handleSave() {
    if (!form.accountName.trim() || !form.bankName.trim()) {
      setError("Account name and bank name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await saveBankAccount(form);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  }

  const columns: Column<BankAccount>[] = [
    {
      key: "name",
      header: "Account",
      searchValue: (r) => `${r.accountName} ${r.bankName} ${r.accountNumber ?? ""}`,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.accountName}</p>
          <p className="text-xs text-slate-500">{r.bankName}{r.branch ? ` · ${r.branch}` : ""}</p>
        </div>
      ),
    },
    { key: "number", header: "Account #", render: (r) => r.accountNumber || "—" },
    {
      key: "balance",
      header: "Opening Balance",
      align: "right",
      render: (r) => <span className="figure">Rs {formatAmount(r.openingBalance)}</span>,
      searchValue: (r) => String(r.openingBalance),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {r.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bank Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">Link the accounts your business banks with.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="shrink-0">
          <Plus size={16} /> Link Account
        </Button>
      </div>

      <DataModeBanner
        demoMessage="Demo mode — accounts are in-memory only. Connect Supabase to persist them (see README)."
      />

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Account Name</Label>
              <Input value={form.accountName} onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))} placeholder="e.g. Main Operating Account" />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="e.g. Meezan Bank" />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={form.accountNumber ?? ""} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div>
              <Label>Branch</Label>
              <Input value={form.branch ?? ""} onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))} />
            </div>
            <div>
              <Label>Opening Balance</Label>
              <Input type="number" value={form.openingBalance || ""} onChange={(e) => setForm((f) => ({ ...f, openingBalance: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              <Label className="mb-0">Active</Label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Account"}</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <RecordsTable rows={accounts} columns={columns} loading={loading} searchPlaceholder="Search accounts…" emptyLabel="No bank accounts linked yet." />
      </div>
    </div>
  );
}
