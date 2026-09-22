"use client";

import { useState } from "react";
import { X, Printer, ShieldOff, TriangleAlert } from "lucide-react";
import { formatMoney, formatFullDate } from "@/lib/format";

export type DetailField = {
  label: string;
  value: string;
  emphasize?: boolean;
  negative?: boolean;
};

type DocumentStatus = "draft" | "posted" | "void";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  void: "bg-red-50 text-red-700 border-red-200",
};

/**
 * A record saved from any of these forms couldn't be looked at again
 * without re-running a report. This drawer is the "View" a saved
 * invoice or voucher was missing — full detail plus a print button,
 * without needing a dedicated route per document type.
 *
 * Once a document is posted it can no longer be edited or deleted
 * (see migration_19) — Void, with a reason, is the only correction
 * path, and that reason plus who/when is shown here from then on.
 */
export function RecordDetailDrawer({
  open,
  onClose,
  title,
  reference,
  date,
  fields,
  total,
  status,
  voidReason,
  onVoid,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  reference: string;
  date: string;
  fields: DetailField[];
  total: { label: string; value: number };
  /** Omit for records that predate the lifecycle migration / demo rows without it. */
  status?: DocumentStatus;
  voidReason?: string | null;
  /** Present only when this document can actually be voided from here. */
  onVoid?: (reason: string) => Promise<void> | void;
}) {
  const [voiding, setVoiding] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function confirmVoid() {
    const reason = window.prompt(
      "Reason for voiding this document (kept in the audit trail):"
    );
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      window.alert("A reason is required to void a posted document.");
      return;
    }
    setBusy(true);
    await onVoid?.(reason.trim());
    setBusy(false);
    setVoiding(false);
  }

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
            {onVoid && status && status !== "void" && (
              <button
                onClick={confirmVoid}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-[12.5px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <ShieldOff size={14} />
                {busy ? "Voiding…" : "Void"}
              </button>
            )}
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

          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] text-slate-500">{formatFullDate(date)}</p>
            {status && (
              <span
                className={`text-[11px] font-medium uppercase tracking-wide rounded-full border px-2 py-0.5 ${STATUS_STYLES[status]}`}
              >
                {status}
              </span>
            )}
          </div>

          {status === "void" && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
              <TriangleAlert size={14} className="shrink-0 mt-0.5" />
              <span>
                This document is void and has no accounting effect.
                {voidReason ? ` Reason: ${voidReason}` : ""}
              </span>
            </div>
          )}

          <dl className="space-y-3 mt-3">
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
