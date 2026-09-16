"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, Power, Sprout } from "lucide-react";
import { navSections } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useSiteSettings } from "@/components/site-settings-provider";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { settings } = useSiteSettings();

  async function handleLogOut() {
    setOpen(false);
    await signOut();
    router.push("/login");
  }

  return (
    <>
      <button
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {settings.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.logoUrl}
                    alt={settings.siteName}
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Sprout size={18} />
                  </div>
                )}
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    {settings.siteName}
                  </p>
                  <p className="text-xs text-slate-500">Commission Agent</p>
                </div>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto thin-scrollbar px-3 py-4 space-y-1">
              {navSections.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-brand-600" : "text-slate-400"}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-3 space-y-1">
              <button
                onClick={handleLogOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={18} className="text-slate-400" />
                Log Out
              </button>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600">
                <Power size={18} className="text-slate-400" />
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
