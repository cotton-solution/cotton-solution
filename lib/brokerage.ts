import { FileSpreadsheet, FileStack, ShoppingCart, ReceiptText } from "lucide-react";

export const brokerageCards = [
  {
    label: "Brokerage Purchase Invoice",
    href: "/admin/brokerage/purchase-invoice",
    icon: ShoppingCart,
    description: "Invoice a purchase made on behalf of a party for commission",
  },
  {
    label: "Brokerage Sale Invoice",
    href: "/admin/brokerage/sale-invoice",
    icon: ReceiptText,
    description: "Invoice a sale made on behalf of a party for commission",
  },
  {
    label: "Multi Invoice",
    href: "/admin/brokerage/multi-invoice",
    icon: FileSpreadsheet,
    description: "Enter several brokerage invoices in one batch",
  },
  {
    label: "Multi Invoice New",
    href: "/admin/brokerage/multi-invoice-new",
    icon: FileStack,
    description: "Updated multi-invoice entry layout",
  },
] as const;
