"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { saveInvoiceBatch } from "@/lib/supabase/invoice-batches";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";

type BatchRow = {
  id: string;
  partyId: string;
  invoiceType: "Purchase" | "Sale";
  amount: number;
};

function newRow(defaultPartyId = ""): BatchRow {
  return {
    id: Math.random().toString(36).slice(2, 9),
    partyId: defaultPartyId,
    invoiceType: "Sale",
    amount: 0,
  };
}

export function MultiInvoiceForm({ title }: { title: string }) {
  const { parties, loading: partiesLoading } = usePartyDirectory();
  const [rows, setRows] = useState<BatchRow[]>([newRow(), newRow()]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Point any still-unset rows at the first real party once loaded.
  useEffect(() => {
    if (parties.length === 0) return;
    setRows((prev) =>
      prev.map((r) => (r.partyId ? r : { ...r, partyId: parties[0].id }))
    );
  }, [parties]);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + r.amount, 0),
    [rows]
  );

  function updateRow(id: string, patch: Partial<BatchRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  function addRow() {
    setRows((prev) => [...prev, newRow(parties[0]?.id ?? "")]);
    setSaved(false);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    setSaved(false);
  }

  async function handleSaveBatch() {
    if (rows.some((r) => !r.partyId)) {
      setError("Add a party in Party Master first.");
      return;
    }
    setError(null);
    setSaving(true);
    const { error } = await saveInvoiceBatch(
      title,
      rows.map((r) => ({
        partyId: r.partyId,
        invoiceType: r.invoiceType,
        amount: r.amount,
      }))
    );
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter multiple invoices at once, then save the batch together.
          </p>
        </div>
        {saved && (
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
            Batch saved
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Party
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 w-40">
                  Type
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 w-40">
                  Amount
                </th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2.5">
                    <Select
                      value={row.partyId}
                      disabled={partiesLoading || parties.length === 0}
                      onChange={(e) =>
                        updateRow(row.id, { partyId: e.target.value })
                      }
                      className="h-9"
                    >
                      {parties.length === 0 && (
                        <option value="">
                          {partiesLoading ? "Loading…" : "No parties yet"}
                        </option>
                      )}
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-2.5">
                    <Select
                      value={row.invoiceType}
                      onChange={(e) =>
                        updateRow(row.id, {
                          invoiceType: e.target.value as "Purchase" | "Sale",
                        })
                      }
                      className="h-9"
                    >
                      <option>Sale</option>
                      <option>Purchase</option>
                    </Select>
                  </td>
                  <td className="px-4 py-2.5">
                    <Input
                      type="number"
                      min={0}
                      value={row.amount || ""}
                      onChange={(e) =>
                        updateRow(row.id, {
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-9 text-right"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove row"
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700" colSpan={2}>
                  Total
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                  {total.toLocaleString("en-PK")}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-2.5">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <Plus size={16} />
            Add invoice row
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSaveBatch} disabled={saving || parties.length === 0}>
          {saving ? "Saving…" : "Save Batch"}
        </Button>
      </div>
    </div>
  );
}
