import {
  Wallet,
  Banknote,
  BookText,
  ArrowRightLeft,
  Receipt,
  Users,
  ListTree,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

export type VoucherGroup = "Receipts" | "Payments" | "Adjustments";

export const vouchers = [
  /* ---------------- 1. Receipts ---------------- */
  {
    group: "Receipts",
    label: "Cash Receiving Voucher",
    href: "/transactions/cash-receiving-voucher",
    icon: Wallet,
    description: "Record cash received from a customer or party",
  },
  {
    group: "Receipts",
    label: "Bank Receipts Voucher",
    href: "/transactions/bank-receipt-voucher",
    icon: ArrowDownToLine,
    description: "Customer payment received directly into a bank account",
  },

  /* ---------------- 2. Payments ---------------- */
  {
    group: "Payments",
    label: "Cash Payment Voucher",
    href: "/transactions/cash-payment-voucher",
    icon: Banknote,
    description: "Record cash paid to a vendor or party",
  },
  {
    group: "Payments",
    label: "Bank Issue Voucher",
    href: "/transactions/bank-issue-voucher",
    icon: ArrowUpFromLine,
    description: "Pay a vendor by bank transfer, online payment, or pay order",
  },
  {
    group: "Payments",
    label: "Cash Payment Voucher (WHT)",
    href: "/transactions/cash-payment-voucher-wht",
    icon: Receipt,
    description: "Cash payment with withholding tax deduction",
  },

  /* ---------------- 3. Adjustments ---------------- */
  {
    group: "Adjustments",
    label: "Journal Voucher",
    href: "/transactions/journal-voucher",
    icon: BookText,
    description: "Post a manual debit/credit journal entry",
  },
  {
    group: "Adjustments",
    label: "IBFT (Inter Bank Fund Transfer)",
    href: "/transactions/ibft",
    icon: ArrowRightLeft,
    description: "Transfer funds from one bank account to another",
  },
] as const;

/** The vouchers above, split into the three sections the page shows. */
export const voucherGroups: {
  title: VoucherGroup;
  items: (typeof vouchers)[number][];
}[] = (["Receipts", "Payments", "Adjustments"] as const).map((title) => ({
  title,
  items: vouchers.filter((v) => v.group === title),
}));

export const partyMasterCard = {
  label: "Customers / Party Master",
  href: "/sales/customers",
  icon: Users,
  description: "Add, edit, and manage customer and party profiles",
} as const;

export const chartOfAccountsCard = {
  label: "Chart of Accounts",
  href: "/settings/chart-of-accounts",
  icon: ListTree,
  description: "Create and organize the accounts used across the business",
} as const;

export const masterSetupCards = [partyMasterCard, chartOfAccountsCard] as const;
