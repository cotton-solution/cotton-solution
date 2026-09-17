import {
  Wallet,
  Banknote,
  BookText,
  Landmark,
  ArrowRightLeft,
  Receipt,
  Users,
  ListTree,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
} from "lucide-react";

export const vouchers = [
  {
    label: "Cash Receiving Voucher",
    href: "/accounts-forms/cash-receiving-voucher",
    icon: Wallet,
    description: "Record cash received from a customer or party",
  },
  {
    label: "Cash Payment Voucher",
    href: "/accounts-forms/cash-payment-voucher",
    icon: Banknote,
    description: "Record cash paid to a vendor or party",
  },
  {
    label: "Journal Voucher",
    href: "/accounts-forms/journal-voucher",
    icon: BookText,
    description: "Post a manual debit/credit journal entry",
  },
  {
    label: "Bank Receipt Voucher",
    href: "/accounts-forms/bank-receipt-voucher",
    icon: ArrowDownToLine,
    description: "Customer payment received directly into a bank account",
  },
  {
    label: "Bank Payment Voucher",
    href: "/accounts-forms/bank-payment-voucher",
    icon: ArrowUpFromLine,
    description: "Pay a vendor by bank transfer, online payment, or pay order",
  },
  {
    label: "Contra Voucher",
    href: "/accounts-forms/contra-voucher",
    icon: Repeat,
    description: "Move your own money between cash and a bank account",
  },
  {
    label: "Bank Cheque Deposit",
    href: "/accounts-forms/bank-cheque-deposit",
    icon: Landmark,
    description: "Deposit a received cheque into a bank account",
  },
  {
    label: "Bank Cheque Issue",
    href: "/accounts-forms/bank-cheque-issue",
    icon: ArrowRightLeft,
    description: "Issue a cheque against a bank account",
  },
  {
    label: "Cash Payment Voucher (WHT)",
    href: "/accounts-forms/cash-payment-voucher-wht",
    icon: Receipt,
    description: "Cash payment with withholding tax deduction",
  },
] as const;

export const partyMasterCard = {
  label: "Customers / Party Master",
  href: "/accounts-forms/party-master",
  icon: Users,
  description: "Add, edit, and manage customer and party profiles",
} as const;

export const chartOfAccountsCard = {
  label: "Chart of Accounts",
  href: "/accounts-forms/chart-of-accounts",
  icon: ListTree,
  description: "Create and organize the accounts used across the business",
} as const;

export const masterSetupCards = [partyMasterCard, chartOfAccountsCard] as const;
