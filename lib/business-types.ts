export type BusinessType =
  | "shopkeeper"
  | "wholesaler"
  | "distributor"
  | "trader"
  | "manufacturer";

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "shopkeeper", label: "Shopkeeper" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "distributor", label: "Distributor" },
  { value: "trader", label: "Trader" },
  { value: "manufacturer", label: "Manufacturer" },
];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  shopkeeper: "Shopkeeper",
  wholesaler: "Wholesaler",
  distributor: "Distributor",
  trader: "Trader",
  manufacturer: "Manufacturer",
};

export const BUSINESS_TYPE_STYLES: Record<BusinessType, string> = {
  shopkeeper: "bg-sky-50 text-sky-700",
  wholesaler: "bg-violet-50 text-violet-700",
  distributor: "bg-amber-50 text-amber-700",
  trader: "bg-teal-50 text-teal-700",
  manufacturer: "bg-rose-50 text-rose-700",
};
