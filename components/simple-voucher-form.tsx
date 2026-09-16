"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { mockParties } from "@/lib/party-data";
import { bankAccounts } from "@/lib/chart-of-accounts";
import { saveVoucher, type VoucherType } from "@/lib/supabase/vouchers";

export function SimpleVoucherForm({
  title,
  voucherPrefix,
  voucherType,
  partyLabel,
  showBankAccount = false,
  showCheque = false,
  showWht = false,
}: {
  title: string;
  voucherPrefix: string;
  voucherType: VoucherType;
  partyLabel: "Customer" | "Vendor";
  showBankAccount?: boolean;
  showCheque?: boolean;
  showWht?: boolean;
}) {
  const [voucherNo] = useState(
    `${voucherPrefix}-${Math.floor(1000 + Math.random() * 8999)}`
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyId, setPartyId] = useState(mockParties[0]?.id ?? "");
  const [bankAccount, setBankAccount] = useState(bankAccounts[0]);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [whtPercent, setWhtPercent] = useState<number>(4.5);
  const [narration, setNarration] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const whtAmount = showWht
    ? Math.round((grossAmount * whtPercent) / 100)
    : 0;
  const netAmount = grossAmount - whtAmount;

  function markDirty() {
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const { error } = await saveVoucher({
      voucherNo,
      voucherType,
      date,
      partyId,
      bankAccount: showBankAccount ? bankAccount : undefined,
      chequeNo: showCheque ? chequeNo : undefined,
      chequeDate: showCheque ? chequeDate : undefined,
      grossAmount,
      whtPercent: showWht ? whtPercent : undefined,
      whtAmount: showWht ? whtAmount : undefined,
      netAmount,
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
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
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

          {showBankAccount && (
            <div>
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
          )}

          <div className={showBankAccount ? "sm:col-span-2" : ""}>
            <Label htmlFor="v-party">{partyLabel}</Label>
            <Select
              id="v-party"
              value={partyId}
              onChange={(e) => {
                setPartyId(e.target.value);
                markDirty();
              }}
            >
              {mockParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </Select>
          </div>

          {showCheque && (
            <>
              <div>
                <Label htmlFor="cheque-no">Cheque #</Label>
                <Input
                  id="cheque-no"
                  value={chequeNo}
                  onChange={(e) => {
                    setChequeNo(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div>
                <Label htmlFor="cheque-date">Cheque Date</Label>
                <Input
                  id="cheque-date"
                  type="date"
                  value={chequeDate}
                  onChange={(e) => {
                    setChequeDate(e.target.value);
                    markDirty();
                  }}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="gross-amount">
              {showWht ? "Gross Amount" : "Amount"}
            </Label>
            <Input
              id="gross-amount"
              type="number"
              min={0}
              value={grossAmount || ""}
              onChange={(e) => {
                setGrossAmount(parseFloat(e.target.value) || 0);
                markDirty();
              }}
            />
          </div>

          {showWht && (
            <div>
              <Label htmlFor="wht-percent">Withholding Tax %</Label>
              <Input
                id="wht-percent"
                type="number"
                min={0}
                step={0.1}
                value={whtPercent || ""}
                onChange={(e) => {
                  setWhtPercent(parseFloat(e.target.value) || 0);
                  markDirty();
                }}
              />
            </div>
          )}
        </div>

        {showWht && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Gross Amount</span>
              <span className="tabular-nums">
                {grossAmount.toLocaleString("en-PK")}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>WHT Deducted ({whtPercent}%)</span>
              <span className="tabular-nums">
                ({whtAmount.toLocaleString("en-PK")})
              </span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-2">
              <span>Net Payment</span>
              <span className="tabular-nums">
                {netAmount.toLocaleString("en-PK")}
              </span>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="narration">Narration</Label>
          <Input
            id="narration"
            value={narration}
            onChange={(e) => {
              setNarration(e.target.value);
              markDirty();
            }}
            placeholder="Reason / description for this voucher"
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
