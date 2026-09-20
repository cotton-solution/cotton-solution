import { mockParties } from "@/lib/party-data";
import type { InvoiceCategory } from "@/lib/supabase/invoices";
import type { VoucherType } from "@/lib/supabase/vouchers";

/**
 * Believable saved records for demo mode, so the list pages have
 * something to search and filter instead of an empty state on first
 * run. Shaped exactly like the Supabase fetch results so the list
 * components never need to know which source they got.
 */

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export type DemoInvoice = {
  id: string;
  invoiceNo: string;
  category: InvoiceCategory;
  invoiceType: "purchase" | "sale";
  invoiceDate: string;
  partyId: string | null;
  subtotal: number;
  brokerageAmount: number;
  netTotal: number;
  notes: string | null;
};

const PREFIX: Record<InvoiceCategory, { purchase: string; sale: string }> = {
  brokerage: { purchase: "BPI", sale: "BSI" },
  general: { purchase: "GPI", sale: "GSI" },
  crop: { purchase: "CPI", sale: "CSI" },
};

export function demoInvoices(category: InvoiceCategory): DemoInvoice[] {
  const parties = mockParties;
  const rows: DemoInvoice[] = [];
  let seq = 4821;
  for (let i = 0; i < 9; i++) {
    const type: "purchase" | "sale" = i % 2 === 0 ? "sale" : "purchase";
    const subtotal = 250000 + ((i * 137) % 9) * 180000;
    const brokerage =
      category !== "general" ? Math.round(subtotal * 0.012) : 0;
    rows.push({
      id: `demo-inv-${category}-${i}`,
      invoiceNo: `${PREFIX[category][type]}-${seq--}`,
      category,
      invoiceType: type,
      invoiceDate: isoDaysAgo(i * 4),
      partyId: parties[i % parties.length]?.id ?? null,
      subtotal,
      brokerageAmount: brokerage,
      netTotal: subtotal - brokerage,
      notes: i === 2 ? "Advance adjusted against contract" : null,
    });
  }
  return rows;
}

export type DemoVoucher = {
  id: string;
  voucherNo: string;
  voucherType: VoucherType | "journal";
  date: string;
  partyId: string | null;
  bankAccount: string | null;
  chequeNo: string | null;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  narration: string | null;
};

const VOUCHER_PREFIX: Record<VoucherType | "journal", string> = {
  cash_receiving: "CRV",
  cash_payment: "CPV",
  cash_payment_wht: "CPV",
  bank_receipt: "BRV",
  bank_payment: "BPV",
  bank_cheque_deposit: "BCD",
  bank_cheque_issue: "BCI",
  contra_cash_to_bank: "CTV",
  contra_bank_to_cash: "CTV",
  ibft: "IBFT",
  journal: "JV",
};

const VOUCHER_CYCLE: (VoucherType | "journal")[] = [
  "cash_receiving",
  "cash_payment",
  "bank_receipt",
  "bank_payment",
  "journal",
  "bank_cheque_deposit",
  "ibft",
  "cash_payment_wht",
];

export function demoVouchers(): DemoVoucher[] {
  const parties = mockParties;
  const rows: DemoVoucher[] = [];
  let seq = 1180;
  for (let i = 0; i < 12; i++) {
    const type = VOUCHER_CYCLE[i % VOUCHER_CYCLE.length];
    const amount = 120000 + ((i * 211) % 11) * 65000;
    const isParty = !["journal", "ibft", "contra_cash_to_bank", "contra_bank_to_cash"].includes(
      type
    );
    const wht = type === "cash_payment_wht" ? Math.round(amount * 0.045) : 0;
    rows.push({
      id: `demo-vch-${i}`,
      voucherNo: `${VOUCHER_PREFIX[type]}-${seq--}`,
      voucherType: type,
      date: isoDaysAgo(i * 2),
      partyId: isParty ? parties[i % parties.length]?.id ?? null : null,
      bankAccount: type.startsWith("bank") || type.startsWith("contra") || type === "ibft"
        ? "HBL - Multan Cotton Market Branch (...4567)"
        : null,
      chequeNo: type.includes("cheque") ? `${100000 + i}` : null,
      grossAmount: amount,
      whtAmount: wht,
      netAmount: amount - wht,
      narration: i === 4 ? "Advance against next season's crop" : null,
    });
  }
  return rows;
}
