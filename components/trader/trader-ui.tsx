"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, X, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
 * Breadcrumbs
 * ----------------------------------------------------------------*/

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-slate-900">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={last ? "font-medium text-slate-700" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight size={12} className="text-slate-300" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------
 * Stat widget — balance / equity / margin cards
 * ----------------------------------------------------------------*/

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "profit" | "loss";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold tabular-nums sm:text-xl",
          tone === "profit" && "text-emerald-600",
          tone === "loss" && "text-red-600",
          tone === "neutral" && "text-slate-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------
 * Badges
 * ----------------------------------------------------------------*/

export function SideBadge({ side }: { side: "buy" | "sell" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        side === "buy"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      )}
    >
      {side}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "open"
      ? "bg-brand-50 text-brand-700"
      : status === "pending"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        tone
      )}
    >
      {status}
    </span>
  );
}

/** Profit/loss figure with direction icon — never colour-only. */
export function PLValue({
  value,
  formatted,
}: {
  value: number;
  formatted: string;
}) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        positive ? "text-emerald-600" : "text-red-600"
      )}
    >
      <Icon size={14} aria-hidden="true" />
      <span className="sr-only">{positive ? "Profit" : "Loss"}: </span>
      {formatted}
    </span>
  );
}

/* ------------------------------------------------------------------
 * Slide-over drawer — used for quick actions instead of page loads.
 * Full-height sheet on desktop, bottom sheet on mobile.
 * ----------------------------------------------------------------*/

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
      />
      <div
        className={cn(
          "absolute bg-white shadow-xl flex flex-col",
          // mobile: bottom sheet
          "inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl",
          // desktop: right drawer
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:max-h-none sm:w-[420px] sm:rounded-none"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto thin-scrollbar px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
