"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LedgerAccount } from "@/lib/hooks/use-ledger-accounts";

/**
 * A single-line search box that opens a scrollable match list as you
 * type — the same pattern as searching contacts on a phone. Works for
 * both parties and chart-of-accounts heads, merged into one list by
 * the caller (see use-ledger-accounts.ts).
 */
export function AccountPicker({
  accounts,
  value,
  onChange,
  loading,
  placeholder = "Search an account or party…",
}: {
  accounts: LedgerAccount[];
  value: string;
  onChange: (ref: string, account: LedgerAccount | null) => void;
  loading?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => accounts.find((a) => a.ref === value) ?? null,
    [accounts, value]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts.slice(0, 30);
    return accounts
      .filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.sublabel.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [accounts, query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(a: LedgerAccount) {
    onChange(a.ref, a);
    setQuery("");
    setOpen(false);
  }

  function clear() {
    onChange("", null);
    setQuery("");
  }

  return (
    <div ref={boxRef} className="relative">
      {selected && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 h-10 sm:h-11 rounded-lg border border-slate-300 bg-white px-3 text-left hover:border-brand-600/50 transition-colors"
        >
          {selected.kind === "party" ? (
            <User size={14} className="text-slate-400 shrink-0" />
          ) : (
            <BookOpen size={14} className="text-slate-400 shrink-0" />
          )}
          <span className="flex-1 min-w-0 truncate text-sm text-slate-900">
            {selected.label}
          </span>
          <span className="text-[11px] text-slate-400 shrink-0">
            {selected.sublabel}
          </span>
          <X
            size={14}
            className="text-slate-300 hover:text-red-600 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
          />
        </button>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (results[highlight]) pick(results[highlight]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={loading ? "Loading accounts…" : placeholder}
            disabled={loading}
            className="w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
          />
        </div>
      )}

      {open && !loading && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
          {results.length === 0 && (
            <p className="px-3 py-2.5 text-xs text-slate-400">
              No match — try a different name or code.
            </p>
          )}
          {results.map((a, i) => (
            <button
              key={a.ref}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(a);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                i === highlight ? "bg-brand-50" : "hover:bg-slate-50"
              )}
            >
              {a.kind === "party" ? (
                <User size={13} className="text-slate-400 shrink-0" />
              ) : (
                <BookOpen size={13} className="text-slate-400 shrink-0" />
              )}
              <span className="flex-1 min-w-0 truncate text-slate-800">{a.label}</span>
              <span className="text-[11px] text-slate-400 shrink-0">{a.sublabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
