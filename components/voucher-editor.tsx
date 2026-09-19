"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CircleAlert, CircleCheck, Printer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { AccountPicker } from "@/components/account-picker";
import { VoucherOpenDialog } from "@/components/voucher-open-dialog";
import {
  useLedgerAccounts,
  coaRef,
  type LedgerAccount,
} from "@/lib/hooks/use-ledger-accounts";
import {
  saveVoucherWithLines,
  fetchVoucherWithLines,
  deleteVoucherCascade,
  fetchNextVoucherNumber,
  type VoucherLineDraft,
  type VoucherType,
} from "@/lib/supabase/vouchers";
import { formatAmount } from "@/lib/format";

/** The chart-of-accounts code every fresh business is seeded with for
 *  "Cash in Hand" (see lib/coa-data.ts mockAccounts — it mirrors the
 *  real seed_new_business() trigger), used as the automatic Cash leg
 *  for Cash Receiving/Payment vouchers. */
const CASH_ACCOUNT_CODE = "1010001";
const CASH_REF = coaRef(CASH_ACCOUNT_CODE);

type EditableLine = {
  id: string;
  ref: string;
  narration: string;
  amount: number; // used in "single" mode
  debit: number; // used in "dual" mode
  credit: number; // used in "dual" mode
};

function blankLine(): EditableLine {
  return {
    id: Math.random().toString(36).slice(2, 9),
    ref: "",
    narration: "",
    amount: 0,
    debit: 0,
    credit: 0,
  };
}

export type VoucherAnchor =
  | { kind: "cash"; side: "debit" | "credit" }
  | { kind: "bank"; side: "debit" | "credit" }
  | { kind: "none" }; // Journal Voucher — fully manual, no fixed side

export function VoucherEditor({
  voucherType,
  title,
  numberPrefix,
  anchor,
  mode,
  narrationTemplate,
  withholdingTax = false,
  showCheque = false,
  fixedLineRef,
  fixedLineLabel,
}: {
  voucherType: VoucherType | "journal";
  title: string;
  numberPrefix: string;
  anchor: VoucherAnchor;
  /** "single": one Account+Narration+Amount per row, side implied by
   *  the anchor. "dual": Journal-style — each row picks its own
   *  Debit or Credit amount, no anchor. */
  mode: "single" | "dual";
  /** Default narration text suggested when an account is picked. */
  narrationTemplate: (accountLabel: string) => string;
  withholdingTax?: boolean;
  showCheque?: boolean;
  /** Contra Voucher: the line side is always this one account (Cash) —
   *  shown as a static label instead of a picker. */
  fixedLineRef?: string;
  fixedLineLabel?: string;
}) {
  const { accounts, loading: accountsLoading } = useLedgerAccounts();

  const [voucherNo, setVoucherNo] = useState("…");
  const [numberReady, setNumberReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankRef, setBankRef] = useState(""); // anchor account for kind:"bank"
  const [whtPercent, setWhtPercent] = useState(4.5);
  const [whtAccountRef, setWhtAccountRef] = useState("");
  const [lines, setLines] = useState<EditableLine[]>(() => [
    fixedLineRef
      ? { ...blankLine(), ref: fixedLineRef, narration: narrationTemplate(fixedLineLabel ?? "") }
      : blankLine(),
  ]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function loadNextNumber() {
    setNumberReady(false);
    const n = await fetchNextVoucherNumber(numberPrefix);
    setVoucherNo(n);
    setNumberReady(true);
  }

  useEffect(() => {
    loadNextNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setLines([
      fixedLineRef
        ? { ...blankLine(), ref: fixedLineRef, narration: narrationTemplate(fixedLineLabel ?? "") }
        : blankLine(),
    ]);
    setChequeNo("");
    setChequeDate("");
    setDate(new Date().toISOString().slice(0, 10));
    setError(null);
    setSaved(false);
    setConfirmingDelete(false);
  }

  /** Save / Clear / Delete / Close all end back at a fresh, blank,
   *  next-numbered voucher — the "voucher book" always sits open to
   *  a new page. */
  async function backToNewVoucher() {
    setEditingId(null);
    resetForm();
    await loadNextNumber();
  }

  function updateLine(id: string, patch: Partial<EditableLine>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setSaved(false);
  }

  function accountLabel(ref: string): string {
    return accounts.find((a: LedgerAccount) => a.ref === ref)?.label ?? ref;
  }

  function handlePickAccount(id: string, ref: string, account: LedgerAccount | null) {
    setLines((ls) =>
      ls.map((l) =>
        l.id === id
          ? {
              ...l,
              ref,
              narration:
                !l.narration.trim() && account
                  ? narrationTemplate(account.label)
                  : l.narration,
            }
          : l
      )
    );
    setSaved(false);
  }

  const activeLines = lines.filter((l) => l.ref && (l.amount > 0 || l.debit > 0 || l.credit > 0));
  const singleTotal = activeLines.reduce((s, l) => s + (l.amount || 0), 0);
  const dualDebit = activeLines.reduce((s, l) => s + (l.debit || 0), 0);
  const dualCredit = activeLines.reduce((s, l) => s + (l.credit || 0), 0);
  const whtAmount = withholdingTax ? Math.round((singleTotal * whtPercent) / 100) : 0;
  const netCash = singleTotal - whtAmount;
  const balanced = mode === "dual" ? Math.abs(dualDebit - dualCredit) < 0.01 : true;

  function buildFinalLines(): VoucherLineDraft[] | null {
    if (mode === "dual") {
      if (!activeLines.length) return null;
      return activeLines.map((l) => ({
        ref: l.ref,
        narration: l.narration,
        debit: l.debit || 0,
        credit: l.credit || 0,
      }));
    }

    // single mode: user rows are one side, anchor is the automatic other side
    if (!activeLines.length) return null;
    const userSide = anchor.kind === "none" ? "debit" : anchor.side === "debit" ? "credit" : "debit";
    const rows: VoucherLineDraft[] = activeLines.map((l) => ({
      ref: l.ref,
      narration: l.narration,
      debit: userSide === "debit" ? l.amount : 0,
      credit: userSide === "credit" ? l.amount : 0,
    }));

    if (anchor.kind === "cash" || anchor.kind === "bank") {
      const anchorRef = anchor.kind === "cash" ? CASH_REF : bankRef;
      if (!anchorRef) return null;
      const anchorAmount = withholdingTax ? netCash : singleTotal;
      rows.push({
        ref: anchorRef,
        narration: withholdingTax ? "Net cash paid" : accountLabel(anchorRef),
        debit: anchor.side === "debit" ? anchorAmount : 0,
        credit: anchor.side === "credit" ? anchorAmount : 0,
      });

      if (withholdingTax && whtAmount > 0 && whtAccountRef) {
        // WHT payable sits on the same side as the anchor — it's an
        // amount the business now owes the tax authority instead of
        // paying out, same direction as "money not going out in cash".
        rows.push({
          ref: whtAccountRef,
          narration: `Withholding tax @ ${whtPercent}%`,
          debit: anchor.side === "debit" ? whtAmount : 0,
          credit: anchor.side === "credit" ? whtAmount : 0,
        });
      }
    }
    return rows;
  }

  async function handleSave() {
    setError(null);
    if (mode === "single" && anchor.kind === "bank" && !bankRef) {
      setError("Choose the bank account this voucher posts against.");
      return;
    }
    if (!activeLines.length) {
      setError("Add at least one line with an account and an amount.");
      return;
    }
    if (mode === "dual" && !balanced) {
      setError(
        `Debit and Credit don't match — Dr Rs ${formatAmount(dualDebit)}, Cr Rs ${formatAmount(dualCredit)}.`
      );
      return;
    }
    if (withholdingTax && !whtAccountRef) {
      setError("Choose the Withholding Tax Payable account for this voucher.");
      return;
    }

    const finalLines = buildFinalLines();
    if (!finalLines) {
      setError("Add at least one line with an account and an amount.");
      return;
    }

    const combinedNarration = activeLines
      .map((l) => l.narration)
      .filter(Boolean)
      .join("; ");

    setSaving(true);
    const { error: err } = await saveVoucherWithLines(
      {
        voucherNo,
        voucherType,
        date,
        narration: combinedNarration || undefined,
        chequeNo: showCheque ? chequeNo || undefined : undefined,
        chequeDate: showCheque ? chequeDate || undefined : undefined,
      },
      finalLines,
      editingId ?? undefined
    );
    setSaving(false);

    if (err) {
      setError(err);
      return;
    }
    setSaved(true);
    setTimeout(() => backToNewVoucher(), 700);
  }

  async function handleClear() {
    if (editingId) {
      // Clearing a previously-saved, now-opened voucher deletes it —
      // its number comes back as a blank draft, ready for fresh entry.
      setSaving(true);
      await deleteVoucherCascade(editingId);
      setSaving(false);
      const freedNumber = voucherNo;
      setEditingId(null);
      resetForm();
      setVoucherNo(freedNumber);
      setNumberReady(true);
      return;
    }
    resetForm();
  }

  async function handleOpenPick(id: string) {
    setOpenDialogVisible(false);
    const full = await fetchVoucherWithLines(id);
    if (!full) {
      setError("Couldn't load that voucher.");
      return;
    }
    setEditingId(full.id);
    setVoucherNo(full.header.voucherNo);
    setNumberReady(true);
    setDate(full.header.date);
    setChequeNo(full.header.chequeNo ?? "");
    setChequeDate(full.header.chequeDate ?? "");
    setError(null);
    setSaved(false);

    if (mode === "dual") {
      setLines(
        full.lines.length
          ? full.lines.map((l) => ({
              id: l.id,
              ref: l.ref,
              narration: l.narration,
              amount: 0,
              debit: l.debit,
              credit: l.credit,
            }))
          : [blankLine()]
      );
      return;
    }

    // Drop the automatic anchor / WHT row(s) — only show the
    // user-editable side back in the grid; they're re-derived on save.
    let resolvedBankRef = bankRef;
    if (anchor.kind === "bank") {
      const guess = full.lines.find((l) => l.ref.startsWith("coa:") && !l.narration.startsWith("Withholding tax @"));
      // Prefer the line whose amount matches the total of the others (the anchor).
      const total = full.lines.reduce((s, l) => s + Math.max(l.debit, l.credit), 0) / 2;
      const anchorGuess = full.lines.find((l) => Math.abs(Math.max(l.debit, l.credit) - total) < 0.01) ?? guess;
      if (anchorGuess) resolvedBankRef = anchorGuess.ref;
      setBankRef(resolvedBankRef);
    }
    const whtLine = withholdingTax
      ? full.lines.find((l) => l.narration.startsWith("Withholding tax @"))
      : undefined;
    if (whtLine) setWhtAccountRef(whtLine.ref);
    const anchorRefs = new Set(
      [anchor.kind === "cash" ? CASH_REF : resolvedBankRef, whtLine?.ref].filter(Boolean)
    );
    const userLines = full.lines.filter((l) => !anchorRefs.has(l.ref));
    setLines(
      (userLines.length ? userLines : full.lines).map((l) => ({
        id: l.id,
        ref: l.ref,
        narration: l.narration,
        amount: l.debit || l.credit,
        debit: 0,
        credit: 0,
      }))
    );
  }

  async function handleDelete() {
    if (!editingId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setSaving(true);
    await deleteVoucherCascade(editingId);
    setSaving(false);
    setConfirmingDelete(false);
    await backToNewVoucher();
  }

  async function handleClose() {
    setConfirmingDelete(false);
    await backToNewVoucher();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Voucher #{" "}
            <span className="font-medium text-slate-700">
              {numberReady ? voucherNo : "Assigning…"}
            </span>
            {editingId && (
              <span className="ml-2 rounded bg-amber-50 text-amber-700 px-1.5 py-0.5 text-[11px] font-medium">
                Editing saved voucher
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <CircleCheck size={13} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            title="Print"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      <DataModeBanner />

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
          <CircleAlert size={14} /> {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} />
          </div>

          {anchor.kind === "bank" && (
            <div className="sm:col-span-2">
              <Label>Bank Account {anchor.side === "debit" ? "(Dr)" : "(Cr)"}</Label>
              <AccountPicker
                accounts={accounts.filter((a) => a.kind === "coa")}
                value={bankRef}
                onChange={(ref) => { setBankRef(ref); setSaved(false); }}
                loading={accountsLoading}
                placeholder="Search your bank account head…"
              />
            </div>
          )}

          {anchor.kind === "cash" && (
            <div className="sm:col-span-2">
              <Label>Cash Account {anchor.side === "debit" ? "(Dr, automatic)" : "(Cr, automatic)"}</Label>
              <div className="h-10 sm:h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-600">
                Cash in Hand
              </div>
            </div>
          )}

          {showCheque && (
            <>
              <div>
                <Label>Cheque #</Label>
                <Input value={chequeNo} onChange={(e) => { setChequeNo(e.target.value); setSaved(false); }} />
              </div>
              <div>
                <Label>Cheque Date</Label>
                <Input type="date" value={chequeDate} onChange={(e) => { setChequeDate(e.target.value); setSaved(false); }} />
              </div>
            </>
          )}

          {withholdingTax && (
            <>
              <div>
                <Label>Withholding Tax %</Label>
                <Input
                  type="number"
                  step={0.1}
                  value={whtPercent || ""}
                  onChange={(e) => { setWhtPercent(Number(e.target.value)); setSaved(false); }}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>WHT Payable Account</Label>
                <AccountPicker
                  accounts={accounts.filter((a) => a.kind === "coa")}
                  value={whtAccountRef}
                  onChange={(ref) => { setWhtAccountRef(ref); setSaved(false); }}
                  loading={accountsLoading}
                  placeholder="Search e.g. Withholding Tax Payable…"
                />
              </div>
            </>
          )}
        </div>

        {/* Line grid */}
        <div>
          <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_36px] gap-2 px-1 pb-1 text-[11px] font-medium text-slate-400 uppercase tracking-wide">
            <span>Account</span>
            <span>Narration</span>
            <span className="text-right">{mode === "dual" ? "Dr / Cr" : "Amount"}</span>
            <span />
          </div>
          <div className="space-y-2">
            {lines.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_36px] gap-2 sm:items-center"
              >
                {fixedLineRef ? (
                  <div className="h-10 sm:h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-600">
                    {fixedLineLabel}
                  </div>
                ) : (
                  <AccountPicker
                    accounts={accounts}
                    value={l.ref}
                    onChange={(ref, acc) => handlePickAccount(l.id, ref, acc)}
                    loading={accountsLoading}
                  />
                )}
                <Input
                  placeholder="Narration"
                  value={l.narration}
                  onChange={(e) => updateLine(l.id, { narration: e.target.value })}
                />
                {mode === "single" ? (
                  <Input
                    type="number"
                    placeholder="Amount"
                    className="text-right"
                    value={l.amount || ""}
                    onChange={(e) => updateLine(l.id, { amount: Number(e.target.value) })}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      type="number"
                      placeholder="Dr"
                      className="text-right"
                      value={l.debit || ""}
                      onChange={(e) => updateLine(l.id, { debit: Number(e.target.value), credit: 0 })}
                    />
                    <Input
                      type="number"
                      placeholder="Cr"
                      className="text-right"
                      value={l.credit || ""}
                      onChange={(e) => updateLine(l.id, { credit: Number(e.target.value), debit: 0 })}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.id !== l.id) : ls))}
                  className="h-10 flex items-center justify-center text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            onClick={() =>
              setLines((ls) => [
                ...ls,
                fixedLineRef
                  ? { ...blankLine(), ref: fixedLineRef, narration: narrationTemplate(fixedLineLabel ?? "") }
                  : blankLine(),
              ])
            }
          >
            <Plus size={14} /> Add Row
          </Button>
        </div>

        {/* Totals */}
        <div className="rule-t pt-4 space-y-1.5 text-sm">
          {mode === "single" ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Total</span>
                <span className="figure font-medium text-slate-900">Rs {formatAmount(singleTotal)}</span>
              </div>
              {withholdingTax && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Withholding Tax ({whtPercent}%)</span>
                    <span className="figure">(Rs {formatAmount(whtAmount)})</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>Net Cash Paid</span>
                    <span className="figure">Rs {formatAmount(netCash)}</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className={`figure font-medium ${balanced ? "text-slate-900" : "text-money-out"}`}>
                Dr Rs {formatAmount(dualDebit)} &nbsp;·&nbsp; Cr Rs {formatAmount(dualCredit)}
              </span>
              {!balanced && (
                <span className="text-xs font-medium text-money-out">Not balanced yet</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar: the 5 controls, in order */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={saving || !numberReady}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="secondary" onClick={handleClear} disabled={saving}>
          Clear
        </Button>
        <Button variant="secondary" onClick={() => setOpenDialogVisible(true)} disabled={saving}>
          Open
        </Button>
        <Button
          variant="secondary"
          onClick={handleDelete}
          disabled={saving || !editingId}
          className={confirmingDelete ? "border-red-300 text-red-700 bg-red-50" : ""}
        >
          {confirmingDelete ? "Confirm Delete?" : "Delete"}
        </Button>
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Close
        </Button>
      </div>

      {openDialogVisible && (
        <VoucherOpenDialog
          voucherType={voucherType}
          onPick={handleOpenPick}
          onClose={() => setOpenDialogVisible(false)}
        />
      )}
    </div>
  );
}
