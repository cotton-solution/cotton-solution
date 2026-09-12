"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { mockParties } from "@/lib/party-data";
import { saveInvoice, type InvoiceCategory } from "@/lib/supabase/invoices";

type LineItem = {
  id: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
};

const units = ["Maund", "KG", "Bags", "Bales"];

function newLine(): LineItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    description: "",
    unit: units[0],
    qty: 0,
    rate: 0,
  };
}

export function InvoiceForm({
  title,
  invoicePrefix,
  category,
  invoiceType,
  partyLabel,
  includeBrokerage,
}: {
  title: string;
  invoicePrefix: string;
  category: InvoiceCategory;
  invoiceType: "purchase" | "sale";
  partyLabel: "Vendor" | "Customer";
  includeBrokerage: boolean;
}) {
  const [invoiceNo] = useState(`${invoicePrefix}-${Math.floor(1000 + Math.random() * 8999)}`);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState(mockParties[0]?.id ?? "");
  const [brokeragePercent, setBrokeragePercent] = useState(1);
  const [lines, setLines] = useState<LineItem[]>([newLine()]);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty * l.rate, 0),
    [lines]
  );
  const brokerageAmount = includeBrokerage
    ? Math.round((subtotal * brokeragePercent) / 100)
    : 0;
  const grandTotal = subtotal - brokerageAmount;

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
    setSaved(false);
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
    setSaved(false);
  }

  function removeLine(id: string) {
    setLines((prev) =>
      prev.length > 1 ? prev.filter((l) => l.id !== id) : prev
    );
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const { error } = await saveInvoice({
      invoiceNo,
      category,
      invoiceType,
      invoiceDate: date,
      partyId,
      subtotal,
      brokeragePercent: includeBrokerage ? brokeragePercent : 0,
      brokerageAmount,
      netTotal: grandTotal,
      notes,
      lines: lines.map((l) => ({
        description: l.description,
        unit: l.unit,
        qty: l.qty,
        rate: l.rate,
      })),
    });
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
            Invoice # <span className="font-medium text-slate-700">{invoiceNo}</span>
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

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="inv-date">Date</Label>
            <Input
              id="inv-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="inv-party">{partyLabel}</Label>
            <Select
              id="inv-party"
              value={partyId}
              onChange={(e) => {
                setPartyId(e.target.value);
                setSaved(false);
              }}
            >
              {mockParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-2 text-left font-medium text-slate-600">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 w-28">
                    Unit
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600 w-24">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600 w-32">
                    Rate
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600 w-32">
                    Amount
                  </th>
                  <th className="px-2 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2">
                      <Input
                        value={line.description}
                        placeholder="Item description"
                        onChange={(e) =>
                          updateLine(line.id, { description: e.target.value })
                        }
                        className="h-9"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={line.unit}
                        onChange={(e) =>
                          updateLine(line.id, { unit: e.target.value })
                        }
                        className="h-9"
                      >
                        {units.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={line.qty || ""}
                        onChange={(e) =>
                          updateLine(line.id, {
                            qty: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-9 text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={line.rate || ""}
                        onChange={(e) =>
                          updateLine(line.id, {
                            rate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-9 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {(line.qty * line.rate).toLocaleString("en-PK")}
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

        {/* Totals */}
        <div className="flex flex-col items-end gap-2 pt-2">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {subtotal.toLocaleString("en-PK")}
              </span>
            </div>
            {includeBrokerage && (
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-2">
                  Brokerage
                  <Input
                    type="number"
                    min={0}
                    step={0.25}
                    value={brokeragePercent}
                    onChange={(e) =>
                      setBrokeragePercent(parseFloat(e.target.value) || 0)
                    }
                    className="h-8 w-16 text-right"
                  />
                  %
                </span>
                <span className="tabular-nums">
                  ({brokerageAmount.toLocaleString("en-PK")})
                </span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-2">
              <span>Net Total</span>
              <span className="tabular-nums">
                {grandTotal.toLocaleString("en-PK")}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
            }}
            placeholder="Optional narration for this invoice"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
