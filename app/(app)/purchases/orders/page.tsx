"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchPurchaseOrders,
  savePurchaseOrder,
  setPurchaseOrderStatus,
  demoPurchaseOrders,
  type PurchaseOrder,
  type POLine,
} from "@/lib/supabase/purchase-orders";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";
import { useDocumentNumber } from "@/lib/hooks/use-document-number";
import { formatAmount, formatDayMonth } from "@/lib/format";
import { RecordsTable, FilterChip, AmountCell } from "@/components/records-table";

const units = ["Pcs", "KG", "Box", "Hours", "Unit"];

function newLine(): POLine {
  return { id: Math.random().toString(36).slice(2, 9), description: "", unit: units[0], qty: 0, rate: 0 };
}

const STATUS_STYLES: Record<PurchaseOrder["status"], string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  received: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function PurchaseOrdersPage() {
  const { number: poNo, ready: numberReady } = useDocumentNumber("PO", "purchase_orders", "po_no");
  const { parties, loading: partiesLoading } = usePartyDirectory();
  const vendors = useMemo(() => parties.filter((p) => p.canAlsoBeVendor), [parties]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState("");
  const [partyId, setPartyId] = useState("");
  const [lines, setLines] = useState<POLine[]>([newLine()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseOrder["status"]>("all");

  useEffect(() => {
    const source = vendors.length ? vendors : parties;
    if (!source.length) return;
    setPartyId((cur) => cur || source[0].id);
  }, [vendors, parties]);

  const refresh = () => {
    setLoading(true);
    (isSupabaseConfigured ? fetchPurchaseOrders() : Promise.resolve(demoPurchaseOrders))
      .then(setRows)
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.qty * l.rate, 0), [lines]);

  function updateLine(id: string, patch: Partial<POLine>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await savePurchaseOrder(
      {
        poNo,
        poDate: date,
        partyId: partyId || null,
        subtotal,
        netTotal: subtotal,
        status: "draft",
        expectedDate: expectedDate || null,
        notes: notes || null,
      },
      lines.filter((l) => l.description.trim()).map(({ id, ...rest }) => rest)
    );
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setSaved(true);
    setLines([newLine()]);
    setNotes("");
    refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
  const source = vendors.length ? vendors : parties;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Purchase Orders</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate an official procurement order to send to a vendor.
        </p>
      </div>

      <DataModeBanner />

      <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <Label>PO #</Label>
            <Input value={numberReady ? poNo : "…"} disabled />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Expected By</Label>
            <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </div>
          <div>
            <Label>Vendor</Label>
            <Select value={partyId} onChange={(e) => setPartyId(e.target.value)} disabled={partiesLoading}>
              {source.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="mb-0">Line items</Label>
            <Button type="button" variant="secondary" onClick={() => setLines((ls) => [...ls, newLine()])}>
              <Plus size={14} /> Add line
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.id} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_120px_36px] gap-2 items-end">
                <Input placeholder="Description" value={l.description} onChange={(e) => updateLine(l.id, { description: e.target.value })} />
                <Select value={l.unit} onChange={(e) => updateLine(l.id, { unit: e.target.value })}>
                  {units.map((u) => <option key={u}>{u}</option>)}
                </Select>
                <Input type="number" placeholder="Qty" value={l.qty || ""} onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) })} />
                <Input type="number" placeholder="Rate" value={l.rate || ""} onChange={(e) => updateLine(l.id, { rate: Number(e.target.value) })} />
                <button
                  type="button"
                  onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.id !== l.id) : ls))}
                  className="h-10 flex items-center justify-center text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
            <CircleAlert size={14} /> {error}
          </div>
        )}

        <div className="flex items-center justify-between rule-t pt-4">
          <p className="text-sm text-slate-500">
            Total: <span className="figure font-semibold text-slate-900">Rs {formatAmount(subtotal)}</span>
          </p>
          <Button onClick={handleSave} disabled={saving || !numberReady}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Purchase Order"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-[14px] font-semibold text-slate-900">Purchase Orders</h2>
        </div>
        <RecordsTable
          rows={filtered}
          loading={loading}
          searchPlaceholder="Search purchase orders…"
          emptyLabel="No purchase orders yet."
          filters={
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "draft", "sent", "received", "cancelled"] as const).map((s) => (
                <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
                </FilterChip>
              ))}
            </div>
          }
          columns={[
            { key: "date", header: "Date", render: (r) => formatDayMonth(r.poDate), searchValue: (r) => r.poDate },
            { key: "no", header: "PO #", render: (r) => <span className="font-medium text-slate-900">{r.poNo}</span>, searchValue: (r) => r.poNo },
            { key: "party", header: "Vendor", render: (r) => parties.find((p) => p.id === r.partyId)?.name ?? r.partyId ?? "—" },
            {
              key: "status", header: "Status",
              render: (r) => <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>,
              searchValue: (r) => r.status,
            },
            { key: "total", header: "Amount", align: "right", render: (r) => <AmountCell value={r.netTotal} />, searchValue: (r) => String(r.netTotal) },
            {
              key: "actions", header: "",
              render: (r) =>
                r.status === "draft" || r.status === "sent" ? (
                  <button
                    onClick={async (e) => { e.stopPropagation(); await setPurchaseOrderStatus(r.id, r.status === "draft" ? "sent" : "received"); refresh(); }}
                    className="text-[11px] font-medium text-brand-700 hover:underline"
                  >
                    Mark {r.status === "draft" ? "sent" : "received"}
                  </button>
                ) : null,
            },
          ]}
        />
      </section>
    </div>
  );
}
