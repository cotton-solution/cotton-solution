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
    href: "/accounts-forms",
    icon: FileText,
    description: "Vouchers & party master setup",
  },
  {
    label: "Accounts Reports",
    href: "/accounts-reports",
    icon: BarChart3,
    description: "Ledgers, trial balance, P&L",
  },
  {
    label: "Brokerage",
    href: "/brokerage",
    icon: Handshake,
    description: "Brokerage purchase & sale invoices",
  },
  {
    label: "General",
    href: "/general",
    icon: Settings,
    description: "General purchase & sale invoices",
  },
  {
    label: "Crops",
    href: "/crops",
    icon: Wheat,
    description: "Contracts, weighment & crop invoices",
  },
] as const;
