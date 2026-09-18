"use client";

import { useEffect, useState } from "react";
import { Plus, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchCreditCards,
  saveCreditCard,
  demoCreditCards,
  type CreditCard,
} from "@/lib/supabase/banking";
import { formatAmount } from "@/lib/format";
import { RecordsTable, type Column } from "@/components/records-table";

const emptyForm: Omit<CreditCard, "id"> = {
  cardName: "",
  bankName: "",
  lastFour: "",
  creditLimit: 0,
  currentBalance: 0,
  statementDay: 1,
  isActive: true,
};

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>(
    isSupabaseConfigured ? [] : demoCreditCards
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    fetchCreditCards().then((rows) => {
      setCards(rows);
      setLoading(false);
    });
  };
  useEffect(refresh, []);

  async function handleSave() {
    if (!form.cardName.trim() || !form.bankName.trim()) {
      setError("Card name and bank name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await saveCreditCard(form);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    refresh();
  }

  const columns: Column<CreditCard>[] = [
    {
      key: "name",
      header: "Card",
      searchValue: (r) => `${r.cardName} ${r.bankName} ${r.lastFour ?? ""}`,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.cardName}</p>
          <p className="text-xs text-slate-500">{r.bankName}{r.lastFour ? ` · •••• ${r.lastFour}` : ""}</p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Current Balance",
      align: "right",
      render: (r) => <span className="figure">Rs {formatAmount(r.currentBalance)}</span>,
      searchValue: (r) => String(r.currentBalance),
    },
    {
      key: "limit",
      header: "Limit",
      align: "right",
      render: (r) => <span className="figure text-slate-500">Rs {formatAmount(r.creditLimit)}</span>,
      searchValue: (r) => String(r.creditLimit),
    },
    {
      key: "statement",
      header: "Statement Day",
      render: (r) => (r.statementDay ? `Day ${r.statementDay}` : "—"),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Credit Cards</h1>
          <p className="text-sm text-slate-500 mt-1">Track company card spend and statement clearances.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="shrink-0">
          <Plus size={16} /> Add Card
        </Button>
      </div>

      <DataModeBanner demoMessage="Demo mode — cards are in-memory only. Connect Supabase to persist them (see README)." />

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Card Name</Label>
              <Input value={form.cardName} onChange={(e) => setForm((f) => ({ ...f, cardName: e.target.value }))} placeholder="e.g. Business Platinum" />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div>
              <Label>Last 4 Digits</Label>
              <Input maxLength={4} value={form.lastFour ?? ""} onChange={(e) => setForm((f) => ({ ...f, lastFour: e.target.value }))} />
            </div>
            <div>
              <Label>Statement Day (1–31)</Label>
              <Input type="number" min={1} max={31} value={form.statementDay ?? ""} onChange={(e) => setForm((f) => ({ ...f, statementDay: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Credit Limit</Label>
              <Input type="number" value={form.creditLimit || ""} onChange={(e) => setForm((f) => ({ ...f, creditLimit: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Current Balance</Label>
              <Input type="number" value={form.currentBalance || ""} onChange={(e) => setForm((f) => ({ ...f, currentBalance: Number(e.target.value) }))} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Card"}</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <RecordsTable rows={cards} columns={columns} loading={loading} searchPlaceholder="Search cards…" emptyLabel="No credit cards added yet." />
      </div>
    </div>
  );
}
