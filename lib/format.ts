/**
 * Number / money formatting for a Pakistani accounting product.
 *
 * Amounts are grouped the South Asian way (12,34,56,789) using the
 * en-IN locale, which matches how lakh/crore are read in Pakistan,
 * instead of the western 1,234,567,890 grouping.
 */

const grouped = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const grouped2 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 4825300 -> "48,25,300" */
export function formatAmount(value: number, decimals = false): string {
  const n = Number.isFinite(value) ? value : 0;
  return decimals ? grouped2.format(n) : grouped.format(n);
}

/** 4825300 -> "Rs 48,25,300" */
export function formatMoney(value: number, decimals = false): string {
  const n = Number.isFinite(value) ? value : 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}Rs ${formatAmount(Math.abs(n), decimals)}`;
}

/**
 * Short form for tight spaces / chart axes.
 * 48250000 -> "4.83 Cr", 482500 -> "4.83 L", 4825 -> "4,825"
 */
export function formatCompact(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}${grouped.format(Math.round(abs))}`;
  return `${sign}${abs.toFixed(0)}`;
}

/** Percentage with a sign, e.g. "+12.4%" */
export function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** "2026-09-14" -> "14 Sep" */
export function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** "2026-09-14" -> "14 Sep 2026" */
export function formatFullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Relative day label used by the activity feed. */
export function formatRelativeDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const startOfThat = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).getTime();
  const days = Math.round((startOfToday - startOfThat) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDayMonth(iso);
}

/** Month key helpers for the 12-month charts. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

/** The last `count` month keys, oldest first, ending with the current month. */
export function recentMonthKeys(count = 12, from = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}
