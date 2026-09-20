"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { AppModule } from "@/lib/modules";
import { cn } from "@/lib/utils";

/**
 * ============================================================
 * NAV TREE
 * ------------------------------------------------------------
 * One component drives both the desktop sidebar and the mobile
 * drawer, so the two can never drift apart.
 *
 * Every module is a plain link: one click opens that module's own
 * page (its hub of cards / sub-pages). Nothing expands or collapses
 * in the sidebar — the sub-pages are reached from the module page.
 * ============================================================
 */

export function NavTree({
  modules,
  onNavigate,
  dense = false,
}: {
  modules: AppModule[];
  /** Called after any link is followed (the mobile drawer closes on it). */
  onNavigate?: () => void;
  dense?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const rowPad = dense ? "py-2.5" : "py-2";

  return (
    <nav className="space-y-0.5">
      {modules.map((m) => {
        const Icon = m.icon;
        const isActive =
          m.href === "/"
            ? pathname === "/"
            : pathname === m.href || pathname.startsWith(`${m.href}/`);
        const hasChildren = (m.children ?? []).length > 0;

        return (
          <Link
            key={m.key}
            href={m.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
              rowPad,
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon
              size={18}
              className={isActive ? "text-brand-600" : "text-slate-400"}
            />
            <span className="flex-1 text-left">{m.label}</span>
            {hasChildren && (
              <ChevronRight size={14} className="text-slate-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
