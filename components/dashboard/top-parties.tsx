"use client";

import Link from "next/link";
import { formatAmount } from "@/lib/format";
import type { PartyBalance } from "@/lib/dashboard";

/**
 * Who the money is sitting with. Sorted by size of balance in either
 * direction, because the largest exposure matters whether they owe you
 * or you owe them.
 */
export function TopParties({ parties }: { parties: PartyBalance[] }) {
  const max = Math.max(1, ...parties.map((p) => Math.abs(p.balance)));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[15px] font-semibold text-slate-900">
          Largest balances
        </h2>
        <Link
          href="/sales/customers"
          className="text-[12px] font-medium text-brand-700 hover:text-brand-800"
        >
          All parties
        </Link>
      </header>

      {parties.length === 0 ? (
        <p className="px-5 pb-6 text-[13px] text-slate-500">
          No open party balances. Add a customer in Party Master and raise an
          invoice to see them here.
        </p>
      ) : (
        <ul className="rule-t px-5 py-4 space-y-3.5">
          {parties.map((p) => {
            const owesYou = p.balance >= 0;
            return (
              <li key={p.partyId}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-900">
                      {p.name}
                    </span>
                    <span className="block text-[11.5px] text-slate-500">
                      {p.town ? `${p.town} · ` : ""}
                      {owesYou ? "owes you" : "you owe"}
                    </span>
                  </span>
                  <span
                    className={`figure shrink-0 text-[13px] ${
                      owesYou ? "text-money-in" : "text-money-out"
                    }`}
                  >
                    {formatAmount(Math.abs(p.balance))}
                  </span>
                </div>
                <span className="mt-1.5 block h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <span
                    className={`block h-full rounded-full ${
                      owesYou ? "bg-brand-600" : "bg-money-out/80"
                    }`}
                    style={{
                      width: `${(Math.abs(p.balance) / max) * 100}%`,
                    }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
