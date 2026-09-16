"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumbs,
  PLValue,
  SideBadge,
  StatCard,
} from "@/components/trader/trader-ui";
import { OrderPanel } from "@/components/trader/order-panel";
import {
  DEFAULT_MARKET_RATES,
  DEFAULT_POSITIONS,
  DEFAULT_TRADES,
  formatPKR,
  formatQty,
  tradeValue,
  unrealisedPL,
  usedMargin,
  type MarketRate,
  type OrderDraft,
  type Position,
  type Trade,
  type TradeSide,
} from "@/lib/trader";

/** Working capital available to the trader — replace with the real
 *  figure from the accounts ledger once wired to Supabase. */
const ACCOUNT_BALANCE = 12_500_000;

export default function TraderDashboardPage() {
  const [rates] = useState<MarketRate[]>(DEFAULT_MARKET_RATES);
  const [positions, setPositions] = useState<Position[]>(DEFAULT_POSITIONS);
  const [trades, setTrades] = useState<Trade[]>(DEFAULT_TRADES);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSymbol, setPanelSymbol] = useState<string | undefined>();
  const [panelSide, setPanelSide] = useState<TradeSide>("buy");

  const rateBySymbol = useMemo(() => {
    const map = new Map<string, MarketRate>();
    rates.forEach((r) => map.set(r.symbol, r));
    return map;
  }, [rates]);

  const openPositions = positions.filter((p) => p.status === "open");

  const floatingPL = openPositions.reduce((sum, p) => {
    const market = rateBySymbol.get(p.symbol)?.rate ?? p.avgRate;
    return sum + unrealisedPL(p, market);
  }, 0);

  const margin = usedMargin(positions);
  const equity = ACCOUNT_BALANCE + floatingPL;
  const freeMargin = equity - margin;

  const realisedPL = trades
    .filter((t) => t.status === "closed" && t.profitLoss !== null)
    .reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);

  function openOrder(symbol?: string, side: TradeSide = "buy") {
    setPanelSymbol(symbol);
    setPanelSide(side);
    setPanelOpen(true);
  }

  function handleSubmitOrder(draft: OrderDraft) {
    const market = rateBySymbol.get(draft.symbol);
    if (!market) return;

    const qty = Number(draft.quantity) || 0;
    const rate =
      draft.orderType === "market" ? market.rate : Number(draft.rate) || 0;

    const trade: Trade = {
      id: `trd-${Date.now()}`,
      symbol: market.symbol,
      name: market.name,
      unit: market.unit,
      side: draft.side,
      orderType: draft.orderType,
      quantity: qty,
      rate,
      profitLoss: null,
      party: draft.party.trim() || null,
      status: draft.orderType === "limit" ? "pending" : "open",
      executedAt: new Date().toISOString().slice(0, 10),
    };
    setTrades((prev) => [trade, ...prev]);

    if (trade.status === "open") {
      setPositions((prev) => [
        {
          id: `pos-${Date.now()}`,
          symbol: market.symbol,
          name: market.name,
          unit: market.unit,
          side: draft.side,
          quantity: qty,
          avgRate: rate,
          openedAt: trade.executedAt,
          status: "open",
        },
        ...prev,
      ]);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Trader" }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Trader</h1>
          <p className="mt-1 text-sm text-slate-500">
            Market rates, open positions and profit &amp; loss at a glance.
          </p>
        </div>
        <Button onClick={() => openOrder()} className="gap-2">
          <Plus size={16} />
          New Order
        </Button>
      </div>

      {/* Balance & margin widgets */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Available Balance"
          value={formatPKR(ACCOUNT_BALANCE)}
          hint="Working capital"
        />
        <StatCard
          label="Equity"
          value={formatPKR(equity)}
          hint="Balance + floating P&L"
          tone={floatingPL >= 0 ? "profit" : "loss"}
        />
        <StatCard
          label="Used Margin"
          value={formatPKR(margin)}
          hint={`${openPositions.length} open position${openPositions.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Free Margin"
          value={formatPKR(freeMargin)}
          hint="Available to trade"
          tone={freeMargin >= 0 ? "neutral" : "loss"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Watchlist */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Watchlist</h2>
            <Link
              href="/trader/rates"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              All rates <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            {rates.slice(0, 5).map((r) => {
              const pct = r.rate ? (r.change / (r.rate - r.change)) * 100 : 0;
              return (
                <div
                  key={r.symbol}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {r.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.market} · per {r.unit}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatPKR(r.rate)}
                    </p>
                    <p className="text-xs">
                      <PLValue
                        value={r.change}
                        formatted={`${r.change >= 0 ? "+" : ""}${r.change} (${pct.toFixed(2)}%)`}
                      />
                    </p>
                  </div>
                  <div className="hidden shrink-0 gap-1.5 sm:flex">
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
                </div>
              );
            })}
          </div>
        </section>

        {/* Open positions + realised P&L */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Open Positions
            </h2>
            <Link
              href="/trader/positions"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {openPositions.slice(0, 3).map((p) => {
              const market = rateBySymbol.get(p.symbol)?.rate ?? p.avgRate;
              const pl = unrealisedPL(p, market);
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {p.name}
                        </p>
                        <SideBadge side={p.side} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatQty(p.quantity)} {p.unit} @ {formatPKR(p.avgRate)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <PLValue value={pl} formatted={formatPKR(pl)} />
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatPKR(tradeValue(p.quantity, p.avgRate))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <p className="text-xs font-medium text-slate-500">
                Realised P&amp;L (closed trades)
              </p>
              <p className="mt-1.5 text-lg font-semibold">
                <PLValue value={realisedPL} formatted={formatPKR(realisedPL)} />
              </p>
              <Link
                href="/trader/trade-history"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Trade history <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <OrderPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        rates={rates}
        initialSymbol={panelSymbol}
        initialSide={panelSide}
        onSubmit={handleSubmitOrder}
      />
    </div>
  );
}
