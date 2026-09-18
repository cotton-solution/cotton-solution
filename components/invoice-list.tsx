"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchInvoices,
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

  useEffect(() => {
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
  }, [category]);

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
              <span className="font-medium text-slate-900">{r.invoiceNo}</span>
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

      <RecordDetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.invoiceType === "sale" ? "Sale Invoice" : "Purchase Invoice"}
        reference={selected?.invoiceNo ?? ""}
        date={selected?.invoiceDate ?? ""}
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
