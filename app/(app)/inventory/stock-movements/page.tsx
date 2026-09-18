"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, CircleAlert, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchItems,
  fetchWarehouses,
  fetchStockMovements,
  saveStockMovement,
  demoItems,
  demoWarehouses,
  demoStockMovements,
  type InventoryItem,
  type Warehouse,
  type StockMovement,
} from "@/lib/supabase/inventory";
import { formatDayMonth } from "@/lib/format";
import { RecordsTable, FilterChip, type Column } from "@/components/records-table";

export default function StockMovementsPage() {
  const [items, setItems] = useState<InventoryItem[]>(isSupabaseConfigured ? [] : demoItems);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(isSupabaseConfigured ? [] : demoWarehouses);
  const [rows, setRows] = useState<StockMovement[]>(isSupabaseConfigured ? [] : demoStockMovements);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out">("all");

  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [movementType, setMovementType] = useState<"in" | "out">("in");
  const [qty, setQty] = useState(0);
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    Promise.all([fetchItems(), fetchWarehouses(), fetchStockMovements()]).then(([i, w, m]) => {
      setItems(i);
      setWarehouses(w);
      setRows(m);
      setLoading(false);
    });
  };
  useEffect(refresh, []);

  useEffect(() => {
    if (!itemId && items.length) setItemId(items[0].id);
    if (!warehouseId && warehouses.length) setWarehouseId(warehouses[0].id);
  }, [items, warehouses, itemId, warehouseId]);

  async function handleSave() {
    if (!itemId || !qty) {
      setError("Choose an item and a quantity greater than zero.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await saveStockMovement({
      itemId, warehouseId: warehouseId || null, movementType, qty, reference: reference || null, notes: null, movementDate: date,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    setQty(0);
    setReference("");
    setShowForm(false);
    refresh();
  }

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;
  const warehouseName = (id: string | null) => (id ? warehouses.find((w) => w.id === id)?.name ?? id : "—");

  const filtered = typeFilter === "all" ? rows : rows.filter((r) => r.movementType === typeFilter);

  const columns: Column<StockMovement>[] = [
    { key: "date", header: "Date", render: (r) => formatDayMonth(r.movementDate), searchValue: (r) => r.movementDate },
    { key: "item", header: "Item", render: (r) => itemName(r.itemId), searchValue: (r) => itemName(r.itemId) },
    { key: "warehouse", header: "Warehouse", render: (r) => warehouseName(r.warehouseId) },
    {
      key: "type", header: "Type",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${r.movementType === "in" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-money-out"}`}>
          {r.movementType === "in" ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
          {r.movementType === "in" ? "Stock In" : "Stock Out"}
        </span>
      ),
      searchValue: (r) => r.movementType,
    },
    { key: "qty", header: "Qty", align: "right", render: (r) => <span className="figure font-medium">{r.qty}</span> },
    { key: "ref", header: "Reference", render: (r) => r.reference || "—" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Stock Movements</h1>
          <p className="text-sm text-slate-500 mt-1">Every stock-in and stock-out against your items.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="shrink-0" disabled={!items.length}><Plus size={16} /> Record Movement</Button>
      </div>

      <DataModeBanner demoMessage="Demo mode — movements are in-memory only. Connect Supabase to persist them (see README)." />

      {!items.length && !loading && (
        <div className="rounded-lg bg-amber-50 text-amber-700 text-xs font-medium px-3 py-2">
          Add an item first, from Inventory → Items Catalog.
        </div>
      )}

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Item</Label>
              <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Warehouse</Label>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Movement</Label>
              <Select value={movementType} onChange={(e) => setMovementType(e.target.value as "in" | "out")}>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. BILL-4821" />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700"><CircleAlert size={14} /> {error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Movement"}</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1.5">
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All</FilterChip>
            <FilterChip active={typeFilter === "in"} onClick={() => setTypeFilter("in")}>Stock In</FilterChip>
            <FilterChip active={typeFilter === "out"} onClick={() => setTypeFilter("out")}>Stock Out</FilterChip>
          </div>
        </div>
        <RecordsTable rows={filtered} columns={columns} loading={loading} searchPlaceholder="Search movements…" emptyLabel="No stock movements recorded yet." />
      </div>
    </div>
  );
}
