import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  Phone,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type AdminNavLeaf = {
  label: string;
  href: string;
};

export type AdminNavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: AdminNavLeaf[];
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Accounts",
    icon: Users,
    children: [
      { label: "New Account Requests", href: "/admin/accounts/new" },
      { label: "Active Accounts", href: "/admin/accounts/active" },
      { label: "Expired Accounts", href: "/admin/accounts/expired" },
    ],
  },
  {
    label: "Billing",
    icon: Receipt,
    children: [
      { label: "Billed Accounts", href: "/admin/billing/billed" },
      { label: "Unbilled Accounts", href: "/admin/billing/unbilled" },
    ],
  },
  {
    label: "Web Settings",
    icon: Settings,
    href: "/admin/web-settings",
  },
  {
    label: "Contact",
    icon: Phone,
    href: "/admin/contact",
  },
  {
    label: "Pages (About / Legal)",
    icon: FileText,
    href: "/admin/pages",
  },
];

/** Flat lookup used by the header to show the current page title. */
export function findAdminPageTitle(pathname: string): string {
  for (const item of ADMIN_NAV) {
    if (item.href === pathname) return item.label;
    for (const child of item.children ?? []) {
      if (child.href === pathname) return child.label;
    }
  }
  return "Dashboard";
}
