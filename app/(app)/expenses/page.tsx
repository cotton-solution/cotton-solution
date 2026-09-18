"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchExpenses,
  saveExpense,
  demoExpenses,
  EXPENSE_CATEGORIES,
  type Expense,
} from "@/lib/supabase/expenses";
import { formatAmount, formatDayMonth } from "@/lib/format";
import { RecordsTable, FilterChip, type Column } from "@/components/records-table";

const PAYMENT_LABELS: Record<Expense["paymentMethod"], string> = {
  cash: "Cash",
  bank: "Bank",
  credit_card: "Credit Card",
};

export default function ExpensesPage() {
  const [rows, setRows] = useState<Expense[]>(isSupabaseConfigured ? [] : demoExpenses);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Expense["paymentMethod"]>("cash");
  const [notes, setNotes] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    fetchExpenses().then((r) => { setRows(r); setLoading(false); });
  };
  useEffect(refresh, []);

  async function handleSave() {
    if (!amount) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await saveExpense({
      expenseDate: date, category, amount, paymentMethod, notes: notes || null, receiptNote: receiptNote || null,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    setAmount(0);
    setNotes("");
    setReceiptNote("");
    setShowForm(false);
    refresh();
  }

  const categories = useMemo(() => ["all", ...EXPENSE_CATEGORIES], []);
  const filtered = categoryFilter === "all" ? rows : rows.filter((r) => r.category === categoryFilter);

  const columns: Column<Expense>[] = [
    { key: "date", header: "Date", render: (r) => formatDayMonth(r.expenseDate), searchValue: (r) => r.expenseDate },
    { key: "category", header: "Category", render: (r) => <span className="font-medium text-slate-900">{r.category}</span>, searchValue: (r) => r.category },
    { key: "method", header: "Paid Via", render: (r) => PAYMENT_LABELS[r.paymentMethod] },
    { key: "notes", header: "Notes", render: (r) => r.notes || "—" },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="figure font-medium text-money-out">Rs {formatAmount(r.amount)}</span>, searchValue: (r) => String(r.amount) },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">Category-wise daily business expenses.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="shrink-0"><Plus size={16} /> Add Expense</Button>
      </div>

      <DataModeBanner demoMessage="Demo mode — expenses are in-memory only. Connect Supabase to persist them (see README)." />

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label>Paid Via</Label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as Expense["paymentMethod"])}>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="credit_card">Credit Card</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" />
            </div>
            <div className="sm:col-span-2">
              <Label>Receipt Note</Label>
              <Input value={receiptNote} onChange={(e) => setReceiptNote(e.target.value)} placeholder="e.g. Receipt filed, invoice #, attachment reference" />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700"><CircleAlert size={14} /> {error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Expense"}</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {categories.map((c) => (
              <FilterChip key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
                {c === "all" ? "All" : c}
              </FilterChip>
            ))}
          </div>
        </div>
        <RecordsTable
          rows={filtered}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search expenses…"
          emptyLabel="No expenses recorded yet."
          footer={(visible) => (
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-slate-500">{visible.length} expense{visible.length === 1 ? "" : "s"}</span>
              <span className="text-slate-700">Total <span className="figure font-medium">Rs {formatAmount(visible.reduce((s, r) => s + r.amount, 0))}</span></span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
