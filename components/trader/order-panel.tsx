"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/trader/trader-ui";
import { cn } from "@/lib/utils";
import {
  EMPTY_ORDER_DRAFT,
  ORDER_DRAFT_KEY,
  formatPKR,
  tradeValue,
  type MarketRate,
  type OrderDraft,
  type TradeSide,
} from "@/lib/trader";

/** Numeric inputs open the decimal keypad on mobile. */
const numericProps = {
  inputMode: "decimal" as const,
  type: "text" as const,
  autoComplete: "off",
};

export function OrderPanel({
  open,
  onClose,
  rates,
  initialSymbol,
  initialSide = "buy",
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  rates: MarketRate[];
  initialSymbol?: string;
  initialSide?: TradeSide;
  onSubmit: (draft: OrderDraft) => void;
}) {
  const [draft, setDraft] = useState<OrderDraft>(EMPTY_ORDER_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restore an auto-saved draft once, when the panel first opens.
  useEffect(() => {
    if (!open) return;
    let next: OrderDraft = {
      ...EMPTY_ORDER_DRAFT,
      symbol: initialSymbol ?? rates[0]?.symbol ?? "",
      side: initialSide,
    };
    try {
      const saved = window.localStorage.getItem(ORDER_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<OrderDraft>;
        next = { ...next, ...parsed };
        if (initialSymbol) next.symbol = initialSymbol;
        setRestored(true);
      }
    } catch {
      // ignore unreadable/corrupt drafts
    }
    setDraft(next);
    setErrors({});
  }, [open, initialSymbol, initialSide, rates]);

  // Auto-save the draft as the user types.
  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // storage full / private mode — drafting still works in memory
    }
  }, [draft, open]);

  const selected = useMemo(
    () => rates.find((r) => r.symbol === draft.symbol) ?? null,
    [rates, draft.symbol]
  );

  const effectiveRate =
    draft.orderType === "market"
      ? (selected?.rate ?? 0)
      : Number(draft.rate) || 0;

  const qty = Number(draft.quantity) || 0;
  const total = tradeValue(qty, effectiveRate);

  function set<K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setRestored(false);
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!draft.symbol) next.symbol = "Select a commodity.";
    if (!qty || qty <= 0) next.quantity = "Enter a quantity greater than zero.";
    if (draft.orderType === "limit" && (!Number(draft.rate) || Number(draft.rate) <= 0))
      next.rate = "Enter the limit rate.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    onSubmit(draft);
    try {
      window.localStorage.removeItem(ORDER_DRAFT_KEY);
    } catch {
      // ignore
    }
    setSubmitting(false);
    setDraft(EMPTY_ORDER_DRAFT);
    onClose();
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(ORDER_DRAFT_KEY);
    } catch {
      // ignore
    }
    setDraft({
      ...EMPTY_ORDER_DRAFT,
      symbol: initialSymbol ?? rates[0]?.symbol ?? "",
      side: initialSide,
    });
    setRestored(false);
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="New Order"
      description="Record a purchase or sale at the current or a fixed rate."
    >
      <div className="space-y-5">
        {restored && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>Unsaved draft restored.</span>
            <button
              onClick={clearDraft}
              className="font-semibold underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Buy / Sell toggle */}
        <div
          role="radiogroup"
          aria-label="Order side"
          className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1"
        >
          {(["buy", "sell"] as TradeSide[]).map((side) => (
            <button
              key={side}
              type="button"
              role="radio"
              aria-checked={draft.side === side}
              onClick={() => set("side", side)}
              className={cn(
                "h-10 rounded-md text-sm font-semibold uppercase tracking-wide transition-colors",
                draft.side === side
                  ? side === "buy"
                    ? "bg-emerald-600 text-white"
                    : "bg-red-600 text-white"
                  : "text-slate-600 hover:bg-white"
              )}
            >
              {side}
            </button>
          ))}
        </div>

        {/* Commodity */}
        <div>
          <Label htmlFor="order-symbol">Commodity</Label>
          <select
            id="order-symbol"
            value={draft.symbol}
            onChange={(e) => set("symbol", e.target.value)}
            aria-invalid={!!errors.symbol}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="" disabled>
              Select a commodity…
            </option>
            {rates.map((r) => (
              <option key={r.symbol} value={r.symbol}>
                {r.name} — {r.market}
              </option>
            ))}
          </select>
          {errors.symbol && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.symbol}
            </p>
          )}
          {selected && (
            <p className="mt-1.5 text-xs text-slate-500">
              Market rate: {formatPKR(selected.rate)} / {selected.unit}
            </p>
          )}
        </div>

        {/* Order type */}
        <div>
          <Label htmlFor="order-type">Order type</Label>
          <select
            id="order-type"
            value={draft.orderType}
            onChange={(e) =>
              set("orderType", e.target.value as OrderDraft["orderType"])
            }
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="market">Market — at today&apos;s rate</option>
            <option value="limit">Limit — at a fixed rate</option>
          </select>
        </div>

        {/* Quantity + rate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="order-qty">
              Quantity {selected ? `(${selected.unit})` : ""}
            </Label>
            <Input
              id="order-qty"
              {...numericProps}
              value={draft.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              aria-invalid={!!errors.quantity}
              placeholder="0"
            />
            {errors.quantity && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.quantity}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="order-rate">Rate (PKR)</Label>
            <Input
              id="order-rate"
              {...numericProps}
              value={
                draft.orderType === "market"
                  ? String(selected?.rate ?? "")
                  : draft.rate
              }
              onChange={(e) => set("rate", e.target.value)}
              disabled={draft.orderType === "market"}
              aria-invalid={!!errors.rate}
              placeholder="0"
            />
            {errors.rate && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.rate}
              </p>
            )}
          </div>
        </div>

        {/* Risk controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="order-sl">Stop-loss rate</Label>
            <Input
              id="order-sl"
              {...numericProps}
              value={draft.stopLoss}
              onChange={(e) => set("stopLoss", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="order-tp">Take-profit rate</Label>
            <Input
              id="order-tp"
              {...numericProps}
              value={draft.takeProfit}
              onChange={(e) => set("takeProfit", e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Party */}
        <div>
          <Label htmlFor="order-party">Party / Broker</Label>
          <Input
            id="order-party"
            value={draft.party}
            onChange={(e) => set("party", e.target.value)}
            placeholder="e.g. Al-Barkat Cotton Factory"
          />
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Estimated value</span>
            <span className="font-semibold tabular-nums text-slate-900">
              {formatPKR(total)}
            </span>
          </div>
          {selected && qty > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              {qty} {selected.unit} × {formatPKR(effectiveRate)}
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            "h-12 w-full gap-2 text-[15px] font-semibold",
            draft.side === "buy"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          )}
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {draft.side === "buy" ? "Place Buy Order" : "Place Sell Order"}
        </Button>

        <p className="text-center text-xs text-slate-400">
          Draft saves automatically as you type.
        </p>
      </div>
    </SlideOver>
  );
}
