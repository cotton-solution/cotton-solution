import {
  LayoutDashboard,
  Repeat,
  FileText,
  Truck,
  Boxes,
  Wallet,
  BarChart3,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import type { BusinessCategory } from "@/lib/supabase/businesses";

/**
 * ============================================================
 * MODULE REGISTRY
 * ------------------------------------------------------------
 * Single source of truth for the app's navigation. Every module
 * is declared once here, in the exact order the sidebar, mobile
 * nav, command palette and dashboard all read it in.
 *
 * This is a generic accounting-software menu — every business,
 * regardless of category, gets the full set. `business_category`
 * is kept only as descriptive info on the business profile; it no
 * longer changes which modules are visible (see CATEGORY_MODULES
 * below, which now maps every category to the same full list).
 * ============================================================
 */

export type ModuleKey =
  | "dashboard"
  | "transactions"
  | "sales"
  | "purchases"
  | "inventory"
  | "expenses"
  | "reports"
  | "settings";

/**
 * A page inside a module. `group` lets the sidebar and the command
 * palette break a long module into named sections (e.g. Receipts vs
 * Payments) without needing a second registry.
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
    key: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Financial overview, cash flow & recent activity",
  },
  {
    key: "transactions",
    label: "Transactions",
    href: "/transactions",
    icon: Repeat,
    description: "All vouchers — receipts, payments & adjustments",
    overviewLabel: "All transactions",
    children: [
      { group: "Receipts", label: "Cash Receiving Voucher", href: "/transactions/cash-receiving-voucher", keywords: "crv money in received" },
      { group: "Receipts", label: "Bank Receipts Voucher", href: "/transactions/bank-receipt-voucher", keywords: "brv online transfer cheque deposit bcd" },
      { group: "Payments", label: "Cash Payment Voucher", href: "/transactions/cash-payment-voucher", keywords: "cpv money out paid" },
      { group: "Payments", label: "Bank Issue Voucher", href: "/transactions/bank-issue-voucher", keywords: "bpv bank payment transfer pay order" },
      { group: "Payments", label: "Cash Payment Voucher (WHT)", href: "/transactions/cash-payment-voucher-wht", keywords: "withholding tax" },
      { group: "Adjustments", label: "Journal Voucher", href: "/transactions/journal-voucher", keywords: "jv debit credit double entry" },
      { group: "Adjustments", label: "IBFT (Inter Bank Fund Transfer)", href: "/transactions/ibft", keywords: "ibft bank to bank transfer inter bank funds" },
    ],
  },
  {
    key: "sales",
    label: "Sales & Receivables",
    href: "/sales",
    icon: FileText,
    description: "Customer invoices, profiles, quotations & weighment",
    overviewLabel: "Overview",
    children: [
      { label: "Invoices", href: "/sales/invoices", keywords: "sale bill customer" },
      { label: "Customers", href: "/sales/customers", keywords: "profiles balances payment history" },
      { label: "Quotations / Estimates", href: "/sales/quotations", keywords: "estimate rate quote" },
      { label: "Weighment", href: "/sales/weighment", keywords: "weight vehicle truck kanta weighbridge sale id" },
    ],
  },
  {
    key: "purchases",
    label: "Purchases & Payables",
    href: "/purchases",
    icon: Truck,
    description: "Vendor bills, ledgers, purchase orders & weighment",
    overviewLabel: "Overview",
    children: [
      { label: "Bills", href: "/purchases/bills", keywords: "vendor bill purchase invoice" },
      { label: "Suppliers / Vendors", href: "/purchases/suppliers", keywords: "vendor ledger contact" },
      { label: "Purchase Orders", href: "/purchases/orders", keywords: "po procurement" },
      { label: "Weighment", href: "/purchases/weighment", keywords: "weight vehicle truck kanta weighbridge purchase id" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    href: "/inventory",
    icon: Boxes,
    description: "Items, stock movement & warehouses",
    overviewLabel: "Overview",
    children: [
      { label: "Items Catalog", href: "/inventory/items", keywords: "sku products" },
      { label: "Warehouses", href: "/inventory/warehouses", keywords: "location stock by site" },
      { label: "Stock Movements", href: "/inventory/stock-movements", keywords: "stock in out low stock alert" },
    ],
  },
  {
    key: "expenses",
    label: "Expenses",
    href: "/expenses",
    icon: Wallet,
    description: "Category-wise daily business expenses",
  },
  {
    key: "reports",
    label: "Financial Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Ledgers, trial balance, P&L & balance sheet",
    overviewLabel: "All reports",
    children: [
      { group: "Ledgers", label: "General Ledger", href: "/reports/account-ledger", keywords: "khata party statement account ledger" },
      { group: "Ledgers", label: "Account Receivable", href: "/reports/account-receivable", keywords: "owed to us debtors" },
      { group: "Ledgers", label: "Account Payable", href: "/reports/account-payable", keywords: "we owe creditors" },
      { group: "Cash & bank", label: "Cash Book", href: "/reports/cash-book", keywords: "rokar cash in hand" },
      { group: "Cash & bank", label: "Bank Statement", href: "/reports/bank-statement", keywords: "bank ledger" },
      { group: "Cash & bank", label: "Daily Vouchers Details", href: "/reports/daily-vouchers", keywords: "day book roznamcha" },
      { group: "Financial statements", label: "Trial Balance", href: "/reports/trial-balance", keywords: "tb debit credit totals" },
      { group: "Financial statements", label: "Profit & Loss", href: "/reports/profit-and-loss", keywords: "p&l income expense munafa" },
      { group: "Financial statements", label: "Balance Sheet", href: "/reports/balance-sheet", keywords: "assets liabilities equity" },
    ],
  },
  {
    key: "settings",
    label: "Settings & Administration",
    href: "/settings",
    icon: SettingsIcon,
    description: "User permissions, company profile & chart of accounts",
    overviewLabel: "Overview",
    children: [
      { label: "Company Profile", href: "/settings/company-profile", keywords: "name logo tax currency address" },
      { label: "Chart of Accounts", href: "/settings/chart-of-accounts", keywords: "coa account codes heads" },
      { label: "User Permissions", href: "/settings/user-access", keywords: "staff roles rbac team" },
    ],
  },
] as const;

/**
 * Every business category gets the same full module set — module
 * visibility is no longer differentiated by category. The map (and
 * the helper functions below) are kept so the rest of the app — the
 * sidebar, the route guard, staff role assignment — doesn't need to
 * change shape, only what it resolves to.
 */
const ALL_MODULE_KEYS: ModuleKey[] = MODULES.map((m) => m.key);

export const CATEGORY_MODULES: Record<BusinessCategory, ModuleKey[]> = {
  shopkeeper: ALL_MODULE_KEYS,
  wholesaler: ALL_MODULE_KEYS,
  distributor: ALL_MODULE_KEYS,
  trader: ALL_MODULE_KEYS,
  manufacturer: ALL_MODULE_KEYS,
};

/** The module keys allowed for a category (null = legacy account). */
export function moduleKeysForCategory(
  _category: BusinessCategory | null | undefined
): ModuleKey[] {
  return ALL_MODULE_KEYS;
}

/** The full module objects allowed for a category, in registry order. */
export function modulesForCategory(
  _category: BusinessCategory | null | undefined
): AppModule[] {
  return [...MODULES];
}

/** True if the category may open this module. */
export function canAccessModule(
  _category: BusinessCategory | null | undefined,
  _key: ModuleKey
): boolean {
  return true;
}

/** Resolve a pathname (e.g. "/sales/invoices") to its module key. */
export function moduleKeyFromPath(pathname: string): ModuleKey | null {
  // Longest-href-first so "/" (Dashboard) never shadows a real module.
  const sorted = [...MODULES].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
  );
  return match?.key ?? null;
}

/**
 * ------------------------------------------------------------
 * Per-user access (User Access & Security)
 * ------------------------------------------------------------
 * The business owner always sees every module. A staff login
 * (business_members row) only sees whatever the owner assigned
 * them.
 */
export type ModuleAccess = {
  isOwner: boolean;
  /** Modules assigned to this person. Ignored when isOwner is true. */
  moduleKeys: ModuleKey[];
} | null;

/** The module keys a specific signed-in user is allowed to see. */
export function visibleModuleKeys(
  _category: BusinessCategory | null | undefined,
  access: ModuleAccess
): ModuleKey[] {
  if (!access || access.isOwner) return ALL_MODULE_KEYS;
  const allowed = new Set(access.moduleKeys);
  allowed.add("dashboard"); // always reachable, not an assignable toggle
  return ALL_MODULE_KEYS.filter((k) => allowed.has(k));
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
  const sorted = [...modules].sort((a, b) => b.href.length - a.href.length);
  const mod = sorted.find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
  );
  if (!mod) return null;
  const child = (mod.children ?? []).find((c) => c.href === pathname);
  return { module: mod, child };
}
