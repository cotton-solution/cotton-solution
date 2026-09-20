"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { bankAccounts } from "@/lib/chart-of-accounts";
import { saveVoucher } from "@/lib/supabase/vouchers";
import { useDocumentNumber } from "@/lib/hooks/use-document-number";

/**
 * IBFT — Inter Bank Fund Transfer. Moves money from one of the
 * business's own bank accounts to another. No customer or vendor is
 * involved, so there is no party field. The "from" bank is stored in
 * `bank_account` and the "to" bank in `to_bank_account`.
 */
export function IbftVoucherForm() {
  const { number: voucherNo, ready: numberReady } = useDocumentNumber(
    "IBFT",
    "vouchers",
    "voucher_no"
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromBank, setFromBank] = useState(bankAccounts[0]);
  const [toBank, setToBank] = useState(bankAccounts[1] ?? bankAccounts[0]);
  const [amount, setAmount] = useState<number>(0);
  const [narration, setNarration] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function markDirty() {
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    if (fromBank === toBank) {
      setError("Choose two different bank accounts — From and To can't be the same.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    const { error } = await saveVoucher({
      voucherNo,
      voucherType: "ibft",
      date,
      bankAccount: fromBank,
      toBankAccount: toBank,
      grossAmount: amount,
      netAmount: amount,
      narration,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            IBFT — Inter Bank Fund Transfer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Voucher #{" "}
            <span className="font-medium text-slate-700">
              {numberReady ? voucherNo : "Assigning…"}
            </span>
          </p>
        </div>
        {saved && (
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
            Saved
          </span>
        )}
      </div>

      <DataModeBanner />

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
          <CircleAlert size={14} />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card space-y-4">
        <p className="text-xs text-slate-500">
          Use this to transfer funds from one of your bank accounts to
          another — no customer or vendor is involved.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="v-date">Date</Label>
            <Input
              id="v-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                markDirty();
              }}
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              value={amount || ""}
              onChange={(e) => {
                setAmount(parseFloat(e.target.value) || 0);
                markDirty();
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="v-from-bank">From Bank Account</Label>
            <Select
              id="v-from-bank"
              value={fromBank}
              onChange={(e) => {
                setFromBank(e.target.value);
                markDirty();
              }}
            >
              {bankAccounts.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="v-to-bank">To Bank Account</Label>
            <Select
              id="v-to-bank"
              value={toBank}
              onChange={(e) => {
                setToBank(e.target.value);
                markDirty();
              }}
            >
              {bankAccounts.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="narration">Narration</Label>
          <Input
            id="narration"
            value={narration}
            onChange={(e) => {
              setNarration(e.target.value);
              markDirty();
            }}
            placeholder="Reason / description for this transfer"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Voucher"}
        </Button>
      </div>
    </div>
  );
}
