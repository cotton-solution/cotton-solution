import {
  FileText,
  BarChart3,
  Handshake,
  Settings,
  Wheat,
  CandlestickChart,
  UserCog,
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
  | "trader"
  | "user-access";

/**
 * A page inside a module. `group` lets the sidebar and the command
 * palette break a long module into named sections (e.g. Vouchers vs
 * Master Setup) without needing a second registry.
 */
export type ModuleChild = {
  label: string;
  href: string;
  group?: string;
  /** Extra words the command palette should match on. */
  keywords?: string;
};

export type AppModule = {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Overview page label shown as the first item when expanded. */
  overviewLabel?: string;
  children?: ModuleChild[];
};

export const MODULES: readonly AppModule[] = [
  {
    key: "accounts-forms",
    label: "Accounts Forms",
    href: "/accounts-forms",
    icon: FileText,
    description: "Vouchers & party master setup",
    overviewLabel: "All forms",
    children: [
      { group: "Receipts", label: "Cash Receiving Voucher", href: "/accounts-forms/cash-receiving-voucher", keywords: "crv money in received" },
      { group: "Receipts", label: "Bank Receipt Voucher", href: "/accounts-forms/bank-receipt-voucher", keywords: "brv online transfer" },
      { group: "Receipts", label: "Bank Cheque Deposit", href: "/accounts-forms/bank-cheque-deposit", keywords: "bcd cheque in" },
      { group: "Payments", label: "Cash Payment Voucher", href: "/accounts-forms/cash-payment-voucher", keywords: "cpv money out paid" },
      { group: "Payments", label: "Cash Payment (WHT)", href: "/accounts-forms/cash-payment-voucher-wht", keywords: "withholding tax" },
      { group: "Payments", label: "Bank Payment Voucher", href: "/accounts-forms/bank-payment-voucher", keywords: "bpv transfer pay order" },
      { group: "Payments", label: "Bank Cheque Issue", href: "/accounts-forms/bank-cheque-issue", keywords: "bci cheque out" },
      { group: "Adjustments", label: "Contra Voucher", href: "/accounts-forms/contra-voucher", keywords: "cash to bank transfer own" },
      { group: "Adjustments", label: "Journal Voucher", href: "/accounts-forms/journal-voucher", keywords: "jv debit credit double entry" },
      { group: "Master setup", label: "Customers / Party Master", href: "/accounts-forms/party-master", keywords: "customer vendor supplier ledger account" },
      { group: "Master setup", label: "Chart of Accounts", href: "/accounts-forms/chart-of-accounts", keywords: "coa account codes heads" },
    ],
  },
  {
    key: "accounts-reports",
    label: "Accounts Reports",
    href: "/accounts-reports",
    icon: BarChart3,
    description: "Ledgers, trial balance, P&L",
    overviewLabel: "All reports",
    children: [
      { group: "Ledgers", label: "Account Ledger", href: "/accounts-reports/account-ledger", keywords: "khata party statement" },
      { group: "Ledgers", label: "Account Receivable", href: "/accounts-reports/account-receivable", keywords: "owed to us debtors" },
      { group: "Ledgers", label: "Account Payable", href: "/accounts-reports/account-payable", keywords: "we owe creditors" },
      { group: "Cash & bank", label: "Cash Book", href: "/accounts-reports/cash-book", keywords: "rokar cash in hand" },
      { group: "Cash & bank", label: "Bank Statement", href: "/accounts-reports/bank-statement", keywords: "bank ledger" },
      { group: "Cash & bank", label: "Daily Vouchers Details", href: "/accounts-reports/daily-vouchers", keywords: "day book roznamcha" },
      { group: "Financial statements", label: "Trial Balance", href: "/accounts-reports/trial-balance", keywords: "tb debit credit totals" },
      { group: "Financial statements", label: "Profit & Loss", href: "/accounts-reports/profit-and-loss", keywords: "p&l income expense munafa" },
      { group: "Financial statements", label: "Balance Sheet", href: "/accounts-reports/balance-sheet", keywords: "assets liabilities equity" },
    ],
  },
  {
    key: "brokerage",
    label: "Brokerage",
    href: "/brokerage",
    icon: Handshake,
    description: "Brokerage purchase & sale invoices",
    overviewLabel: "Overview",
    children: [
      { label: "Sale Invoice", href: "/brokerage/sale-invoice", keywords: "bill commission sell" },
      { label: "Purchase Invoice", href: "/brokerage/purchase-invoice", keywords: "bill commission buy" },
      { label: "Multi Invoice", href: "/brokerage/multi-invoice", keywords: "batch bulk" },
      { label: "Multi Invoice New", href: "/brokerage/multi-invoice-new", keywords: "batch bulk new" },
    ],
  },
  {
    key: "general",
    label: "General",
    href: "/general",
    icon: Settings,
    description: "General purchase & sale invoices",
    overviewLabel: "Overview",
    children: [
      { label: "Sale Invoice", href: "/general/sale-invoice", keywords: "bill sell customer" },
      { label: "Purchase Invoice", href: "/general/purchase-invoice", keywords: "bill buy vendor" },
      { label: "Multi Invoice", href: "/general/multi-invoice", keywords: "batch bulk" },
    ],
  },
  {
    key: "crops",
    label: "Crops",
    href: "/crops",
    icon: Wheat,
    description: "Contracts, weighment & crop invoices",
    overviewLabel: "Overview",
    children: [
      { group: "Contracts", label: "Purchase Contracts", href: "/crops/purchase-contracts", keywords: "sauda buy agreement" },
      { group: "Contracts", label: "Sale Contracts", href: "/crops/sale-contracts", keywords: "sauda sell agreement" },
      { group: "Weighment", label: "Purchase Weighment", href: "/crops/purchase-weighment", keywords: "kanta tol slip gross tare" },
      { group: "Weighment", label: "Sale Weighment", href: "/crops/sale-weighment", keywords: "kanta tol slip gross tare" },
      { group: "Invoicing", label: "Crop Purchase Invoice", href: "/crops/purchase-invoice", keywords: "bill buy" },
      { group: "Invoicing", label: "Crop Sale Invoice", href: "/crops/sale-invoice", keywords: "bill sell" },
      { group: "Setup", label: "Crop Units", href: "/crops/units", keywords: "maund kg bale conversion" },
    ],
  },
  {
    key: "trader",
    label: "Trader",
    href: "/trader",
    icon: CandlestickChart,
    description: "Rates, positions, buy/sell & profit-loss",
    overviewLabel: "Trading desk",
    children: [
      { label: "Market Rates", href: "/trader/rates", keywords: "bhao price live" },
      { label: "Open Positions", href: "/trader/positions", keywords: "stock in hand holdings" },
      { label: "Trade History", href: "/trader/trade-history", keywords: "past trades realised profit" },
    ],
  },
  {
    key: "user-access",
    label: "User Access",
    href: "/user-access",
    icon: UserCog,
    description: "Add staff logins and control which modules they can open",
    overviewLabel: "Team & roles",
  },
] as const;

/**
 * Which modules each business category receives at signup.
 * Edit this map to change what a category can see.
 */
export const CATEGORY_MODULES: Record<BusinessCategory, ModuleKey[]> = {
  shopkeeper: ["accounts-forms", "accounts-reports", "general", "user-access"],
  wholesaler: [
    "accounts-forms",
    "accounts-reports",
    "general",
    "brokerage",
    "user-access",
  ],
  distributor: [
    "accounts-forms",
    "accounts-reports",
    "general",
    "brokerage",
    "user-access",
  ],
  trader: [
    "accounts-forms",
    "accounts-reports",
    "general",
    "brokerage",
    "crops",
    "trader",
    "user-access",
  ],
  manufacturer: [
    "accounts-forms",
    "accounts-reports",
    "general",
    "crops",
    "user-access",
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
  "user-access",
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

/**
 * ------------------------------------------------------------
 * Per-user access (User Access & Security)
 * ------------------------------------------------------------
 * The business owner always sees every module their category
 * allows. A staff login (business_members row) only sees the
 * intersection of the category's modules and whatever the owner
 * assigned them — so giving someone the "Trader" role never shows
 * them Brokerage even if the business category includes it.
 */
export type ModuleAccess = {
  isOwner: boolean;
  /** Modules assigned to this person. Ignored when isOwner is true. */
  moduleKeys: ModuleKey[];
} | null;

/** The module keys a specific signed-in user is allowed to see. */
export function visibleModuleKeys(
  category: BusinessCategory | null | undefined,
  access: ModuleAccess
): ModuleKey[] {
  const categoryKeys = moduleKeysForCategory(category);
  if (!access || access.isOwner) return categoryKeys;
  const allowed = new Set(access.moduleKeys);
  return categoryKeys.filter((k) => allowed.has(k));
}

/** The full module objects a specific signed-in user is allowed to see. */
export function modulesForUser(
  category: BusinessCategory | null | undefined,
  access: ModuleAccess
): AppModule[] {
  const allowed = new Set(visibleModuleKeys(category, access));
  return MODULES.filter((m) => allowed.has(m.key));
}

/** True if this specific signed-in user may open the given module. */
export function canAccessModuleForUser(
  category: BusinessCategory | null | undefined,
  access: ModuleAccess,
  key: ModuleKey
): boolean {
  return visibleModuleKeys(category, access).includes(key);
}

/**
 * ------------------------------------------------------------
 * Flattened navigation
 * ------------------------------------------------------------
 * Every destination a user can reach, as a flat list. The command
 * palette searches it and the breadcrumb trail resolves against it,
 * so a page only ever has to be declared once, above.
 */
export type NavDestination = {
  label: string;
  href: string;
  moduleKey: ModuleKey;
  moduleLabel: string;
  group?: string;
  icon: LucideIcon;
  keywords?: string;
};

export function flattenModules(modules: readonly AppModule[]): NavDestination[] {
  const out: NavDestination[] = [];
  for (const m of modules) {
    out.push({
      label: m.label,
      href: m.href,
      moduleKey: m.key,
      moduleLabel: m.label,
      icon: m.icon,
      keywords: m.description,
    });
    for (const c of m.children ?? []) {
      out.push({
        label: c.label,
        href: c.href,
        moduleKey: m.key,
        moduleLabel: m.label,
        group: c.group,
        icon: m.icon,
        keywords: c.keywords,
      });
    }
  }
  return out;
}

/** Longest-prefix match for a pathname, used by the breadcrumb trail. */
export function destinationFromPath(
  modules: readonly AppModule[],
  pathname: string
): { module: AppModule; child?: ModuleChild } | null {
  const mod = modules.find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
  );
  if (!mod) return null;
  const child = (mod.children ?? []).find((c) => c.href === pathname);
  return { module: mod, child };
}
