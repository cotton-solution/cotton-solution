import { recentMonthKeys } from "@/lib/format";

/**
 * ============================================================
 * DASHBOARD DATA MODEL
 * ------------------------------------------------------------
 * One shape that the dashboard renders, whether the numbers
 * came from Supabase (lib/supabase/dashboard.ts) or from the
 * demo set below. Keeping the shape in one place means the UI
 * never has to know which source it got.
 * ============================================================
 */

export type CashLine = {
  /** "Cash in Hand", "Meezan Bank - 0142", ... */
  label: string;
  kind: "cash" | "bank";
  balance: number;
  /** Bank account tail or short note shown under the label. */
  note?: string;
};

export type MonthPoint = {
  key: string; // YYYY-MM
  moneyIn: number;
  moneyOut: number;
  sales: number;
  purchases: number;
};

export type AgeingBucket = {
  label: string; // "0-30", "31-60", ...
  receivable: number;
  payable: number;
};

export type PartyBalance = {
  partyId: string;
  name: string;
  town?: string;
  balance: number; // + = they owe you, - = you owe them
};

export type ActivityItem = {
  id: string;
  kind:
    | "sale_invoice"
    | "purchase_invoice"
    | "receipt"
    | "payment"
    | "journal"
    | "contra";
  title: string;
  party?: string;
  reference: string;
  amount: number;
  date: string; // ISO date
};

export type DashboardData = {
  cashLines: CashLine[];
  /** Current period totals + same-length previous period for the delta. */
  totals: {
    sales: number;
    salesPrev: number;
    purchases: number;
    purchasesPrev: number;
    brokerage: number;
    brokeragePrev: number;
    expenses: number;
    expensesPrev: number;
    receivable: number;
    payable: number;
    overdueReceivable: number;
  };
  months: MonthPoint[];
  ageing: AgeingBucket[];
  topParties: PartyBalance[];
  activity: ActivityItem[];
};

export const EMPTY_DASHBOARD: DashboardData = {
  cashLines: [],
  totals: {
    sales: 0,
    salesPrev: 0,
    purchases: 0,
    purchasesPrev: 0,
    brokerage: 0,
    brokeragePrev: 0,
    expenses: 0,
    expensesPrev: 0,
    receivable: 0,
    payable: 0,
    overdueReceivable: 0,
  },
  months: [],
  ageing: [],
  topParties: [],
  activity: [],
};

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * A believable cotton/wheat commission agent's book: seasonal peaks
 * around the picking season, a handful of ginners and growers on the
 * ledger, and a cash position split across two banks.
 */
export function buildDemoDashboard(): DashboardData {
  const keys = recentMonthKeys(12);

  // Cotton season peaks Sep-Dec; wheat moves Apr-May. The multiplier
  // below shapes the 12-month series so the chart isn't flat noise.
  const seasonal: Record<number, number> = {
    1: 0.55, 2: 0.5, 3: 0.65, 4: 1.15, 5: 1.25, 6: 0.7,
    7: 0.6, 8: 0.85, 9: 1.35, 10: 1.55, 11: 1.4, 12: 1.0,
  };

  const months: MonthPoint[] = keys.map((key, i) => {
    const month = Number(key.split("-")[1]);
    const factor = seasonal[month] ?? 1;
    const drift = 1 + i * 0.015;
    const sales = Math.round(4200000 * factor * drift);
    const purchases = Math.round(sales * 0.86);
    return {
      key,
      sales,
      purchases,
      moneyIn: Math.round(sales * 0.78),
      moneyOut: Math.round(purchases * 0.81),
    };
  });

  const cur = months[months.length - 1];
  const prev = months[months.length - 2] ?? cur;

  return {
    cashLines: [
      { label: "Cash in Hand", kind: "cash", balance: 1842300 },
      {
        label: "Meezan Bank",
        kind: "bank",
        note: "Current · 0142",
        balance: 28340500,
      },
      {
        label: "HBL",
        kind: "bank",
        note: "Current · 7719",
        balance: 11268400,
      },
      {
        label: "Bank Alfalah",
        kind: "bank",
        note: "Current · 3308",
        balance: -1450000,
      },
    ],
    totals: {
      sales: cur.sales,
      salesPrev: prev.sales,
      purchases: cur.purchases,
      purchasesPrev: prev.purchases,
      brokerage: Math.round(cur.sales * 0.012),
      brokeragePrev: Math.round(prev.sales * 0.012),
      expenses: 486000,
      expensesPrev: 521000,
      receivable: 18742600,
      payable: 12385900,
      overdueReceivable: 6420000,
    },
    months,
    ageing: [
      { label: "0–30", receivable: 8420000, payable: 6180000 },
      { label: "31–60", receivable: 5102600, payable: 3205900 },
      { label: "61–90", receivable: 3120000, payable: 1800000 },
      { label: "90+", receivable: 2100000, payable: 1200000 },
    ],
    topParties: [
      { partyId: "6210001", name: "Al-Noor Ginning Factory", town: "Vehari", balance: 5840000 },
      { partyId: "6210004", name: "Rehmat Cotton Traders", town: "Burewala", balance: 4120500 },
      { partyId: "6210002", name: "Haji Ashraf & Sons", town: "Multan", balance: 3260000 },
      { partyId: "6210007", name: "Sunrise Textile Mills", town: "Faisalabad", balance: -2780000 },
      { partyId: "6210003", name: "Muhammad Younas Grower", town: "Khanewal", balance: 1980400 },
    ],
    activity: [
      {
        id: "a1",
        kind: "sale_invoice",
        title: "Sale invoice issued",
        party: "Sunrise Textile Mills",
        reference: "BSI-4821",
        amount: 3240000,
        date: isoDaysAgo(0),
      },
      {
        id: "a2",
        kind: "receipt",
        title: "Cash received",
        party: "Al-Noor Ginning Factory",
        reference: "CRV-1180",
        amount: 1500000,
        date: isoDaysAgo(0),
      },
      {
        id: "a3",
        kind: "purchase_invoice",
        title: "Purchase invoice recorded",
        party: "Muhammad Younas Grower",
        reference: "BPI-2260",
        amount: 2185000,
        date: isoDaysAgo(1),
      },
      {
        id: "a4",
        kind: "payment",
        title: "Bank payment made",
        party: "Rehmat Cotton Traders",
        reference: "BPV-0912",
        amount: 980000,
        date: isoDaysAgo(2),
      },
      {
        id: "a5",
        kind: "contra",
        title: "Cash moved to bank",
        reference: "CNV-0071",
        amount: 2000000,
        date: isoDaysAgo(3),
      },
      {
        id: "a6",
        kind: "journal",
        title: "Journal voucher posted",
        reference: "JV-0345",
        amount: 145000,
        date: isoDaysAgo(4),
      },
      {
        id: "a7",
        kind: "sale_invoice",
        title: "Sale invoice issued",
        party: "Haji Ashraf & Sons",
        reference: "BSI-4818",
        amount: 1760000,
        date: isoDaysAgo(5),
      },
      {
        id: "a8",
        kind: "receipt",
        title: "Cheque deposited",
        party: "Haji Ashraf & Sons",
        reference: "BCD-0455",
        amount: 1200000,
        date: isoDaysAgo(6),
      },
    ],
  };
}
