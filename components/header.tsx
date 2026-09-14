"use client";

import { MobileNav } from "@/components/mobile-nav";
import { LiveClock } from "@/components/live-clock";
import { useAuth } from "@/components/auth-provider";
import { useBusiness } from "@/components/business-provider";

function getInitials(name?: string, email?: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function Header() {
  const { user } = useAuth();
  const { business } = useBusiness();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <MobileNav />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {business?.name ?? "Bahar-e-Madina Commission Agent"}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-brand-50 text-brand-700 px-1.5 py-0.5 font-medium">
              FY 2026-27
            </span>
            <span className="hidden sm:inline">786</span>
            <span className="hidden sm:inline h-3 w-px bg-slate-200" />
            <span className="hidden sm:inline text-emerald-600 font-medium">
              Session Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <LiveClock />
        </div>
        <div className="h-9 w-px bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-semibold"
            title={user?.email}
          >
            {getInitials(user?.name, user?.email)}
          </div>
        </div>
      </div>
    </header>
  );
}
