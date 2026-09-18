"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { flattenModules, modulesForUser } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { useBusiness } from "@/components/business-provider";
import { cn } from "@/lib/utils";

/**
 * ============================================================
 * COMMAND PALETTE  (Ctrl / ⌘ + K)
 * ------------------------------------------------------------
 * In a book-keeping product the most common navigation is not
 * browsing — it's "take me to the cash receiving voucher". This
 * searches every screen the signed-in user is entitled to, by
 * name and by the words people actually use (rokar, kanta,
 * sauda, khata), and jumps straight there.
 * ============================================================
 */

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { business, isOwner, membership } = useBusiness();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const destinations = useMemo(() => {
    const modules = modulesForUser(business?.category, {
      isOwner,
      moduleKeys: membership ? effectiveModuleKeys(membership) : [],
    });
    return [
      {
        label: "Dashboard",
        href: "/",
        moduleLabel: "Overview",
        keywords: "home cash position summary",
        group: undefined as string | undefined,
      },
      ...flattenModules(modules).map((d) => ({
        label: d.label,
        href: d.href,
        moduleLabel: d.moduleLabel,
        keywords: d.keywords,
        group: d.group,
      })),
    ];
  }, [business?.category, isOwner, membership]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations.slice(0, 12);
    const words = q.split(/\s+/);
    return destinations
      .map((d) => {
        const haystack = `${d.label} ${d.moduleLabel} ${d.group ?? ""} ${
          d.keywords ?? ""
        }`.toLowerCase();
        const hit = words.every((w) => haystack.includes(w));
        if (!hit) return null;
        // Label matches rank above keyword-only matches.
        const score = d.label.toLowerCase().startsWith(q)
          ? 0
          : d.label.toLowerCase().includes(q)
          ? 1
          : 2;
        return { ...d, score };
      })
      .filter(Boolean)
      .sort((a, b) => a!.score - b!.score)
      .slice(0, 12) as (typeof destinations[number] & { score: number })[];
  }, [query, destinations]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Focus after the overlay paints.
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelectorAll("li")
      [index]?.scrollIntoView({ block: "nearest" });
  }, [index]);

  if (!open) return null;

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        aria-label="Close search"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search screens"
        className="relative mx-auto mt-[12vh] w-[min(620px,92vw)] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") onOpenChange(false);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => Math.min(i + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) => Math.max(i - 1, 0));
          }
          if (e.key === "Enter" && results[index]) {
            e.preventDefault();
            go(results[index].href);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search size={17} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search screens — voucher, ledger, party, weighment…"
            className="h-14 flex-1 bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-slate-500">
            Nothing matches “{query}”. Try a voucher name, a report, or a party
            screen.
          </p>
        ) : (
          <ul ref={listRef} className="max-h-[52vh] overflow-y-auto thin-scrollbar py-2">
            {results.map((r, i) => (
              <li key={r.href}>
                <button
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(r.href)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left",
                    i === index ? "bg-brand-50" : "hover:bg-slate-50"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium text-slate-900">
                      {r.label}
                    </span>
                    <span className="block truncate text-[11.5px] text-slate-500">
                      {r.moduleLabel}
                      {r.group ? ` · ${r.group}` : ""}
                    </span>
                  </span>
                  {i === index && (
                    <CornerDownLeft size={14} className="shrink-0 text-brand-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-4 border-t border-slate-200 px-4 py-2.5 text-[11.5px] text-slate-500">
          <span>↑ ↓ to move</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

/** Opens the palette on Ctrl/⌘+K anywhere in the app. */
export function useCommandPaletteHotkey(onOpen: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
}
