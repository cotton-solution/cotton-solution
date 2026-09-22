"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, MoreHorizontal } from "lucide-react";
import { PopupWindow, PopupRadio, PopupCheck } from "@/components/popup-window";
import { Button } from "@/components/ui/button";
import { AccountSearchModal } from "@/components/account-search-modal";
import { useLedgerAccounts } from "@/lib/hooks/use-ledger-accounts";

type DateMode = "all" | "single" | "range";

export type AccountLedgerFilters = {
  dateMode: DateMode;
  date: string;
  fromDate: string;
  toDate: string;
  accountRef: string;
  accountLabel: string;
  showSimpleCpNarration: boolean;
  showJvNarration: boolean;
  showOnlyPurchases: boolean;
  showOnlySale: boolean;
  showOnlyPayments: boolean;
  withAdvancePendingCheque: boolean;
  sortByVoucherNo: boolean;
  printUrdu: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * "Account Ledger" popup — same filter set as the legacy desktop
 * screen: All Dates / Single Date / Range, an Account No box with the
 * "…" search picker, and the narration / purchases / sale / payments /
 * advance-cheque checkboxes. Preview hands the chosen filters to the
 * General Ledger report.
 */
export function AccountLedgerDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { accounts, loading } = useLedgerAccounts();
  const [pickerOpen, setPickerOpen] = useState(false);

  const [filters, setFilters] = useState<AccountLedgerFilters>({
    dateMode: "all",
    date: today(),
    fromDate: today(),
    toDate: today(),
    accountRef: "",
    accountLabel: "",
    showSimpleCpNarration: false,
    showJvNarration: false,
    showOnlyPurchases: false,
    showOnlySale: false,
    showOnlyPayments: false,
    withAdvancePendingCheque: false,
    sortByVoucherNo: false,
    printUrdu: false,
  });

  function set<K extends keyof AccountLedgerFilters>(key: K, value: AccountLedgerFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function handlePreview() {
    const params = new URLSearchParams();
    if (filters.accountRef) {
      params.set("account", filters.accountRef);
      params.set("accountLabel", filters.accountLabel);
    }
    params.set("dateMode", filters.dateMode);
    if (filters.dateMode === "single") params.set("date", filters.date);
    if (filters.dateMode === "range") {
      params.set("from", filters.fromDate);
      params.set("to", filters.toDate);
    }
    (
      [
        "showSimpleCpNarration",
        "showJvNarration",
        "showOnlyPurchases",
        "showOnlySale",
        "showOnlyPayments",
        "withAdvancePendingCheque",
        "sortByVoucherNo",
        "printUrdu",
      ] as const
    ).forEach((k) => {
      if (filters[k]) params.set(k, "1");
    });
    router.push(`/reports/account-ledger?${params.toString()}`);
    onClose();
  }

  return (
    <>
      <PopupWindow
        title="Account Ledger"
        icon={<BookOpenText size={15} className="text-slate-500" />}
        onClose={onClose}
        footer={
          <>
            <PopupCheck
              label="Print Urdu"
              checked={filters.printUrdu}
              onChange={(v) => set("printUrdu", v)}
            />
            <div className="flex-1" />
            <Button onClick={handlePreview}>Preview</Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
            <PopupRadio
              name="ledger-date-mode"
              label="All Dates"
              checked={filters.dateMode === "all"}
              onChange={() => set("dateMode", "all")}
            />
            <PopupRadio
              name="ledger-date-mode"
              label="Single Date"
              checked={filters.dateMode === "single"}
              onChange={() => set("dateMode", "single")}
            />
            <PopupRadio
              name="ledger-date-mode"
              label="Range"
              checked={filters.dateMode === "range"}
              onChange={() => set("dateMode", "range")}
            />
          </div>

          {filters.dateMode === "single" && (
            <input
              type="date"
              value={filters.date}
              onChange={(e) => set("date", e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm w-full sm:w-56"
            />
          )}
          {filters.dateMode === "range" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => set("fromDate", e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm flex-1"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => set("toDate", e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm flex-1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Account No
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={filters.accountRef.replace(/^(coa|party):/, "")}
                placeholder="—"
                className="w-24 h-10 rounded-lg border border-slate-300 bg-slate-50 px-2 text-sm text-slate-700"
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={loading}
                className="h-10 w-10 shrink-0 rounded-lg border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                aria-label="Search account"
              >
                <MoreHorizontal size={16} />
              </button>
              <input
                readOnly
                value={filters.accountLabel || (filters.accountRef ? "" : "All accounts")}
                className="flex-1 h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-1">
            <PopupCheck
              label="Show Simple CP Narration"
              checked={filters.showSimpleCpNarration}
              onChange={(v) => set("showSimpleCpNarration", v)}
            />
            <PopupCheck
              label="Show Only Purchases Details"
              checked={filters.showOnlyPurchases}
              onChange={(v) => set("showOnlyPurchases", v)}
            />
            <PopupCheck
              label="Show JV Narration"
              checked={filters.showJvNarration}
              onChange={(v) => set("showJvNarration", v)}
            />
            <PopupCheck
              label="Show Only Sale Details"
              checked={filters.showOnlySale}
              onChange={(v) => set("showOnlySale", v)}
            />
            <div />
            <PopupCheck
              label="Show Only Payments Details"
              checked={filters.showOnlyPayments}
              onChange={(v) => set("showOnlyPayments", v)}
            />
            <PopupCheck
              label="WITH ADVANCE - PENDING CHEQUE"
              checked={filters.withAdvancePendingCheque}
              onChange={(v) => set("withAdvancePendingCheque", v)}
            />
            <PopupCheck
              label="Sort By Voucher No"
              checked={filters.sortByVoucherNo}
              onChange={(v) => set("sortByVoucherNo", v)}
            />
          </div>
        </div>
      </PopupWindow>

      {pickerOpen && (
        <AccountSearchModal
          accounts={accounts}
          onClose={() => setPickerOpen(false)}
          onSelect={(a) => {
            set("accountRef", a.ref);
            set("accountLabel", a.label);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}
