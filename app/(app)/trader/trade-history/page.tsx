"use client";

import { useState } from "react";
import {
  Breadcrumbs,
  PLValue,
  SideBadge,
  StatCard,
  StatusBadge,
} from "@/components/trader/trader-ui";
import { AdaptiveTable, type Column } from "@/components/trader/adaptive-table";
import {
  DEFAULT_TRADES,
  formatPKR,
  formatQty,
  tradeValue,
  type Trade,
} from "@/lib/trader";

export default function TradeHistoryPage() {
  const [trades] = useState<Trade[]>(DEFAULT_TRADES);

  const closed = trades.filter((t) => t.status === "closed");
  const realisedPL = closed.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);
  const wins = closed.filter((t) => (t.profitLoss ?? 0) > 0).length;
  const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;

  const columns: Column<Trade>[] = [
    {
      key: "date",
      header: "Date",
      cell: (t) => <span className="tabular-nums">{t.executedAt}</span>,
    },
    {
      key: "name",
      header: "Commodity",
      hideOnCard: true,
      cell: (t) => (
        <div>
          <p className="font-medium text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-500">{t.symbol}</p>
        </div>
      ),
    },
    { key: "side", header: "Side", cell: (t) => <SideBadge side={t.side} /> },
    {
      key: "orderType",
      header: "Type",
      cell: (t) => <span className="capitalize">{t.orderType}</span>,
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      cell: (t) => `${formatQty(t.quantity)} ${t.unit}`,
    },
    {
      key: "rate",
      header: "Rate",
      align: "right",
      cell: (t) => formatPKR(t.rate),
    },
    {
      key: "value",
      header: "Value",
      align: "right",
      cell: (t) => formatPKR(tradeValue(t.quantity, t.rate)),
    },
    {
      key: "party",
      header: "Party",
      cell: (t) => t.party ?? <span className="text-slate-400">—</span>,
    },
    {
      key: "pl",
      header: "P&L",
      align: "right",
      cell: (t) =>
        t.profitLoss === null ? (
          <span className="text-slate-400">—</span>
        ) : (
          <PLValue value={t.profitLoss} formatted={formatPKR(t.profitLoss)} />
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => <StatusBadge status={t.status} />,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Trader", href: "/trader" },
          { label: "Trade History" },
        ]}
      />

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Trade History</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every executed order with its realised profit or loss.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Trades" value={String(trades.length)} />
        <StatCard label="Closed" value={String(closed.length)} />
        <StatCard
          label="Realised P&L"
          value={formatPKR(realisedPL)}
          tone={realisedPL >= 0 ? "profit" : "loss"}
        />
        <StatCard label="Profitable" value={`${winRate}%`} hint="Of closed trades" />
      </div>

      <AdaptiveTable
        rows={trades}
        columns={columns}
        getRowKey={(t) => t.id}
        cardTitle={(t) => t.name}
        cardSubtitle={(t) => `${t.executedAt} · ${t.party ?? "No party"}`}
        searchableText={(t) =>
          `${t.name} ${t.symbol} ${t.side} ${t.party ?? ""} ${t.status}`
        }
        searchPlaceholder="Search by commodity, party or status…"
        pageSize={15}
        emptyMessage="No trades recorded yet."
      />
    </div>
  );
}
