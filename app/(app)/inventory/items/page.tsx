"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, CircleAlert, TriangleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchItems,
  saveItem,
  fetchStockMovements,
  onHandByItem,
  demoItems,
  demoStockMovements,
  type InventoryItem,
} from "@/lib/supabase/inventory";
import { formatAmount } from "@/lib/format";
import { RecordsTable, type Column } from "@/components/records-table";

const units = ["Pcs", "KG", "Box", "Unit", "Ltr"];

export default function ItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>(isSupabaseConfigured ? [] : demoItems);
  const [onHand, setOnHand] = useState<Record<string, number>>(
    isSupabaseConfigured ? {} : onHandByItem(demoStockMovements)
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sku: "", name: "", unit: units[0], reorderLevel: 0, unitCost: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    Promise.all([fetchItems(), fetchStockMovements()]).then(([i, m]) => {
      setItems(i);
      setOnHand(onHandByItem(m));
      setLoading(false);
    });
  };
  useEffect(refresh, []);

  const rows = useMemo(
    () => items.map((it) => ({ ...it, onHand: onHand[it.id] ?? 0 })),
    [items, onHand]
  );

  async function handleSave() {
    if (!form.sku.trim() || !form.name.trim()) {
      setError("SKU and item name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await saveItem({ ...form, isActive: true });
    setSaving(false);
    if (err) { setError(err); return; }
    setForm({ sku: "", name: "", unit: units[0], reorderLevel: 0, unitCost: 0 });
    setShowForm(false);
    refresh();
  }

  const columns: Column<InventoryItem>[] = [
    {
      key: "name", header: "Item",
      searchValue: (r) => `${r.name} ${r.sku}`,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="text-xs text-slate-500">{r.sku}</p>
        </div>
      ),
    },
    { key: "unit", header: "Unit", render: (r) => r.unit },
    {
      key: "onHand", header: "On Hand", align: "right",
      render: (r) => {
        const low = (r.onHand ?? 0) <= r.reorderLevel;
        return (
          <span className={`figure font-medium inline-flex items-center gap-1 ${low ? "text-money-out" : "text-slate-900"}`}>
            {low && <TriangleAlert size={12} />}
            {r.onHand ?? 0}
          </span>
        );
      },
      searchValue: (r) => String(r.onHand ?? 0),
    },
    { key: "reorder", header: "Reorder Level", align: "right", render: (r) => <span className="figure text-slate-500">{r.reorderLevel}</span> },
    { key: "cost", header: "Unit Cost", align: "right", render: (r) => <span className="figure">Rs {formatAmount(r.unitCost)}</span> },
  ];

  const lowStockCount = rows.filter((r) => (r.onHand ?? 0) <= r.reorderLevel).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Items Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">SKUs, units and reorder levels.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="shrink-0"><Plus size={16} /> Add Item</Button>
      </div>

      <DataModeBanner demoMessage="Demo mode — items are in-memory only. Connect Supabase to persist them (see README)." />

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-amber-50 text-amber-700">
          <TriangleAlert size={14} />
          {lowStockCount} item{lowStockCount > 1 ? "s are" : " is"} at or below its reorder level.
        </div>
      )}

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="e.g. SKU-1004" /></div>
            <div><Label>Item Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div>
              <Label>Unit</Label>
              <Select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                {units.map((u) => <option key={u}>{u}</option>)}
              </Select>
            </div>
            <div><Label>Reorder Level</Label><Input type="number" value={form.reorderLevel || ""} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))} /></div>
            <div><Label>Unit Cost</Label><Input type="number" value={form.unitCost || ""} onChange={(e) => setForm((f) => ({ ...f, unitCost: Number(e.target.value) }))} /></div>
          </div>
          {error && <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700"><CircleAlert size={14} /> {error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Item"}</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <RecordsTable rows={rows} columns={columns} loading={loading} searchPlaceholder="Search items…" emptyLabel="No items in the catalog yet." />
      </div>
    </div>
  );
}
