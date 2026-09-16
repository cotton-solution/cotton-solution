"use client";

import { useState } from "react";
import { Breadcrumbs, PLValue } from "@/components/trader/trader-ui";
import { AdaptiveTable, type Column } from "@/components/trader/adaptive-table";
import { OrderPanel } from "@/components/trader/order-panel";
import {
  DEFAULT_MARKET_RATES,
  formatPKR,
  type MarketRate,
  type OrderDraft,
  type TradeSide,
} from "@/lib/trader";

export default function TraderRatesPage() {
  const [rates] = useState<MarketRate[]>(DEFAULT_MARKET_RATES);
  const [panelOpen, setPanelOpen] = useState(false);
  const [symbol, setSymbol] = useState<string | undefined>();
  const [side, setSide] = useState<TradeSide>("buy");

  function openOrder(sym: string, s: TradeSide) {
    setSymbol(sym);
    setSide(s);
    setPanelOpen(true);
  }

  function handleSubmit(draft: OrderDraft) {
    // Orders are created from the Trader dashboard's state today.
    // Once the Supabase tables exist, call insertTrade(draft) here.
    console.info("Order submitted from rates screen", draft);
  }

  const columns: Column<MarketRate>[] = [
    {
      key: "name",
      header: "Commodity",
      hideOnCard: true,
      cell: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="text-xs text-slate-500">{r.symbol}</p>
        </div>
      ),
    },
    { key: "market", header: "Market", cell: (r) => r.market },
    { key: "unit", header: "Unit", cell: (r) => r.unit },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      cell: (r) => (
        <span className="font-semibold text-slate-900">
          {formatPKR(r.rate)}
        </span>
      ),
    },
    {
      key: "change",
      header: "Change",
      align: "right",
      cell: (r) => {
        const pct = r.rate ? (r.change / (r.rate - r.change)) * 100 : 0;
        return (
          <PLValue
            value={r.change}
            formatted={`${r.change >= 0 ? "+" : ""}${r.change} (${pct.toFixed(2)}%)`}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Trade",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => openOrder(r.symbol, "buy")}
            className="h-9 rounded-lg bg-emerald-50 px-3 text-xs font-semibold uppercase text-emerald-700 hover:bg-emerald-100"
          >
            Buy
          </button>
          <button
            onClick={() => openOrder(r.symbol, "sell")}
            className="h-9 rounded-lg bg-red-50 px-3 text-xs font-semibold uppercase text-red-700 hover:bg-red-100"
          >
            Sell
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Trader", href: "/trader" },
          { label: "Market Rates" },
        ]}
      />

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Market Rates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Daily rates by market. Tap Buy or Sell to record an order.
        </p>
      </div>

      <AdaptiveTable
        rows={rates}
        columns={columns}
        getRowKey={(r) => r.symbol}
        cardTitle={(r) => r.name}
        cardSubtitle={(r) => `${r.symbol} · ${r.market}`}
        searchableText={(r) => `${r.name} ${r.symbol} ${r.market}`}
        searchPlaceholder="Search commodity or market…"
        emptyMessage="No rates match your search."
      />

      <OrderPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        rates={rates}
        initialSymbol={symbol}
        initialSide={side}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
