"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
 * A module with sub-pages expands in place instead of forcing a
 * trip through its hub page — the old "dashboard → module → card
 * → form" walk was three clicks for work people do fifty times
 * a day.
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
  const activeModule = modules.find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
  );

  // Only the module you're working in is open; opening another keeps
  // the first one open so you can move between two related screens.
  const [open, setOpen] = useState<string[]>(
    activeModule ? [activeModule.key] : []
  );

  useEffect(() => {
    if (activeModule) {
      setOpen((prev) =>
        prev.includes(activeModule.key) ? prev : [...prev, activeModule.key]
      );
    }
  }, [activeModule]);

  const rowPad = dense ? "py-2.5" : "py-2";

  return (
    <nav className="space-y-0.5">
      {modules.map((m) => {
        const Icon = m.icon;
        const isActive = pathname === m.href || pathname.startsWith(`${m.href}/`);
        const children = m.children ?? [];
        const expanded = open.includes(m.key);

        if (children.length === 0) {
          return (
            <Link
              key={m.key}
              href={m.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
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
              {m.label}
            </Link>
          );
        }

        return (
          <div key={m.key}>
            <button
              onClick={() =>
                setOpen((prev) =>
                  prev.includes(m.key)
                    ? prev.filter((k) => k !== m.key)
                    : [...prev, m.key]
                )
              }
              aria-expanded={expanded}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
                rowPad,
                isActive
                  ? "text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                size={18}
                className={isActive ? "text-brand-600" : "text-slate-400"}
              />
              <span className="flex-1 text-left">{m.label}</span>
              <ChevronRight
                size={14}
                className={cn(
                  "text-slate-400 transition-transform",
                  expanded && "rotate-90"
                )}
              />
            </button>

            {expanded && (
              <div className="mt-0.5 mb-1 ml-[22px] border-l border-slate-200 pl-2.5">
                <SubLink
                  href={m.href}
                  label={m.overviewLabel ?? "Overview"}
                  active={pathname === m.href}
                  onNavigate={onNavigate}
                  dense={dense}
                />
                {groupChildren(children).map(([group, items]) => (
                  <div key={group ?? "_"}>
                    {group && (
                      <p className="px-2.5 pt-2.5 pb-1 text-[11px] font-medium text-slate-400">
                        {group}
                      </p>
                    )}
                    {items.map((c) => (
                      <SubLink
                        key={c.href}
                        href={c.href}
                        label={c.label}
                        active={pathname === c.href}
                        onNavigate={onNavigate}
                        dense={dense}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SubLink({
  href,
  label,
  active,
  onNavigate,
  dense,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
  dense: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-2.5 text-[13px] transition-colors",
        dense ? "py-2" : "py-1.5",
        active
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {label}
    </Link>
  );
}

function groupChildren(children: NonNullable<AppModule["children"]>) {
  const map = new Map<string | undefined, typeof children>();
  for (const c of children) {
    const list = map.get(c.group) ?? [];
    list.push(c);
    map.set(c.group, list);
  }
  return [...map.entries()];
}
