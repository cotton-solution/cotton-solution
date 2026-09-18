"use client";

import Link from "next/link";
import { formatAmount, formatCompact } from "@/lib/format";
import type { AgeingBucket } from "@/lib/dashboard";

/**
 * What is owed, both directions, with the age of the money underneath.
 * Ageing bars are drawn as plain divs rather than a chart: four
 * buckets don't need axes, and the widths carry the whole message.
 */
export function OwedPanel({
  receivable,
  payable,
  overdueReceivable,
  ageing,
}: {
  receivable: number;
  payable: number;
  overdueReceivable: number;
  ageing: AgeingBucket[];
}) {
  const net = receivable - payable;
  const maxBucket = Math.max(
    1,
    ...ageing.map((b) => Math.max(b.receivable, b.payable))
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="grid grid-cols-2 divide-x divide-slate-200">
        <Amount
          label="Receivable"
          sub={
            overdueReceivable > 0
              ? `${formatCompact(overdueReceivable)} past 30 days`
              : "Nothing overdue"
          }
          value={receivable}
          tone="in"
          href="/reports/account-receivable"
        />
        <Amount
          label="Payable"
          sub="Owed to vendors and growers"
          value={payable}
          tone="out"
          href="/reports/account-payable"
        />
      </div>

      <div className="rule-t px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-slate-700">
            Ageing of open balances
          </p>
          <p className="text-[12px] text-slate-500">
            Net{" "}
            <span
              className={`figure ${
                net >= 0 ? "text-money-in" : "text-money-out"
              }`}
            >
              {net >= 0 ? "" : "-"}Rs {formatAmount(Math.abs(net))}
            </span>
          </p>
        </div>

        {ageing.length === 0 ? (
          <p className="mt-3 text-[13px] text-slate-500">
            Nothing outstanding. Invoices you raise will be aged here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {ageing.map((b) => (
              <li key={b.label} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-[12px] text-slate-500">
                  {b.label}
                </span>
                <span className="flex-1 flex items-center gap-1.5">
                  <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-brand-600"
                      style={{ width: `${(b.receivable / maxBucket) * 100}%` }}
                    />
                  </span>
                  <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-money-out/80"
                      style={{ width: `${(b.payable / maxBucket) * 100}%` }}
                    />
                  </span>
                </span>
                <span className="figure w-20 shrink-0 text-right text-[12px] text-slate-600">
                  {formatCompact(b.receivable)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
            Receivable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-money-out/80" />
            Payable
          </span>
        </div>
      </div>
    </section>
  );
}

function Amount({
  label,
  sub,
  value,
  tone,
  href,
}: {
  label: string;
  sub: string;
  value: number;
  tone: "in" | "out";
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block px-5 py-4 hover:bg-slate-50 transition-colors"
    >
      <p className="text-[13px] text-slate-500">{label}</p>
      <p
        className={`figure mt-1 text-[22px] leading-none font-medium ${
          tone === "in" ? "text-money-in" : "text-money-out"
        }`}
      >
        <span className="text-slate-400 text-[14px] mr-1">Rs</span>
        {formatAmount(value)}
      </p>
      <p className="mt-1.5 text-[12px] text-slate-500 truncate">{sub}</p>
    </Link>
  );
}
