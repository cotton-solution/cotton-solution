import {
  Wallet,
  Banknote,
  BookText,
  Landmark,
  ArrowRightLeft,
  Receipt,
  Users,
} from "lucide-react";

export const vouchers = [
  {
    label: "Cash Receiving Voucher",
    href: "/admin/accounts-forms/cash-receiving-voucher",
    icon: Wallet,
    description: "Record cash received from a customer or party",
  },
  {
    label: "Cash Payment Voucher",
    href: "/admin/accounts-forms/cash-payment-voucher",
    icon: Banknote,
    description: "Record cash paid to a vendor or party",
  },
  {
    label: "Journal Voucher",
    href: "/admin/accounts-forms/journal-voucher",
    icon: BookText,
    description: "Post a manual debit/credit journal entry",
  },
  {
    label: "Bank Cheque Deposit",
    href: "/admin/accounts-forms/bank-cheque-deposit",
    icon: Landmark,
    description: "Deposit a received cheque into a bank account",
  },
  {
    label: "Bank Cheque Issue",
    href: "/admin/accounts-forms/bank-cheque-issue",
    icon: ArrowRightLeft,
    description: "Issue a cheque against a bank account",
  },
  {
    label: "Cash Payment Voucher (WHT)",
    href: "/admin/accounts-forms/cash-payment-voucher-wht",
    icon: Receipt,
    description: "Cash payment with withholding tax deduction",
  },
] as const;

export const partyMasterCard = {
  label: "Customers / Party Master",
  href: "/admin/accounts-forms/party-master",
  icon: Users,
  description: "Add, edit, and manage customer and party profiles",
} as const;
