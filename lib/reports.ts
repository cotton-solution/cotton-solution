import {
  BookOpenText,
  HandCoins,
  Landmark,
  Wallet,
  ListChecks,
  Scale,
  TrendingUp,
  FileBarChart,
} from "lucide-react";

export const reports = [
  {
    label: "General Ledger",
    href: "/reports/account-ledger",
    icon: BookOpenText,
    description: "Detailed transaction history for any account",
    /** Opens the Account Ledger filter popup instead of jumping straight in. */
    dialog: "account-ledger" as const,
  },
  {
    label: "Accounts Balances",
    href: "/reports/account-balances",
    icon: Scale,
    description: "Closing balance of every account, with filters",
    dialog: "account-balances" as const,
  },
  {
    label: "Account Payable",
    href: "/reports/account-payable",
    icon: HandCoins,
    description: "Outstanding balances owed to vendors",
  },
  {
    label: "Account Receivable",
    href: "/reports/account-receivable",
    icon: HandCoins,
    description: "Outstanding balances owed by customers",
  },
  {
    label: "Bank Statement",
    href: "/reports/bank-statement",
    icon: Landmark,
    description: "Bank-wise deposits, withdrawals & balance",
  },
  {
    label: "Cash Book",
    href: "/reports/cash-book",
    icon: Wallet,
    description: "Daily cash inflows and outflows",
  },
  {
    label: "Daily Vouchers Details",
    href: "/reports/daily-vouchers",
    icon: ListChecks,
    description: "All vouchers posted on a given day",
  },
  {
    label: "Trial Balance",
    href: "/reports/trial-balance",
    icon: Scale,
    description: "Debit/credit balances across all accounts",
  },
  {
    label: "Profit & Loss Statement",
    href: "/reports/profit-and-loss",
    icon: TrendingUp,
    description: "Income and expenses for a period",
  },
  {
    label: "Balance Sheet",
    href: "/reports/balance-sheet",
    icon: FileBarChart,
    description: "Assets, liabilities & equity snapshot",
  },
] as const;
