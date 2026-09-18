"use client";

import { X, Printer } from "lucide-react";
import { formatMoney, formatFullDate } from "@/lib/format";

export type DetailField = {
  label: string;
  value: string;
  emphasize?: boolean;
  negative?: boolean;
};

/**
 * A record saved from any of these forms couldn't be looked at again
 * without re-running a report. This drawer is the "View" a saved
 * invoice or voucher was missing — full detail plus a print button,
 * without needing a dedicated route per document type.
 */
export function RecordDetailDrawer({
  open,
  onClose,
  title,
  reference,
  date,
  fields,
  total,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  reference: string;
  date: string;
  fields: DetailField[];
  total: { label: string; value: number };
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/30 print:hidden"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col print:static print:max-w-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 print:hidden">
          <div>
            <p className="text-[15px] font-semibold text-slate-900">{title}</p>
            <p className="text-[12px] text-slate-500">{reference}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar px-5 py-5">
          <div className="hidden print:block mb-4">
            <p className="text-lg font-semibold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">{reference}</p>
          </div>

          <p className="text-[12px] text-slate-500 mb-4">
            {formatFullDate(date)}
          </p>

          <dl className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-3">
                <dt className="text-[13px] text-slate-500">{f.label}</dt>
                <dd
                  className={`figure text-[13px] text-right ${
                    f.emphasize ? "font-semibold text-slate-900" : "text-slate-700"
                  } ${f.negative ? "text-money-out" : ""}`}
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-700">
              {total.label}
            </span>
            <span className="figure text-[16px] font-semibold text-slate-900">
              {formatMoney(total.value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
