"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, findAdminPageTitle } from "@/lib/admin-nav";
import { useAuth } from "@/components/auth-provider";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const active = ADMIN_NAV.find((item) =>
      item.children?.some((c) => c.href === pathname)
    );
    return active?.label ?? null;
  });

  useEffect(() => {
    const active = ADMIN_NAV.find((item) =>
      item.children?.some((c) => c.href === pathname)
    );
    if (active) setOpenGroup(active.label);
  }, [pathname]);

  async function handleLogOut() {
    await signOut();
    router.push("/admin/login");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <ShieldCheck size={16} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Bahar-e-Madina</p>
          <p className="text-[11px] text-emerald-200/70">Service Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;

          if (!item.children) {
            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href!}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          }

          const isOpen = openGroup === item.label;
          const groupActive = item.children.some((c) => c.href === pathname);

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : item.label)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  groupActive
                    ? "text-white"
                    : "text-emerald-100/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <div className="mt-1 ml-3 pl-4 border-l border-white/10 space-y-1">
                  {item.children.map((child) => {
                    const active = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "block rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-white/10 text-white"
                            : "text-emerald-100/60 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={handleLogOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-200 hover:bg-white/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = findAdminPageTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-50">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-50">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-emerald-100 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck size={13} />
            Admin
          </span>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">{children}</main>
      </div>
    </div>
  );
}
