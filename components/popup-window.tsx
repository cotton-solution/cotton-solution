"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The legacy-desktop-software popup shell: a title bar with an icon and
 * close (X), a dark gradient banner with the big heading underneath, a
 * scrollable body, and a footer for action buttons — matching the
 * "Account Ledger" / "Accounts Balances" / "Parties Information" windows
 * of the old app this project is modelled after. Every filter/report
 * popup in the app is built from this one shell so they stay consistent.
 */
export function PopupWindow({
  title,
  icon,
  onClose,
  children,
  footer,
  maxWidth = "max-w-xl",
}: {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/50 p-3 sm:p-4 overflow-y-auto">
      <div
        className={cn(
          "w-full rounded-xl bg-white shadow-2xl border border-slate-200 my-4 sm:my-0 flex flex-col max-h-[92vh]",
          maxWidth
        )}
      >
        {/* title bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            {icon}
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-white hover:bg-red-500 rounded p-0.5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* banner heading */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-brand-900 px-5 py-4">
          <h2 className="relative text-xl sm:text-2xl font-semibold text-white">{title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** A radio row for the "All Dates / Single Date / Range" style choice. */
export function PopupRadio({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer select-none">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-600"
      />
      {label}
    </label>
  );
}

/** A checkbox row matching the popup's compact option lists. */
export function PopupCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
      />
      {label}
    </label>
  );
}
