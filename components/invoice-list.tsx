"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchInvoices,
  voidInvoice,
  type InvoiceCategory,
  type InvoiceRecord,
} from "@/lib/supabase/invoices";
import { demoInvoices, type DemoInvoice } from "@/lib/demo-records";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";
import { formatAmount, formatDayMonth } from "@/lib/format";
import { RecordsTable, FilterChip, AmountCell } from "@/components/records-table";
import { RecordDetailDrawer } from "@/components/record-detail-drawer";

type Row = InvoiceRecord | DemoInvoice;
type TypeFilter = "all" | "sale" | "purchase";

export function InvoiceList({
  category,
  title = "Invoices",
  defaultTypeFilter = "all",
}: {
  category: InvoiceCategory;
  title?: string;
  defaultTypeFilter?: TypeFilter;
}) {
  const { parties } = usePartyDirectory();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(defaultTypeFilter);
  const [selected, setSelected] = useState<Row | null>(null);
  const [voidError, setVoidError] = useState<string | null>(null);

  function load() {
    let cancelled = false;
    setLoading(true);
    (isSupabaseConfigured
      ? fetchInvoices({ category })
      : Promise.resolve(demoInvoices(category))
    ).then((data) => {
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }

  useEffect(load, [category]);

  async function handleVoid(reason: string) {
    if (!selected) return;
    if (!isSupabaseConfigured) {
      setVoidError("Voiding needs Supabase to be configured — this is demo data.");
      return;
    }
    const { error } = await voidInvoice(selected.id, reason);
    if (error) {
      setVoidError(error);
      return;
    }
    setVoidError(null);
    setSelected(null);
    load();
  }

  const partyName = (id: string | null) =>
    id ? parties.find((p) => p.id === id)?.name ?? id : "—";

  const filtered =
    typeFilter === "all" ? rows : rows.filter((r) => r.invoiceType === typeFilter);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2>
      </div>

      <RecordsTable
        rows={filtered}
        loading={loading}
        emptyLabel="No invoices saved yet — use one of the cards above to create the first one."
        searchPlaceholder="Search by invoice #, party…"
        filters={
          <div className="flex items-center gap-1.5">
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
              All
            </FilterChip>
            <FilterChip active={typeFilter === "sale"} onClick={() => setTypeFilter("sale")}>
              Sale
            </FilterChip>
            <FilterChip active={typeFilter === "purchase"} onClick={() => setTypeFilter("purchase")}>
              Purchase
            </FilterChip>
          </div>
        }
        onRowClick={setSelected}
        columns={[
          {
            key: "date",
            header: "Date",
            render: (r) => formatDayMonth(r.invoiceDate),
            searchValue: (r) => r.invoiceDate,
          },
          {
            key: "no",
            header: "Invoice #",
            render: (r) => (
              <span className="inline-flex items-center gap-1.5">
                <span className="font-medium text-slate-900">{r.invoiceNo}</span>
                {r.status === "void" && (
                  <span className="rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-medium uppercase text-red-600">
                    Void
                  </span>
                )}
              </span>
            ),
            searchValue: (r) => r.invoiceNo,
          },
          {
            key: "type",
            header: "Type",
            render: (r) => (
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  r.invoiceType === "sale"
                    ? "bg-brand-50 text-brand-700"
                    : "bg-orange-50 text-money-out"
                }`}
              >
                {r.invoiceType === "sale" ? "Sale" : "Purchase"}
              </span>
            ),
            searchValue: (r) => r.invoiceType,
          },
          {
            key: "party",
            header: "Party",
            render: (r) => partyName(r.partyId),
            searchValue: (r) => partyName(r.partyId),
          },
          {
            key: "total",
            header: "Net Total",
            align: "right",
            render: (r) => <AmountCell value={r.netTotal} />,
            searchValue: (r) => String(r.netTotal),
          },
        ]}
        footer={(visible) => (
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-slate-500">
              {visible.length} invoice{visible.length === 1 ? "" : "s"}
            </span>
            <span className="text-slate-700">
              Total{" "}
              <span className="figure font-medium">
                Rs {formatAmount(visible.reduce((s, r) => s + r.netTotal, 0))}
              </span>
            </span>
          </div>
        )}
      />

      {voidError && (
        <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {voidError}
        </div>
      )}

      <RecordDetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.invoiceType === "sale" ? "Sale Invoice" : "Purchase Invoice"}
        reference={selected?.invoiceNo ?? ""}
        date={selected?.invoiceDate ?? ""}
        status={selected?.status}
        voidReason={selected?.voidReason}
        onVoid={handleVoid}
        fields={
          selected
            ? [
                { label: "Party", value: partyName(selected.partyId) },
                { label: "Subtotal", value: `Rs ${formatAmount(selected.subtotal)}` },
                ...(selected.brokerageAmount > 0
                  ? [
                      {
                        label: "Brokerage",
                        value: `(Rs ${formatAmount(selected.brokerageAmount)})`,
                        negative: true,
                      },
                    ]
                  : []),
                ...(selected.notes
                  ? [{ label: "Notes", value: selected.notes }]
                  : []),
              ]
            : []
        }
        total={{ label: "Net Total", value: selected?.netTotal ?? 0 }}
      />
    </section>
  );
}
