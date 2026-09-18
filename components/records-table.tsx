"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatAmount, formatFullDate } from "@/lib/format";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  /** Included when building the free-text search index for a row. */
  searchValue?: (row: T) => string;
};

/**
 * A plain, dense table with a search box and optional filter chips —
 * the "find a document I already saved" screen that was missing from
 * every module. No pagination library: these lists are a business's
 * own recent documents, client-side filtering is plenty.
 */
export function RecordsTable<T extends { id: string }>({
  rows,
  columns,
  loading,
  emptyLabel,
  searchPlaceholder = "Search…",
  filters,
  onRowClick,
  footer,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyLabel: string;
  searchPlaceholder?: string;
  /** Optional chip row rendered above the table (active filter is caller's state). */
  filters?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /** Rendered under the table, e.g. a total. */
  footer?: (visible: T[]) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns
        .map((c) => c.searchValue?.(row) ?? "")
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, columns, query]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-500"
          />
        </div>
        {filters}
      </div>

      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full text-[13px] min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-2.5 font-medium text-slate-600 ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  {rows.length === 0 ? emptyLabel : `Nothing matches “${query}”.`}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "cursor-pointer hover:bg-slate-50" : undefined}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-2.5 ${
                        c.align === "right" ? "text-right figure" : "text-left"
                      }`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer && !loading && visible.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-2.5">
          {footer(visible)}
        </div>
      )}
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

/** Amount cell with the shared figure formatting. */
export function AmountCell({ value }: { value: number }) {
  return <span className={value < 0 ? "text-money-out" : undefined}>
    {value < 0 ? `(${formatAmount(Math.abs(value))})` : formatAmount(value)}
  </span>;
}

/** Date cell with consistent formatting across every list. */
export function DateCell({ iso }: { iso: string }) {
  return <span className="text-slate-600">{formatFullDate(iso)}</span>;
}
