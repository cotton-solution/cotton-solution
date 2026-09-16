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
    label: "Account Ledger",
    href: "/accounts-reports/account-ledger",
    icon: BookOpenText,
    description: "Detailed transaction history for any account",
  },
  {
    label: "Account Payable",
    href: "/accounts-reports/account-payable",
    icon: HandCoins,
    description: "Outstanding balances owed to vendors",
  },
  {
    label: "Account Receivable",
    href: "/accounts-reports/account-receivable",
    icon: HandCoins,
    description: "Outstanding balances owed by customers",
  },
  {
    label: "Bank Statement",
    href: "/accounts-reports/bank-statement",
    icon: Landmark,
    description: "Bank-wise deposits, withdrawals & balance",
  },
  {
    label: "Cash Book",
    href: "/accounts-reports/cash-book",
    icon: Wallet,
    description: "Daily cash inflows and outflows",
  },
  {
    label: "Daily Vouchers Details",
    href: "/accounts-reports/daily-vouchers",
    icon: ListChecks,
    description: "All vouchers posted on a given day",
  },
  {
    label: "Trial Balance",
    href: "/accounts-reports/trial-balance",
    icon: Scale,
    description: "Debit/credit balances across all accounts",
  },
  {
    label: "Profit & Loss Statement",
    href: "/accounts-reports/profit-and-loss",
    icon: TrendingUp,
    description: "Income and expenses for a period",
  },
  {
    label: "Balance Sheet",
    href: "/accounts-reports/balance-sheet",
    icon: FileBarChart,
    description: "Assets, liabilities & equity snapshot",
  },
] as const;
