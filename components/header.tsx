"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Search, UserCog } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { LiveClock } from "@/components/live-clock";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  CommandPalette,
  useCommandPaletteHotkey,
} from "@/components/command-palette";
import { useAuth } from "@/components/auth-provider";
import { useBusiness } from "@/components/business-provider";
import { useSiteSettings } from "@/components/site-settings-provider";
import { visibleModuleKeys } from "@/lib/modules";
import { effectiveModuleKeys, ROLE_LABELS } from "@/lib/team-data";

function getInitials(name?: string, email?: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

/** Pakistan's financial year runs July to June. */
function fiscalYear(date = new Date()): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 6 ? y : y - 1;
  return `FY ${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { business, isOwner, membership } = useBusiness();
  const { settings } = useSiteSettings();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useCommandPaletteHotkey(useCallback(() => setPaletteOpen(true), []));

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const canManageUsers = visibleModuleKeys(business?.category, {
    isOwner,
    moduleKeys: membership ? effectiveModuleKeys(membership) : [],
  }).includes("settings");

  async function handleLogOut() {
    setMenuOpen(false);
    await signOut();
    router.push("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <MobileNav />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {business?.name ?? settings.siteName}
            </p>
            <div className="hidden sm:block mt-0.5">
              <Breadcrumbs />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 sm:px-3 h-9 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            aria-label="Search screens"
          >
            <Search size={15} />
            <span className="hidden md:inline text-[12.5px]">Search</span>
            <kbd className="hidden md:inline figure rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-500">
              Ctrl K
            </kbd>
          </button>

          <span className="hidden sm:inline rounded bg-brand-50 px-2 py-1 text-[11.5px] font-medium text-brand-700">
            {fiscalYear()}
          </span>

          <div className="hidden lg:block">
            <LiveClock />
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              {getInitials(user?.name, user?.email)}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[13px] font-medium text-slate-900 truncate">
                    {user?.name || "Signed in"}
                  </p>
                  <p className="text-[12px] text-slate-500 truncate">
                    {user?.email}
                  </p>
                  <p className="mt-1.5 text-[11.5px] text-slate-500">
                    {isOwner
                      ? "Business owner"
                      : membership
                      ? ROLE_LABELS[membership.role]
                      : "Staff login"}
                  </p>
                </div>

                {canManageUsers && (
                  <Link
                    href="/user-access"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
                  >
                    <UserCog size={15} className="text-slate-400" />
                    User access
                  </Link>
                )}

                <button
                  onClick={handleLogOut}
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50"
                >
                  <LogOut size={15} className="text-slate-400" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumbs move below the header on small screens, where the
          business name already fills the row. */}
      <div className="sm:hidden border-b border-slate-200 bg-white px-4 py-2">
        <Breadcrumbs />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
