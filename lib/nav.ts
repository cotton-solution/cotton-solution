import {
  FileText,
  BarChart3,
  Handshake,
  Settings,
  Wheat,
} from "lucide-react";

export const navSections = [
  {
    label: "Accounts Forms",
    href: "/admin/accounts-forms",
    icon: FileText,
    description: "Vouchers & party master setup",
  },
  {
    label: "Accounts Reports",
    href: "/admin/accounts-reports",
    icon: BarChart3,
    description: "Ledgers, trial balance, P&L",
  },
  {
    label: "Brokerage",
    href: "/admin/brokerage",
    icon: Handshake,
    description: "Brokerage purchase & sale invoices",
  },
  {
    label: "General",
    href: "/admin/general",
    icon: Settings,
    description: "General purchase & sale invoices",
  },
  {
    label: "Crops",
    href: "/admin/crops",
    icon: Wheat,
    description: "Contracts, weighment & crop invoices",
  },
] as const;
