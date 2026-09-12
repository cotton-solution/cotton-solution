import { FileSpreadsheet, ShoppingCart, ReceiptText } from "lucide-react";

export const generalCards = [
  {
    label: "Purchase Invoice",
    href: "/admin/general/purchase-invoice",
    icon: ShoppingCart,
    description: "Record a direct purchase invoice",
  },
  {
    label: "Sale Invoice",
    href: "/admin/general/sale-invoice",
    icon: ReceiptText,
    description: "Record a direct sale invoice",
  },
  {
    label: "Multi Invoice",
    href: "/admin/general/multi-invoice",
    icon: FileSpreadsheet,
    description: "Enter several general invoices in one batch",
  },
] as const;
