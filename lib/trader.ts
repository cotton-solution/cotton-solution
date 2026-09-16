/**
 * ============================================================
 * TRADER MODULE — domain model
 * ------------------------------------------------------------
 * Commodity trading for the "Trader" business category:
 * live market rates, open positions (stock in hand), buy/sell
 * execution and realised/unrealised profit & loss.
 *
 * Units follow the same convention as the Crops module
 * (Maund = 40 kg, Bale = 155 kg).
 * ============================================================
 */

export type TradeSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type TradeStatus = "open" | "closed" | "pending";

export type MarketRate = {
  symbol: string;
  name: string;
  unit: string;
  /** Current market rate in PKR per unit. */
  rate: number;
  /** Change vs previous close, in PKR per unit. */
  change: number;
  market: string;
};

export type Position = {
  id: string;
  symbol: string;
  name: string;
  unit: string;
  side: TradeSide;
  /** Quantity in the symbol's own unit. */
  quantity: number;
  /** Weighted average rate the position was opened at. */
  avgRate: number;
  openedAt: string;
  status: TradeStatus;
};

export type Trade = {
  id: string;
  symbol: string;
  name: string;
  unit: string;
  side: TradeSide;
  orderType: OrderType;
  quantity: number;
  rate: number;
  /** Realised P&L in PKR — null while the trade is still open. */
  profitLoss: number | null;
  party: string | null;
  status: TradeStatus;
  executedAt: string;
};

/** A draft order held in the execution panel (auto-saved to localStorage). */
export type OrderDraft = {
  symbol: string;
  side: TradeSide;
  orderType: OrderType;
  quantity: string;
  rate: string;
  stopLoss: string;
  takeProfit: string;
  party: string;
};

export const EMPTY_ORDER_DRAFT: OrderDraft = {
  symbol: "",
  side: "buy",
  orderType: "market",
  quantity: "",
  rate: "",
  stopLoss: "",
  takeProfit: "",
  party: "",
};

/** localStorage key for the auto-saved order draft. */
export const ORDER_DRAFT_KEY = "bem:trader:order-draft";

// ------------------------------------------------------------
// Calculations
// ------------------------------------------------------------

/** Gross value of a quantity at a rate. */
export function tradeValue(quantity: number, rate: number): number {
  return quantity * rate;
}

/**
 * Unrealised P&L of an open position at the current market rate.
 * A buy position gains when the market rises; a sell position
 * gains when the market falls.
 */
export function unrealisedPL(position: Position, marketRate: number): number {
  const diff =
    position.side === "buy"
      ? marketRate - position.avgRate
      : position.avgRate - marketRate;
  return diff * position.quantity;
}

/** Total capital tied up in open positions. */
export function usedMargin(positions: Position[]): number {
  return positions
    .filter((p) => p.status === "open")
    .reduce((sum, p) => sum + tradeValue(p.quantity, p.avgRate), 0);
}

/** PKR formatting used across the trader screens. */
export function formatPKR(value: number, withDecimals = false): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(value);
}

/** Compact number formatting for quantities. */
export function formatQty(value: number): string {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 2,
  }).format(value);
}

// ------------------------------------------------------------
// Seed data — replace with Supabase queries once the tables
// from supabase/migration_4_trader.sql are created.
// ------------------------------------------------------------

export const DEFAULT_MARKET_RATES: MarketRate[] = [
  {
    symbol: "COT-PB",
    name: "Cotton (Punjab)",
    unit: "Maund",
    rate: 18450,
    change: 125,
    market: "Multan",
  },
  {
    symbol: "COT-SD",
    name: "Cotton (Sindh)",
    unit: "Maund",
    rate: 18200,
    change: -80,
    market: "Sukkur",
  },
  {
    symbol: "PHUTTI",
    name: "Phutti (Seed Cotton)",
    unit: "Maund",
    rate: 8600,
    change: 60,
    market: "Bahawalpur",
  },
  {
    symbol: "BANOLA",
    name: "Banola (Cotton Seed)",
    unit: "Maund",
    rate: 4350,
    change: -25,
    market: "Khairpur Tamewali",
  },
  {
    symbol: "KHAL",
    name: "Khal (Oil Cake)",
    unit: "Maund",
    rate: 5100,
    change: 0,
    market: "Bahawalpur",
  },
  {
    symbol: "WHEAT",
    name: "Wheat",
    unit: "Maund",
    rate: 3900,
    change: 45,
    market: "Lahore",
  },
];

export const DEFAULT_POSITIONS: Position[] = [
  {
    id: "pos-1",
    symbol: "COT-PB",
    name: "Cotton (Punjab)",
    unit: "Maund",
    side: "buy",
    quantity: 320,
    avgRate: 18100,
    openedAt: "2026-09-02",
    status: "open",
  },
  {
    id: "pos-2",
    symbol: "PHUTTI",
    name: "Phutti (Seed Cotton)",
    unit: "Maund",
    side: "buy",
    quantity: 1150,
    avgRate: 8720,
    openedAt: "2026-09-05",
    status: "open",
  },
  {
    id: "pos-3",
    symbol: "BANOLA",
    name: "Banola (Cotton Seed)",
    unit: "Maund",
    side: "sell",
    quantity: 480,
    avgRate: 4420,
    openedAt: "2026-09-09",
    status: "open",
  },
];

export const DEFAULT_TRADES: Trade[] = [
  {
    id: "trd-1",
    symbol: "COT-PB",
    name: "Cotton (Punjab)",
    unit: "Maund",
    side: "buy",
    orderType: "market",
    quantity: 320,
    rate: 18100,
    profitLoss: null,
    party: "Al-Barkat Cotton Factory",
    status: "open",
    executedAt: "2026-09-02",
  },
  {
    id: "trd-2",
    symbol: "WHEAT",
    name: "Wheat",
    unit: "Maund",
    side: "buy",
    orderType: "limit",
    quantity: 600,
    rate: 3820,
    profitLoss: 48000,
    party: "Ghani Traders",
    status: "closed",
    executedAt: "2026-08-28",
  },
  {
    id: "trd-3",
    symbol: "WHEAT",
    name: "Wheat",
    unit: "Maund",
    side: "sell",
    orderType: "market",
    quantity: 600,
    rate: 3900,
    profitLoss: 48000,
    party: "Ghani Traders",
    status: "closed",
    executedAt: "2026-09-04",
  },
  {
    id: "trd-4",
    symbol: "BANOLA",
    name: "Banola (Cotton Seed)",
    unit: "Maund",
    side: "sell",
    orderType: "limit",
    quantity: 480,
    rate: 4420,
    profitLoss: null,
    party: "Rahim Oil Mills",
    status: "open",
    executedAt: "2026-09-09",
  },
  {
    id: "trd-5",
    symbol: "PHUTTI",
    name: "Phutti (Seed Cotton)",
    unit: "Maund",
    side: "buy",
    orderType: "market",
    quantity: 400,
    rate: 8900,
    profitLoss: -34000,
    party: "Chishtian Ginners",
    status: "closed",
    executedAt: "2026-08-21",
  },
];
