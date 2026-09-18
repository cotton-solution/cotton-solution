"use client";

import Link from "next/link";
import { Banknote, Landmark, ArrowUpRight } from "lucide-react";
import { formatAmount, formatCompact } from "@/lib/format";
import type { CashLine } from "@/lib/dashboard";

/**
 * The one bold element on the dashboard. A commission agent opens the
 * software to answer a single question first — "how much money do I
 * have right now, and where is it" — so that answer gets the dark
 * panel and the largest figure on the page; everything else stays quiet.
 */
export function CashPosition({ lines }: { lines: CashLine[] }) {
  const total = lines.reduce((sum, l) => sum + l.balance, 0);
  const banked = lines
    .filter((l) => l.kind === "bank")
    .reduce((sum, l) => sum + l.balance, 0);

  return (
    <section className="rounded-2xl bg-ledger-900 text-white shadow-panel overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] text-white/60">Cash position</p>
            <p className="figure mt-1.5 text-[34px] sm:text-[40px] leading-none font-medium">
              <span className="text-white/45 text-[20px] sm:text-[24px] align-baseline mr-1.5">
                Rs
              </span>
              {formatAmount(total)}
            </p>
          </div>
          <Link
            href="/reports/cash-book"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white/90 hover:bg-white/20 transition-colors"
          >
            Cash book
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <p className="mt-3 text-[13px] text-white/55">
          {formatCompact(banked)} held in banks across{" "}
          {lines.filter((l) => l.kind === "bank").length || "no"} accounts
        </p>
      </div>

      <div className="bg-ledger-800/70 px-2 pb-2">
        <ul>
          {lines.map((line, i) => {
            const Icon = line.kind === "cash" ? Banknote : Landmark;
            const negative = line.balance < 0;
            return (
              <li
                key={`${line.label}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-colors"
                style={
                  i === 0
                    ? undefined
                    : { borderTop: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon size={16} className="text-brand-300 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium truncate">
                      {line.label}
                    </span>
                    {line.note && (
                      <span className="block text-[11px] text-white/45 truncate">
                        {line.note}
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={`figure text-[15px] shrink-0 ${
                    negative ? "text-red-300" : "text-white"
                  }`}
                >
                  {negative
                    ? `(${formatAmount(Math.abs(line.balance))})`
                    : formatAmount(line.balance)}
                </span>
              </li>
            );
          })}
          {lines.length === 0 && (
            <li className="px-4 py-6 text-[13px] text-white/60">
              No cash or bank movement recorded yet. Post a receipt voucher to
              start the book.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
