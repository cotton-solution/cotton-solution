"use client";

import { useMemo, useState } from "react";
import { Breadcrumbs, PLValue, SideBadge, StatCard, StatusBadge } from "@/components/trader/trader-ui";
import { AdaptiveTable, type Column } from "@/components/trader/adaptive-table";
import {
  DEFAULT_MARKET_RATES,
  DEFAULT_POSITIONS,
  formatPKR,
  formatQty,
  tradeValue,
  unrealisedPL,
  usedMargin,
  type MarketRate,
  type Position,
} from "@/lib/trader";

export default function TraderPositionsPage() {
  const [positions] = useState<Position[]>(DEFAULT_POSITIONS);
  const [rates] = useState<MarketRate[]>(DEFAULT_MARKET_RATES);

  const rateBySymbol = useMemo(() => {
    const map = new Map<string, number>();
    rates.forEach((r) => map.set(r.symbol, r.rate));
    return map;
  }, [rates]);

  const openPositions = positions.filter((p) => p.status === "open");
  const floatingPL = openPositions.reduce(
    (sum, p) => sum + unrealisedPL(p, rateBySymbol.get(p.symbol) ?? p.avgRate),
    0
  );
  const margin = usedMargin(positions);

  const columns: Column<Position>[] = [
    {
      key: "name",
      header: "Commodity",
      hideOnCard: true,
      cell: (p) => (
        <div>
          <p className="font-medium text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-500">{p.symbol}</p>
        </div>
      ),
    },
    { key: "side", header: "Side", cell: (p) => <SideBadge side={p.side} /> },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      cell: (p) => `${formatQty(p.quantity)} ${p.unit}`,
    },
    {
      key: "avgRate",
      header: "Avg Rate",
      align: "right",
      cell: (p) => formatPKR(p.avgRate),
    },
    {
      key: "market",
      header: "Market Rate",
      align: "right",
      cell: (p) => formatPKR(rateBySymbol.get(p.symbol) ?? p.avgRate),
    },
    {
      key: "value",
      header: "Value",
      align: "right",
      cell: (p) => formatPKR(tradeValue(p.quantity, p.avgRate)),
    },
    {
      key: "pl",
      header: "Floating P&L",
      align: "right",
      cell: (p) => {
        const pl = unrealisedPL(p, rateBySymbol.get(p.symbol) ?? p.avgRate);
        return <PLValue value={pl} formatted={formatPKR(pl)} />;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Trader", href: "/trader" },
          { label: "Positions" },
        ]}
      />

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Open Positions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Stock in hand and committed sales, valued at today&apos;s market rate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Open Positions"
          value={String(openPositions.length)}
          hint="Currently active"
        />
        <StatCard
          label="Capital Committed"
          value={formatPKR(margin)}
          hint="At average rate"
        />
        <StatCard
          label="Floating P&L"
          value={formatPKR(floatingPL)}
          hint="Unrealised, at market"
          tone={floatingPL >= 0 ? "profit" : "loss"}
        />
      </div>

      <AdaptiveTable
        rows={positions}
        columns={columns}
        getRowKey={(p) => p.id}
        cardTitle={(p) => p.name}
        cardSubtitle={(p) => `Opened ${p.openedAt}`}
        searchableText={(p) => `${p.name} ${p.symbol} ${p.side}`}
        searchPlaceholder="Search positions…"
        emptyMessage="No open positions."
      />
    </div>
  );
}
