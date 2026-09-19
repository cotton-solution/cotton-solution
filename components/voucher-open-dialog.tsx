"use client";

import { useEffect, useState } from "react";
import { X, Search, FileText } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { searchVouchersByType, type VoucherType, type VoucherSummary } from "@/lib/supabase/vouchers";
import { demoVouchers } from "@/lib/demo-records";
import { formatAmount, formatDayMonth } from "@/lib/format";

export function VoucherOpenDialog({
  voucherType,
  onPick,
  onClose,
}: {
  voucherType: VoucherType | "journal";
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<VoucherSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (isSupabaseConfigured) {
      searchVouchersByType(voucherType, query).then((r) => {
        if (!cancelled) {
          setRows(r);
          setLoading(false);
        }
      });
    } else {
      const demo = demoVouchers()
        .filter((v) => v.voucherType === voucherType)
        .filter(
          (v) =>
            !query.trim() ||
            v.voucherNo.toLowerCase().includes(query.toLowerCase()) ||
            (v.narration ?? "").toLowerCase().includes(query.toLowerCase())
        )
        .map((v) => ({
          id: v.id,
          voucherNo: v.voucherNo,
          date: v.date,
          narration: v.narration,
          amount: v.netAmount,
        }));
      setRows(demo);
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 mt-16 sm:mt-0 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Open Voucher</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by voucher number or narration…"
              className="w-full h-10 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-sm text-slate-400 py-8">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              No saved vouchers of this type yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => onPick(r.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                      <FileText size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{r.voucherNo}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {formatDayMonth(r.date)}
                        {r.narration ? ` · ${r.narration}` : ""}
                      </p>
                    </div>
                    <span className="figure text-sm font-medium text-slate-700 shrink-0">
                      Rs {formatAmount(r.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
