"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { PopupWindow, PopupRadio, PopupCheck } from "@/components/popup-window";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { accountTypes } from "@/lib/coa-data";

type DateMode = "all" | "single" | "range";
type AccountsShown = "transaction" | "group" | "both";
type PartiesShown = "exclude" | "include" | "only";

/**
 * "Accounts Balances" popup — same filter set as the legacy desktop
 * screen: date scope, which kind of accounts to list (transaction
 * accounts / groups / both), how parties are handled, an Account Head
 * Type filter, a "Closing Value more than" threshold, and the
 * Extended / Simple Report / Print Urdu toggles.
 */
export function AccountBalancesDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const [dateMode, setDateMode] = useState<DateMode>("all");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [accountsShown, setAccountsShown] = useState<AccountsShown>("transaction");
  const [excludeNoTransaction, setExcludeNoTransaction] = useState(true);
  const [partiesShown, setPartiesShown] = useState<PartiesShown>("include");
  const [headType, setHeadType] = useState<string>("ALL");
  const [closingValueMoreThan, setClosingValueMoreThan] = useState("");
  const [extended, setExtended] = useState(false);
  const [simpleReport, setSimpleReport] = useState(false);
  const [printUrdu, setPrintUrdu] = useState(false);

  function handlePreview() {
    const params = new URLSearchParams();
    params.set("dateMode", dateMode);
    if (dateMode === "single") params.set("date", date);
    if (dateMode === "range") {
      params.set("from", fromDate);
      params.set("to", toDate);
    }
    params.set("accountsShown", accountsShown);
    params.set("partiesShown", partiesShown);
    if (excludeNoTransaction) params.set("excludeNoTransaction", "1");
    if (headType !== "ALL") params.set("headType", headType);
    if (closingValueMoreThan) params.set("closingValueMoreThan", closingValueMoreThan);
    if (extended) params.set("extended", "1");
    if (simpleReport) params.set("simpleReport", "1");
    if (printUrdu) params.set("printUrdu", "1");
    router.push(`/reports/account-balances?${params.toString()}`);
    onClose();
  }

  return (
    <PopupWindow
      title="Accounts Balances"
      icon={<Scale size={15} className="text-slate-500" />}
      onClose={onClose}
      footer={
        <>
          <PopupCheck label="Print Urdu" checked={printUrdu} onChange={setPrintUrdu} />
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
          <PopupRadio name="bal-date-mode" label="All Dates" checked={dateMode === "all"} onChange={() => setDateMode("all")} />
          <PopupRadio name="bal-date-mode" label="Single Date" checked={dateMode === "single"} onChange={() => setDateMode("single")} />
          <PopupRadio name="bal-date-mode" label="Date Range" checked={dateMode === "range"} onChange={() => setDateMode("range")} />
        </div>
        {dateMode === "single" && (
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm w-full sm:w-56" />
        )}
        {dateMode === "range" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm flex-1" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm flex-1" />
          </div>
        )}

        <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/60">
          <PopupRadio name="accounts-shown" label="Show Only Transaction Accounts"
            checked={accountsShown === "transaction"} onChange={() => setAccountsShown("transaction")} />
          <PopupRadio name="accounts-shown" label="Show Only Accounts Group"
            checked={accountsShown === "group"} onChange={() => setAccountsShown("group")} />
          <PopupRadio name="accounts-shown" label="Show Both Accounts"
            checked={accountsShown === "both"} onChange={() => setAccountsShown("both")} />
        </div>

        <PopupCheck
          label="Exclude Accounts Having No Transaction"
          checked={excludeNoTransaction}
          onChange={setExcludeNoTransaction}
        />

        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
          <PopupRadio name="parties-shown" label="Exclude Parties" checked={partiesShown === "exclude"} onChange={() => setPartiesShown("exclude")} />
          <PopupRadio name="parties-shown" label="Include Parties" checked={partiesShown === "include"} onChange={() => setPartiesShown("include")} />
          <PopupRadio name="parties-shown" label="Only Parties" checked={partiesShown === "only"} onChange={() => setPartiesShown("only")} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Head Type</label>
            <Select value={headType} onChange={(e) => setHeadType(e.target.value)}>
              <option value="ALL">------- All Accounts Head -------</option>
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Closing Value more than</label>
            <input
              type="number"
              inputMode="decimal"
              value={closingValueMoreThan}
              onChange={(e) => setClosingValueMoreThan(e.target.value)}
              placeholder="0"
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          <PopupCheck label="Extended" checked={extended} onChange={setExtended} />
          <PopupCheck label="Show Simple Report" checked={simpleReport} onChange={setSimpleReport} />
        </div>
      </div>
    </PopupWindow>
  );
}
