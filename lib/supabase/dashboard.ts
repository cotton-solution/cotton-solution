import { supabase } from "@/lib/supabase/client";
import { monthKey, recentMonthKeys } from "@/lib/format";
import {
  buildDemoDashboard,
  type ActivityItem,
  type AgeingBucket,
  type CashLine,
  type DashboardData,
  type MonthPoint,
  type PartyBalance,
} from "@/lib/dashboard";

/**
 * Builds the dashboard from the rows the app actually writes today:
 * `invoices` (sale / purchase) and `vouchers` (receipts, payments,
 * cheques, contra). Once double-entry posting into `transactions`
 * lands, these aggregates can be swapped for ledger balances without
 * the dashboard UI changing at all.
 */

type VoucherRow = {
  id: string;
  voucher_no: string;
  voucher_type: string;
  voucher_date: string;
  party_id: string | null;
  bank_account: string | null;
  to_bank_account?: string | null;
  net_amount: number | string | null;
  gross_amount: number | string | null;
};

type InvoiceRow = {
  id: string;
  invoice_no: string;
  invoice_type: string;
  invoice_date: string;
  party_id: string | null;
  net_total: number | string | null;
  brokerage_amount: number | string | null;
};

const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;

/** Vouchers that increase money, split by where the money lands. */
const CASH_IN = new Set(["cash_receiving", "contra_bank_to_cash"]);
const CASH_OUT = new Set([
  "cash_payment",
  "cash_payment_wht",
  "contra_cash_to_bank",
]);
const BANK_IN = new Set([
  "bank_receipt",
  "bank_cheque_deposit",
  "contra_cash_to_bank",
]);
const BANK_OUT = new Set([
  "bank_payment",
  "bank_cheque_issue",
  "contra_bank_to_cash",
  "ibft",
]);
/** Money actually collected from / paid to a party (not internal moves). */
const PARTY_IN = new Set([
  "cash_receiving",
  "bank_receipt",
  "bank_cheque_deposit",
]);
const PARTY_OUT = new Set([
  "cash_payment",
  "cash_payment_wht",
  "bank_payment",
  "bank_cheque_issue",
]);

/**
 * Recent vouchers for the dashboard. `to_bank_account` (IBFT destination)
 * only exists after migration_8, so if that column isn't there yet fall
 * back to the older column list instead of failing the whole dashboard.
 */
async function fetchDashboardVouchers(since: string) {
  const COLUMNS =
    "id, voucher_no, voucher_type, voucher_date, party_id, bank_account, net_amount, gross_amount";
  const run = (columns: string) =>
    supabase!
      .from("vouchers")
      .select(columns)
      .gte("voucher_date", since)
      .order("voucher_date", { ascending: false });

  const withTo = await run(`${COLUMNS}, to_bank_account`);
  return withTo.error ? run(COLUMNS) : withTo;
}

export async function fetchDashboard(): Promise<{
  data: DashboardData;
  source: "supabase" | "demo";
  error: string | null;
}> {
  if (!supabase) {
    return { data: buildDemoDashboard(), source: "demo", error: null };
  }

  const since = recentMonthKeys(12)[0] + "-01";

  const [vouchersRes, invoicesRes, partiesRes] = await Promise.all([
    fetchDashboardVouchers(since),
    supabase
      .from("invoices")
      .select(
        "id, invoice_no, invoice_type, invoice_date, party_id, net_total, brokerage_amount"
      )
      .gte("invoice_date", since)
      .order("invoice_date", { ascending: false }),
    supabase.from("parties_customers").select("party_id, name, town"),
  ]);

  const error =
    vouchersRes.error?.message ??
    invoicesRes.error?.message ??
    partiesRes.error?.message ??
    null;

  if (error) {
    return { data: buildDemoDashboard(), source: "demo", error };
  }

  const vouchers = (vouchersRes.data ?? []) as unknown as VoucherRow[];
  const invoices = (invoicesRes.data ?? []) as InvoiceRow[];
  const partyName = new Map<string, { name: string; town?: string }>();
  for (const p of (partiesRes.data ?? []) as {
    party_id: string;
    name: string;
    town: string | null;
  }[]) {
    partyName.set(p.party_id, { name: p.name, town: p.town ?? undefined });
  }

  // A brand-new business has nothing to chart yet — say so rather than
  // drawing empty axes.
  if (vouchers.length === 0 && invoices.length === 0) {
    return {
      data: {
        ...buildDemoDashboard(),
        cashLines: [{ label: "Cash in Hand", kind: "cash", balance: 0 }],
        totals: {
          sales: 0, salesPrev: 0, purchases: 0, purchasesPrev: 0,
          brokerage: 0, brokeragePrev: 0, expenses: 0, expensesPrev: 0,
          receivable: 0, payable: 0, overdueReceivable: 0,
        },
        months: recentMonthKeys(12).map((key) => ({
          key, moneyIn: 0, moneyOut: 0, sales: 0, purchases: 0,
        })),
        ageing: [],
        topParties: [],
        activity: [],
      },
      source: "supabase",
      error: null,
    };
  }

  /* ---------------- cash & bank position ---------------- */
  let cash = 0;
  const banks = new Map<string, number>();

  for (const v of vouchers) {
    const amount = num(v.net_amount) || num(v.gross_amount);
    if (CASH_IN.has(v.voucher_type)) cash += amount;
    if (CASH_OUT.has(v.voucher_type)) cash -= amount;

    const bank = v.bank_account?.trim();
    if (bank) {
      const current = banks.get(bank) ?? 0;
      if (BANK_IN.has(v.voucher_type)) banks.set(bank, current + amount);
      else if (BANK_OUT.has(v.voucher_type)) banks.set(bank, current - amount);
    }

    // IBFT: money leaves `bank_account` (BANK_OUT above) and lands in the
    // destination bank.
    if (v.voucher_type === "ibft") {
      const toBank = v.to_bank_account?.trim();
      if (toBank) banks.set(toBank, (banks.get(toBank) ?? 0) + amount);
    }
  }

  const cashLines: CashLine[] = [
    { label: "Cash in Hand", kind: "cash", balance: cash },
    ...[...banks.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, balance]) => ({
        label,
        kind: "bank" as const,
        balance,
      })),
  ];

  /* ---------------- 12-month series ---------------- */
  const keys = recentMonthKeys(12);
  const byMonth = new Map<string, MonthPoint>(
    keys.map((key) => [key, { key, moneyIn: 0, moneyOut: 0, sales: 0, purchases: 0 }])
  );

  for (const v of vouchers) {
    const point = byMonth.get(monthKey(v.voucher_date));
    if (!point) continue;
    const amount = num(v.net_amount) || num(v.gross_amount);
    if (PARTY_IN.has(v.voucher_type)) point.moneyIn += amount;
    if (PARTY_OUT.has(v.voucher_type)) point.moneyOut += amount;
  }

  for (const inv of invoices) {
    const point = byMonth.get(monthKey(inv.invoice_date));
    if (!point) continue;
    if (inv.invoice_type === "sale") point.sales += num(inv.net_total);
    else point.purchases += num(inv.net_total);
  }

  const months = keys.map((k) => byMonth.get(k)!);
  const cur = months[months.length - 1];
  const prev = months[months.length - 2] ?? cur;

  const brokerageFor = (key: string) =>
    invoices
      .filter((i) => monthKey(i.invoice_date) === key)
      .reduce((s, i) => s + num(i.brokerage_amount), 0);

  /* ---------------- party balances, receivable / payable ---------------- */
  const balances = new Map<string, number>();
  const bump = (partyId: string | null, delta: number) => {
    if (!partyId) return;
    balances.set(partyId, (balances.get(partyId) ?? 0) + delta);
  };

  for (const inv of invoices) {
    bump(inv.party_id, inv.invoice_type === "sale" ? num(inv.net_total) : -num(inv.net_total));
  }
  for (const v of vouchers) {
    const amount = num(v.net_amount) || num(v.gross_amount);
    if (PARTY_IN.has(v.voucher_type)) bump(v.party_id, -amount);
    if (PARTY_OUT.has(v.voucher_type)) bump(v.party_id, amount);
  }

  let receivable = 0;
  let payable = 0;
  for (const value of balances.values()) {
    if (value > 0) receivable += value;
    else payable += -value;
  }

  const topParties: PartyBalance[] = [...balances.entries()]
    .filter(([, value]) => Math.abs(value) > 0.5)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 6)
    .map(([partyId, balance]) => ({
      partyId,
      name: partyName.get(partyId)?.name ?? partyId,
      town: partyName.get(partyId)?.town,
      balance,
    }));

  /* ---------------- ageing (by invoice age, unsettled first) ---------------- */
  const today = Date.now();
  const bucketFor = (iso: string) => {
    const days = Math.floor((today - new Date(iso).getTime()) / 86400000);
    if (days <= 30) return "0–30";
    if (days <= 60) return "31–60";
    if (days <= 90) return "61–90";
    return "90+";
  };
  const ageingMap = new Map<string, AgeingBucket>(
    ["0–30", "31–60", "61–90", "90+"].map((label) => [
      label,
      { label, receivable: 0, payable: 0 },
    ])
  );
  for (const inv of invoices) {
    const bucket = ageingMap.get(bucketFor(inv.invoice_date));
    if (!bucket) continue;
    if (inv.invoice_type === "sale") bucket.receivable += num(inv.net_total);
    else bucket.payable += num(inv.net_total);
  }
  const ageing = [...ageingMap.values()];
  const overdueReceivable = ageing
    .filter((b) => b.label !== "0–30")
    .reduce((s, b) => s + b.receivable, 0);

  /* ---------------- recent activity ---------------- */
  const voucherKind = (type: string): ActivityItem["kind"] => {
    if (type === "journal") return "journal";
    // "contra" is the dashboard's internal kind for own-money transfers
    // (drives the transfer icon); IBFT is one of those.
    if (type.startsWith("contra") || type === "ibft") return "contra";
    return PARTY_IN.has(type) ? "receipt" : "payment";
  };
  const voucherTitle: Record<string, string> = {
    cash_receiving: "Cash received",
    cash_payment: "Cash paid",
    cash_payment_wht: "Cash paid (WHT)",
    bank_receipt: "Bank receipt",
    bank_payment: "Bank payment made",
    bank_cheque_deposit: "Cheque deposited",
    bank_cheque_issue: "Cheque issued",
    contra_cash_to_bank: "Cash moved to bank",
    contra_bank_to_cash: "Bank cash withdrawn",
    ibft: "Bank-to-bank transfer (IBFT)",
    journal: "Journal voucher posted",
  };

  const activity: ActivityItem[] = [
    ...invoices.map<ActivityItem>((i) => ({
      id: `inv-${i.id}`,
      kind: i.invoice_type === "sale" ? "sale_invoice" : "purchase_invoice",
      title: i.invoice_type === "sale" ? "Sale invoice issued" : "Purchase invoice recorded",
      party: i.party_id ? partyName.get(i.party_id)?.name ?? i.party_id : undefined,
      reference: i.invoice_no,
      amount: num(i.net_total),
      date: i.invoice_date,
    })),
    ...vouchers.map<ActivityItem>((v) => ({
      id: `vch-${v.id}`,
      kind: voucherKind(v.voucher_type),
      title: voucherTitle[v.voucher_type] ?? "Voucher posted",
      party: v.party_id ? partyName.get(v.party_id)?.name ?? v.party_id : undefined,
      reference: v.voucher_no,
      amount: num(v.net_amount) || num(v.gross_amount),
      date: v.voucher_date,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return {
    data: {
      cashLines,
      totals: {
        sales: cur.sales,
        salesPrev: prev.sales,
        purchases: cur.purchases,
        purchasesPrev: prev.purchases,
        brokerage: brokerageFor(cur.key),
        brokeragePrev: brokerageFor(prev.key),
        // Expenses get their own module later; until then the cash-out
        // side of payment vouchers is the closest honest figure.
        expenses: cur.moneyOut,
        expensesPrev: prev.moneyOut,
        receivable,
        payable,
        overdueReceivable,
      },
      months,
      ageing,
      topParties,
      activity,
    },
    source: "supabase",
    error: null,
  };
}
