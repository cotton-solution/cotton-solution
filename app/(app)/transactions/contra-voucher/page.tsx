"use client";

import { useState } from "react";
import { VoucherEditor } from "@/components/voucher-editor";
import { coaRef } from "@/lib/hooks/use-ledger-accounts";

const CASH_REF = coaRef("1010001");

type Direction = "cash_to_bank" | "bank_to_cash";

export default function ContraVoucherPage() {
  const [direction, setDirection] = useState<Direction>("cash_to_bank");

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center gap-3 shadow-card">
        <span className="text-xs font-medium text-slate-500 shrink-0">
          Moving your own money — no customer or vendor involved.
        </span>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-auto">
          <button
            onClick={() => setDirection("cash_to_bank")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              direction === "cash_to_bank" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cash → Bank
          </button>
          <button
            onClick={() => setDirection("bank_to_cash")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              direction === "bank_to_cash" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Bank → Cash
          </button>
        </div>
      </div>

      {/* key remounts the editor cleanly when direction flips */}
      <VoucherEditor
        key={direction}
        title="Contra Voucher"
        numberPrefix="CTV"
        voucherType={direction === "cash_to_bank" ? "contra_cash_to_bank" : "contra_bank_to_cash"}
        mode="single"
        anchor={{ kind: "bank", side: direction === "cash_to_bank" ? "credit" : "debit" }}
        narrationTemplate={() => (direction === "cash_to_bank" ? "Cash deposited into bank" : "Cash withdrawn from bank")}
        fixedLineRef={CASH_REF}
        fixedLineLabel="Cash in Hand"
      />
    </div>
  );
}
