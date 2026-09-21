"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { RecordsTable, FilterChip } from "@/components/records-table";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchItems, demoItems } from "@/lib/supabase/inventory";
import {
  fetchWeighments,
  fetchNextWeighmentNo,
  saveWeighment,
  updateWeighmentWeight,
  type Weighment,
  type WeighmentKind,
} from "@/lib/supabase/weighments";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";
import { isVendorParty } from "@/lib/party-data";
import { formatFullDate } from "@/lib/format";

/**
 * Weighment screen — used under both Purchases and Sales.
 *
 *  1. Fill the form (date, vehicle, product, weight, party) and save.
 *  2. The saved weighment appears in the list with an auto ID.
 *  3. When the final weight is in, "Move to Purchase / Sale" opens the bill /
 *     invoice with the weight filled in. It can be moved only once — after the
 *     bill is saved the row shows "Moved".
 */

const COPY = {
  purchase: {
    idLabel: "Purchase ID",
    dateLabel: "Purchase Date",
    partyLabel: "Party Name",
    subtitle:
      "Record the weight of each incoming load, then move it to a purchase bill.",
    moveLabel: "Move to Purchase",
    moveHref: "/purchases/bills",
    listTitle: "Purchase weighments",
  },
  sale: {
    idLabel: "Sale ID",
    dateLabel: "Sale Date",
    partyLabel: "Party Name",
    subtitle:
      "Record the weight of each outgoing load, then move it to a sale invoice.",
    moveLabel: "Move to Sale",
    moveHref: "/sales/invoices",
    listTitle: "Sale weighments",
  },
} as const;

function fmtWeight(n: number): string {
  return `${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })} KG`;
}

/** Final weight: editable while the weighment is pending, read-only once moved. */
function WeightCell({
  row,
  onSave,
}: {
  row: Weighment;
  onSave: (id: string, weight: number) => void;
}) {
  const initial = row.finalWeight ? String(row.finalWeight) : "";
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);

  if (row.status === "moved") {
    return <span className="figure">{fmtWeight(row.finalWeight)}</span>;
  }

  function commit() {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0 && n !== row.finalWeight) onSave(row.id, n);
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min={0}
        value={value}
        placeholder="Enter weight"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="figure h-8 w-28 rounded-md border border-slate-200 px-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-500"
      />
      <span className="text-[11px] text-slate-400">KG</span>
    </div>
  );
}

export function WeighmentManager({ kind }: { kind: WeighmentKind }) {
  const copy = COPY[kind];
  const router = useRouter();
  const { parties, loading: partiesLoading } = usePartyDirectory();

  // Purchases → vendors; Sales → every party.
  const partyOptions = useMemo(() => {
    if (kind === "sale") return parties;
    const vendors = parties.filter(isVendorParty);
    return vendors.length ? vendors : parties;
  }, [kind, parties]);

  const [weighmentNo, setWeighmentNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleNo, setVehicleNo] = useState("");
  const [product, setProduct] = useState("");
  const [weight, setWeight] = useState("");
  const [partyId, setPartyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<Weighment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "moved">("all");
  const [productNames, setProductNames] = useState<string[]>([]);

  // Default party once the directory loads.
  useEffect(() => {
    if (!partyId && partyOptions.length > 0) setPartyId(partyOptions[0].id);
  }, [partyOptions, partyId]);

  // Product suggestions from the Inventory catalog (typing anything else is fine too).
  useEffect(() => {
    (isSupabaseConfigured ? fetchItems() : Promise.resolve(demoItems))
      .then((items) => setProductNames(items.map((i) => i.name)))
      .catch(() => setProductNames([]));
  }, []);

  function refresh() {
    setLoading(true);
    fetchWeighments(kind)
      .then(setRows)
      .finally(() => setLoading(false));
    fetchNextWeighmentNo(kind).then(setWeighmentNo);
  }
  useEffect(refresh, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setError(null);
    if (!product.trim()) {
      setError("Enter the product.");
      return;
    }
    if (!partyId) {
      setError("Choose the party — add one in Party Master first if the list is empty.");
      return;
    }
    const w = weight.trim() === "" ? 0 : Number(weight);
    if (!Number.isFinite(w) || w < 0) {
      setError("Weight must be a number of KG (or leave it empty to add it later).");
      return;
    }
    setSaving(true);
    const { error: err } = await saveWeighment({
      kind,
      weighmentNo,
      date,
      vehicleNo: vehicleNo.trim(),
      product: product.trim(),
      partyId,
      finalWeight: w,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setSaved(true);
    setVehicleNo("");
    setProduct("");
    setWeight("");
    refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleWeightSave(id: string, w: number) {
    const { error: err } = await updateWeighmentWeight(id, w);
    if (err) setError(err);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, finalWeight: w } : r)));
  }

  const partyName = (id: string | null) =>
    parties.find((p) => p.id === id)?.name ?? id ?? "—";

  const filtered =
    statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Weighment</h1>
        <p className="text-sm text-slate-500 mt-1">{copy.subtitle}</p>
      </div>

      <DataModeBanner />

      <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>{copy.idLabel}</Label>
            <Input value={weighmentNo || "…"} disabled />
          </div>
          <div>
            <Label>{copy.dateLabel}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Vehicle No</Label>
            <Input
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. LEA-1234"
            />
          </div>
          <div>
            <Label>Product</Label>
            <Input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Product name"
              list={`weighment-products-${kind}`}
            />
            <datalist id={`weighment-products-${kind}`}>
              {productNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>Weight (KG)</Label>
            <Input
              type="number"
              min={0}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Add now, or later in the list"
            />
          </div>
          <div>
            <Label>{copy.partyLabel}</Label>
            <Select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              disabled={partiesLoading}
            >
              {partyOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
            <CircleAlert size={14} /> {error}
          </div>
        )}

        <div className="flex justify-end rule-t pt-4">
          <Button onClick={handleSave} disabled={saving || !weighmentNo}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="px-4 pt-4">
          <h2 className="text-[14px] font-semibold text-slate-900">{copy.listTitle}</h2>
        </div>
        <RecordsTable
          rows={filtered}
          loading={loading}
          searchPlaceholder="Search by ID, vehicle, product or party…"
          emptyLabel="No weighments yet."
          filters={
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "pending", "moved"] as const).map((s) => (
                <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "All" : s === "pending" ? "Pending" : "Moved"}
                </FilterChip>
              ))}
            </div>
          }
          columns={[
            {
              key: "no",
              header: copy.idLabel,
              render: (r) => <span className="font-medium text-slate-900">{r.weighmentNo}</span>,
              searchValue: (r) => r.weighmentNo,
            },
            {
              key: "date",
              header: copy.dateLabel,
              render: (r) => formatFullDate(r.date),
              searchValue: (r) => r.date,
            },
            {
              key: "vehicle",
              header: "Vehicle No",
              render: (r) => r.vehicleNo || "—",
              searchValue: (r) => r.vehicleNo,
            },
            { key: "product", header: "Product", render: (r) => r.product || "—", searchValue: (r) => r.product },
            {
              key: "party",
              header: "Party",
              render: (r) => partyName(r.partyId),
              searchValue: (r) => partyName(r.partyId),
            },
            {
              key: "weight",
              header: "Final Weight",
              render: (r) => <WeightCell row={r} onSave={handleWeightSave} />,
              searchValue: (r) => String(r.finalWeight),
            },
            {
              key: "action",
              header: "",
              render: (r) =>
                r.status === "moved" ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    <Check size={12} /> Moved{r.movedInvoiceNo ? ` · ${r.movedInvoiceNo}` : ""}
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!r.finalWeight}
                    title={r.finalWeight ? undefined : "Enter the final weight first"}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`${copy.moveHref}?weighment=${r.id}`);
                    }}
                    className="rounded-md bg-brand-600 px-2.5 py-1 text-[11.5px] font-medium text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {copy.moveLabel}
                  </button>
                ),
              searchValue: (r) => r.status,
            },
          ]}
        />
      </section>
    </div>
  );
}
