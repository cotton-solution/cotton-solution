import {
  FileText,
  BarChart3,
  Handshake,
  Settings,
  Wheat,
  CandlestickChart,
  type LucideIcon,
} from "lucide-react";
import type { BusinessCategory } from "@/lib/supabase/businesses";

/**
 * ============================================================
 * MODULE REGISTRY
 * ------------------------------------------------------------
 * Single source of truth for "which software does a customer
 * get". Every module is declared once here, and each business
 * category is mapped to the modules it is allowed to use.
 *
 * Sidebar, mobile nav, dashboard cards and the route guard all
 * read from this file — so to give/remove a module from a
 * category you only edit CATEGORY_MODULES below.
 * ============================================================
 */

export type ModuleKey =
  | "accounts-forms"
  | "accounts-reports"
  | "brokerage"
  | "general"
  | "crops"
  | "trader";

export type AppModule = {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const MODULES: readonly AppModule[] = [
  {
    key: "accounts-forms",
    label: "Accounts Forms",
    href: "/accounts-forms",
    icon: FileText,
    description: "Vouchers & party master setup",
  },
  {
    key: "accounts-reports",
    label: "Accounts Reports",
    href: "/accounts-reports",
    icon: BarChart3,
    description: "Ledgers, trial balance, P&L",
  },
  {
    key: "brokerage",
    label: "Brokerage",
    href: "/brokerage",
    icon: Handshake,
    description: "Brokerage purchase & sale invoices",
  },
  {
    key: "general",
    label: "General",
    href: "/general",
    icon: Settings,
    description: "General purchase & sale invoices",
  },
  {
    key: "crops",
    label: "Crops",
    href: "/crops",
    icon: Wheat,
    description: "Contracts, weighment & crop invoices",
  },
  {
    key: "trader",
    label: "Trader",
    href: "/trader",
    icon: CandlestickChart,
    description: "Rates, positions, buy/sell & profit-loss",
  },
] as const;

/**
 * Which modules each business category receives at signup.
 * Edit this map to change what a category can see.
 */
export const CATEGORY_MODULES: Record<BusinessCategory, ModuleKey[]> = {
  shopkeeper: ["accounts-forms", "accounts-reports", "general"],
  wholesaler: ["accounts-forms", "accounts-reports", "general", "brokerage"],
  distributor: ["accounts-forms", "accounts-reports", "general", "brokerage"],
  trader: [
    "accounts-forms",
    "accounts-reports",
    "general",
    "brokerage",
    "crops",
    "trader",
  ],
  manufacturer: [
    "accounts-forms",
    "accounts-reports",
    "general",
    "crops",
  ],
};

/** Everything except category-exclusive modules — used as a safe
 *  fallback for older accounts that have no category saved yet, so
 *  nobody suddenly loses access after this update is deployed. */
const LEGACY_FALLBACK_MODULES: ModuleKey[] = [
  "accounts-forms",
  "accounts-reports",
  "brokerage",
  "general",
  "crops",
];

/** The module keys allowed for a category (null = legacy account). */
export function moduleKeysForCategory(
  category: BusinessCategory | null | undefined
): ModuleKey[] {
  if (!category) return LEGACY_FALLBACK_MODULES;
  return CATEGORY_MODULES[category] ?? LEGACY_FALLBACK_MODULES;
}

/** The full module objects allowed for a category, in registry order. */
export function modulesForCategory(
  category: BusinessCategory | null | undefined
): AppModule[] {
  const allowed = new Set(moduleKeysForCategory(category));
  return MODULES.filter((m) => allowed.has(m.key));
}

/** True if the category may open this module. */
export function canAccessModule(
  category: BusinessCategory | null | undefined,
  key: ModuleKey
): boolean {
  return moduleKeysForCategory(category).includes(key);
}

/** Resolve a pathname (e.g. "/trader/rates") to its module key. */
export function moduleKeyFromPath(pathname: string): ModuleKey | null {
  const match = MODULES.find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
  );
  return match?.key ?? null;
}
