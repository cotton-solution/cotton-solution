"use client";

import { useEffect, useState } from "react";
import { Plus, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchWarehouses, saveWarehouse, demoWarehouses, type Warehouse } from "@/lib/supabase/inventory";
import { RecordsTable, type Column } from "@/components/records-table";

export default function WarehousesPage() {
  const [rows, setRows] = useState<Warehouse[]>(isSupabaseConfigured ? [] : demoWarehouses);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    fetchWarehouses().then((r) => { setRows(r); setLoading(false); });
  };
  useEffect(refresh, []);

  async function handleSave() {
    if (!name.trim()) {
      setError("Warehouse name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await saveWarehouse({ name, location: location || null, isActive: true });
    setSaving(false);
    if (err) { setError(err); return; }
    setName("");
    setLocation("");
    setShowForm(false);
    refresh();
  }

  const columns: Column<Warehouse>[] = [
    { key: "name", header: "Warehouse", render: (r) => <span className="font-medium text-slate-900">{r.name}</span>, searchValue: (r) => r.name },
    { key: "location", header: "Location", render: (r) => r.location || "—" },
    {
      key: "status", header: "Status",
      render: (r) => <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.isActive ? "Active" : "Inactive"}</span>,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Warehouses</h1>
          <p className="text-sm text-slate-500 mt-1">The locations you hold stock at.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="shrink-0"><Plus size={16} /> Add Warehouse</Button>
      </div>

      <DataModeBanner demoMessage="Demo mode — warehouses are in-memory only. Connect Supabase to persist them (see README)." />

      {showForm && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Warehouse Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Warehouse" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lahore" />
            </div>
          </div>
          {error && <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700"><CircleAlert size={14} /> {error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Warehouse"}</Button>
          </div>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <RecordsTable rows={rows} columns={columns} loading={loading} searchPlaceholder="Search warehouses…" emptyLabel="No warehouses added yet." />
      </div>
    </div>
  );
}
