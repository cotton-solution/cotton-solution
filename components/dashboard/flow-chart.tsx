"use client";

import { useMemo, useState } from "react";
import { formatCompact, formatMoney, monthLabel } from "@/lib/format";
import type { MonthPoint } from "@/lib/dashboard";

type Mode = "cash" | "trade";

const MODES: { key: Mode; label: string; a: string; b: string }[] = [
  { key: "cash", label: "Money in / out", a: "Received", b: "Paid" },
  { key: "trade", label: "Sales / purchases", a: "Sales", b: "Purchases" },
];

const W = 760;
const H = 250;
const PAD = { top: 18, right: 8, bottom: 26, left: 52 };

/**
 * Twelve months of trading, drawn as paired bars. No chart library:
 * the shape is simple enough that hand-drawn SVG keeps the bundle
 * small and lets the bars use the same money colours as the figures
 * elsewhere on the page.
 */
export function FlowChart({ months }: { months: MonthPoint[] }) {
  const [mode, setMode] = useState<Mode>("cash");
  const [hover, setHover] = useState<number | null>(null);

  const series = useMemo(
    () =>
      months.map((m) => ({
        key: m.key,
        a: mode === "cash" ? m.moneyIn : m.sales,
        b: mode === "cash" ? m.moneyOut : m.purchases,
      })),
    [months, mode]
  );

  const max = Math.max(1, ...series.flatMap((s) => [s.a, s.b]));
  const niceMax = roundUpNice(max);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(series.length, 1);
  const barW = Math.min(14, slot * 0.28);
  const y = (v: number) => PAD.top + plotH - (v / niceMax) * plotH;

  const active = hover != null ? series[hover] : null;
  const current = MODES.find((m) => m.key === mode)!;
  const totalA = series.reduce((s, p) => s + p.a, 0);
  const totalB = series.reduce((s, p) => s + p.b, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            Last 12 months
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {active
              ? `${monthLabel(active.key)} · ${current.a} ${formatMoney(
                  active.a
                )} · ${current.b} ${formatMoney(active.b)}`
              : `${current.a} ${formatCompact(totalA)} · ${
                  current.b
                } ${formatCompact(totalB)}`}
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-200 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              aria-pressed={mode === m.key}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                mode === m.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-2 pb-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          role="img"
          aria-label={`${current.a} and ${current.b} over the last twelve months`}
          onMouseLeave={() => setHover(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const value = niceMax * t;
            return (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(value)}
                  y2={y(value)}
                  stroke={t === 0 ? "#cbd5e1" : "#eef2f6"}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(value) + 3.5}
                  textAnchor="end"
                  className="figure"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {t === 0 ? "0" : formatCompact(value)}
                </text>
              </g>
            );
          })}

          {series.map((p, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            const isHover = hover === i;
            return (
              <g
                key={p.key}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                className="focus:outline-none"
              >
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill={isHover ? "#0b2b22" : "transparent"}
                  opacity={isHover ? 0.04 : 0}
                />
                <rect
                  x={cx - barW - 1.5}
                  y={y(p.a)}
                  width={barW}
                  height={Math.max(1, PAD.top + plotH - y(p.a))}
                  rx={2}
                  fill="#047857"
                  opacity={hover == null || isHover ? 1 : 0.35}
                />
                <rect
                  x={cx + 1.5}
                  y={y(p.b)}
                  width={barW}
                  height={Math.max(1, PAD.top + plotH - y(p.b))}
                  rx={2}
                  fill="#B4341F"
                  opacity={hover == null || isHover ? 0.85 : 0.3}
                />
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHover ? "#0f172a" : "#94a3b8"}
                >
                  {monthLabel(p.key)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rule-t flex items-center gap-4 px-5 py-3 text-[12px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-700" />
          {current.a}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-money-out/85" />
          {current.b}
        </span>
      </div>
    </section>
  );
}

/** Round an axis maximum up to a clean 1/2/5 × 10ⁿ step. */
function roundUpNice(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const n = value / base;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * base;
}
