"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchVouchers, type VoucherRecord, type VoucherType } from "@/lib/supabase/vouchers";
import { demoVouchers, type DemoVoucher } from "@/lib/demo-records";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";
import { formatAmount, formatDayMonth } from "@/lib/format";
import { RecordsTable, FilterChip, AmountCell } from "@/components/records-table";
import { RecordDetailDrawer } from "@/components/record-detail-drawer";

type Row = VoucherRecord | DemoVoucher;
type Group = "all" | "receipts" | "payments" | "adjustments";

const GROUP_TYPES: Record<Exclude<Group, "all">, (VoucherType | "journal")[]> = {
  receipts: ["cash_receiving", "bank_receipt", "bank_cheque_deposit"],
  payments: ["cash_payment", "cash_payment_wht", "bank_payment", "bank_cheque_issue"],
  adjustments: ["journal", "ibft", "contra_cash_to_bank", "contra_bank_to_cash"],
};

const TYPE_LABEL: Record<VoucherType | "journal", string> = {
  cash_receiving: "Cash Receiving",
  cash_payment: "Cash Payment",
  cash_payment_wht: "Cash Payment (WHT)",
  bank_receipt: "Bank Receipts",
  bank_payment: "Bank Issue",
  bank_cheque_deposit: "Cheque Deposit",
  bank_cheque_issue: "Cheque Issue",
  contra_cash_to_bank: "Contra (Cash→Bank)",
  contra_bank_to_cash: "Contra (Bank→Cash)",
  ibft: "IBFT",
  journal: "Journal",
};

export function VoucherList() {
  const { parties } = usePartyDirectory();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group>("all");
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (isSupabaseConfigured ? fetchVouchers() : Promise.resolve(demoVouchers())).then(
      (data) => {
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const partyName = (id: string | null) =>
    id ? parties.find((p) => p.id === id)?.name ?? id : "—";

  const filtered =
    group === "all" ? rows : rows.filter((r) => GROUP_TYPES[group].includes(r.voucherType));

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="px-4 pt-4">
        <h2 className="text-[14px] font-semibold text-slate-900">
          Recent vouchers
        </h2>
      </div>

      <RecordsTable
        rows={filtered}
        loading={loading}
        emptyLabel="No vouchers saved yet — use one of the cards above to create the first one."
        searchPlaceholder="Search by voucher #, party, narration…"
        filters={
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={group === "all"} onClick={() => setGroup("all")}>
              All
            </FilterChip>
            <FilterChip active={group === "receipts"} onClick={() => setGroup("receipts")}>
              Receipts
            </FilterChip>
            <FilterChip active={group === "payments"} onClick={() => setGroup("payments")}>
              Payments
            </FilterChip>
            <FilterChip active={group === "adjustments"} onClick={() => setGroup("adjustments")}>
              Adjustments
            </FilterChip>
          </div>
        }
        onRowClick={setSelected}
        columns={[
          {
            key: "date",
            header: "Date",
            render: (r) => formatDayMonth(r.date),
            searchValue: (r) => r.date,
          },
          {
            key: "no",
            header: "Voucher #",
            render: (r) => <span className="font-medium text-slate-900">{r.voucherNo}</span>,
            searchValue: (r) => r.voucherNo,
          },
          {
            key: "type",
            header: "Type",
            render: (r) => (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                {TYPE_LABEL[r.voucherType]}
              </span>
            ),
            searchValue: (r) => TYPE_LABEL[r.voucherType],
          },
          {
            key: "party",
            header: "Party / Narration",
            render: (r) => (
              <span>
                {r.partyId ? partyName(r.partyId) : r.narration ?? "—"}
              </span>
            ),
            searchValue: (r) => `${partyName(r.partyId)} ${r.narration ?? ""}`,
          },
          {
            key: "amount",
            header: "Net Amount",
            align: "right",
            render: (r) => <AmountCell value={r.netAmount} />,
            searchValue: (r) => String(r.netAmount),
          },
        ]}
        footer={(visible) => (
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="text-slate-500">
              {visible.length} voucher{visible.length === 1 ? "" : "s"}
            </span>
            <span className="text-slate-700">
              Total{" "}
              <span className="figure font-medium">
                Rs {formatAmount(visible.reduce((s, r) => s + r.netAmount, 0))}
              </span>
            </span>
          </div>
        )}
      />

      <RecordDetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? TYPE_LABEL[selected.voucherType] : ""}
        reference={selected?.voucherNo ?? ""}
        date={selected?.date ?? ""}
        fields={
          selected
            ? [
                ...(selected.partyId
                  ? [{ label: "Party", value: partyName(selected.partyId) }]
                  : []),
                ...(selected.bankAccount
                  ? [
                      {
                        label: selected.toBankAccount ? "From Bank Account" : "Bank Account",
                        value: selected.bankAccount,
                      },
                    ]
                  : []),
                ...(selected.toBankAccount
                  ? [{ label: "To Bank Account", value: selected.toBankAccount }]
                  : []),
                ...(selected.chequeNo
                  ? [{ label: "Cheque #", value: selected.chequeNo }]
                  : []),
                { label: "Gross Amount", value: `Rs ${formatAmount(selected.grossAmount)}` },
                ...(selected.whtAmount > 0
                  ? [
                      {
                        label: "WHT Deducted",
                        value: `(Rs ${formatAmount(selected.whtAmount)})`,
                        negative: true,
                      },
                    ]
                  : []),
                ...(selected.narration
                  ? [{ label: "Narration", value: selected.narration }]
                  : []),
              ]
            : []
        }
        total={{ label: "Net Amount", value: selected?.netAmount ?? 0 }}
      />
    </section>
  );
}
