"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  /** Cell content for the desktop table. */
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Hide this field from the mobile card (e.g. it's already the title). */
  hideOnCard?: boolean;
};

/**
 * Renders a full multi-column table on desktop and stacked cards on
 * mobile from the same column definition — so the two never drift
 * apart. Includes instant live search and "load more" lazy loading.
 */
export function AdaptiveTable<T>({
  rows,
  columns,
  getRowKey,
  cardTitle,
  cardSubtitle,
  searchableText,
  searchPlaceholder = "Search…",
  pageSize = 10,
  emptyMessage = "Nothing to show yet.",
}: {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  cardTitle: (row: T) => ReactNode;
  cardSubtitle?: (row: T) => ReactNode;
  searchableText: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(pageSize);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => searchableText(r).toLowerCase().includes(q));
  }, [rows, query, searchableText]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(pageSize);
          }}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
        />
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <>
          {/* Desktop: full table */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={`px-4 py-3 font-medium text-slate-600 ${
                        c.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((row) => (
                  <tr key={getRowKey(row)} className="hover:bg-slate-50/60">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-4 py-3 text-slate-700 ${
                          c.align === "right"
                            ? "text-right tabular-nums"
                            : "text-left"
                        }`}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="space-y-3 md:hidden">
            {shown.map((row) => (
              <div
                key={getRowKey(row)}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {cardTitle(row)}
                    </p>
                    {cardSubtitle && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {cardSubtitle(row)}
                      </p>
                    )}
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                  {columns
                    .filter((c) => !c.hideOnCard)
                    .map((c) => (
                      <div key={c.key}>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          {c.header}
                        </dt>
                        <dd className="mt-0.5 text-sm text-slate-700">
                          {c.cell(row)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            ))}
          </div>
        </>
      )}

      {visible < filtered.length && (
        <button
          onClick={() => setVisible((v) => v + pageSize)}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Load more ({filtered.length - visible} remaining)
        </button>
      )}
    </div>
  );
}
