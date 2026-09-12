import {
  Ruler,
  FileSignature,
  Scale,
  ShoppingCart,
  ReceiptText,
} from "lucide-react";

export const cropCards = [
  {
    label: "Crop Units",
    href: "/admin/crops/units",
    icon: Ruler,
    description: "Standard crop unit setup (e.g. Cotton @ 40 KGS / Maund)",
  },
  {
    label: "Purchase Contracts",
    href: "/admin/crops/purchase-contracts",
    icon: FileSignature,
    description: "Forward purchase contract with a vendor",
  },
  {
    label: "Sale Contracts",
    href: "/admin/crops/sale-contracts",
    icon: FileSignature,
    description: "Forward sale contract with a customer",
  },
  {
    label: "Purchase Weighment",
    href: "/admin/crops/purchase-weighment",
    icon: Scale,
    description: "Weighbridge scale slip for an incoming purchase",
  },
  {
    label: "Sale Weighment",
    href: "/admin/crops/sale-weighment",
    icon: Scale,
    description: "Weighbridge scale slip for an outgoing sale",
  },
  {
    label: "Crop Purchase Invoice",
    href: "/admin/crops/purchase-invoice",
    icon: ShoppingCart,
    description: "Finalize a crop purchase invoice with commission",
  },
  {
    label: "Crop Sale Invoice",
    href: "/admin/crops/sale-invoice",
    icon: ReceiptText,
    description: "Finalize a crop sale invoice with commission",
  },
] as const;

export type CropUnit = {
  crop: string;
  unitName: string;
  kgsPerUnit: number;
};

export const defaultCropUnits: CropUnit[] = [
  { crop: "Cotton", unitName: "Maund", kgsPerUnit: 40 },
  { crop: "Wheat", unitName: "Maund", kgsPerUnit: 37.324 },
];

export const cropNames = ["Cotton", "Wheat", "Cotton Seed", "Cotton Phutti"];
