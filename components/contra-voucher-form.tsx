"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { bankAccounts } from "@/lib/chart-of-accounts";
import { saveVoucher, type VoucherType } from "@/lib/supabase/vouchers";

type Direction = "cash_to_bank" | "bank_to_cash";

const DIRECTION_LABEL: Record<Direction, string> = {
  cash_to_bank: "Cash → Bank (deposit cash into a bank account)",
  bank_to_cash: "Bank → Cash (withdraw cash from a bank account)",
};

export function ContraVoucherForm() {
  const [voucherNo] = useState(
    `CTV-${Math.floor(1000 + Math.random() * 8999)}`
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [direction, setDirection] = useState<Direction>("cash_to_bank");
  const [bankAccount, setBankAccount] = useState(bankAccounts[0]);
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
    if (!amount || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    const voucherType: VoucherType =
      direction === "cash_to_bank" ? "contra_cash_to_bank" : "contra_bank_to_cash";
    const { error } = await saveVoucher({
      voucherNo,
      voucherType,
      date,
      bankAccount,
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
            Contra Voucher
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Voucher #{" "}
            <span className="font-medium text-slate-700">{voucherNo}</span>
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
          Use this for moving your own money between cash and a bank account —
          no customer or vendor is involved.
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
            <Label htmlFor="v-direction">Direction</Label>
            <Select
              id="v-direction"
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as Direction);
                markDirty();
              }}
            >
              {(Object.keys(DIRECTION_LABEL) as Direction[]).map((d) => (
                <option key={d} value={d}>
                  {DIRECTION_LABEL[d]}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="v-bank">Bank Account</Label>
            <Select
              id="v-bank"
              value={bankAccount}
              onChange={(e) => {
                setBankAccount(e.target.value);
                markDirty();
              }}
            >
              {bankAccounts.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
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
