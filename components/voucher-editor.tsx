"use client";

import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Trash2,
  CircleAlert,
  CircleCheck,
  Printer,
  Download,
  CornerDownLeft,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AccountPicker } from "@/components/account-picker";
import { AccountSearchModal } from "@/components/account-search-modal";
import { VoucherOpenDialog } from "@/components/voucher-open-dialog";
import {
  useLedgerAccounts,
  coaRef,
  type LedgerAccount,
} from "@/lib/hooks/use-ledger-accounts";
import {
  saveVoucherWithLines,
  fetchVoucherWithLines,
  voidVoucher,
  fetchNextVoucherNumber,
  type VoucherLineDraft,
  type VoucherType,
} from "@/lib/supabase/vouchers";
import { useAuth } from "@/components/auth-provider";
import { useBusiness } from "@/components/business-provider";
import {
  buildVoucherPdf,
  downloadPdf,
  loadLogoAsPng,
  printPdf,
  type VoucherPdfData,
} from "@/lib/voucher-pdf";
import { formatAmount } from "@/lib/format";

/** The chart-of-accounts code every fresh business is seeded with for
 *  "Cash in Hand" (see lib/coa-data.ts mockAccounts — it mirrors the
 *  real seed_new_business() trigger), used as the automatic Cash leg
 *  for Cash Receiving/Payment vouchers. */
const CASH_ACCOUNT_CODE = "1010001";
const CASH_REF = coaRef(CASH_ACCOUNT_CODE);

type CommittedLine = {
  id: string;
  ref: string;
  label: string;
  narration: string;
  amount: number; // "single" mode
  debit: number; // "dual" mode
  credit: number; // "dual" mode
};

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
  anchorLabel,
}: {
  voucherType: VoucherType | "journal";
  title: string;
  numberPrefix: string;
  anchor: VoucherAnchor;
  /** "single": entry bar posts one Account+Narration+Amount per row,
   *  side implied by the anchor. "dual": Journal-style — each row
   *  picks its own Debit or Credit amount, no anchor. */
  mode: "single" | "dual";
  /** Default narration text suggested when an account is picked. */
  narrationTemplate: (accountLabel: string) => string;
  withholdingTax?: boolean;
  showCheque?: boolean;
  /** Contra Voucher: the line side is always this one account (Cash) —
   *  shown as a locked label in the entry bar instead of a search. */
  fixedLineRef?: string;
  fixedLineLabel?: string;
  /** Overrides the "Bank Account (Dr/Cr)" heading, e.g. "From Bank Account" for IBFT. */
  anchorLabel?: string;
}) {
  const { accounts, loading: accountsLoading } = useLedgerAccounts();
  const { business } = useBusiness();
  const { user } = useAuth();
  const [outputBusy, setOutputBusy] = useState<"print" | "pdf" | null>(null);

  const [voucherNo, setVoucherNo] = useState("…");
  const [numberReady, setNumberReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<"draft" | "posted" | "void" | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankRef, setBankRef] = useState(""); // anchor account for kind:"bank"
  const [whtPercent, setWhtPercent] = useState(4.5);
  const [whtAccountRef, setWhtAccountRef] = useState("");
  const [lines, setLines] = useState<CommittedLine[]>([]);

  // ---- entry bar (the one row you fill in, then commit to the grid) ----
  const [entryRef, setEntryRef] = useState(fixedLineRef ?? "");
  const [entryLabel, setEntryLabel] = useState(fixedLineLabel ?? "");
  const [entryNarration, setEntryNarration] = useState("");
  const [entryAmount, setEntryAmount] = useState(0);
  const [entryDebit, setEntryDebit] = useState(0);
  const [entryCredit, setEntryCredit] = useState(0);
  const [entryEditingId, setEntryEditingId] = useState<string | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const narrationInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

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

  function resetEntryBar() {
    setEntryRef(fixedLineRef ?? "");
    setEntryLabel(fixedLineLabel ?? "");
    setEntryNarration(fixedLineRef ? narrationTemplate(fixedLineLabel ?? "") : "");
    setEntryAmount(0);
    setEntryDebit(0);
    setEntryCredit(0);
    setEntryEditingId(null);
  }

  function resetForm() {
    setLines([]);
    resetEntryBar();
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
    setEditingStatus(null);
    resetForm();
    await loadNextNumber();
  }

  function accountLabel(ref: string): string {
    return accounts.find((a: LedgerAccount) => a.ref === ref)?.label ?? ref;
  }

  function handlePickAccount(account: LedgerAccount) {
    setEntryRef(account.ref);
    setEntryLabel(account.label);
    if (!entryNarration.trim()) setEntryNarration(narrationTemplate(account.label));
    setAccountModalOpen(false);
    setTimeout(() => narrationInputRef.current?.focus(), 0);
  }

  /** Commit the entry bar as a new row in the grid, then reset the
   *  entry bar so the next row can be typed straight away. */
  function commitEntry() {
    setError(null);
    if (!entryRef) {
      setError("Choose an account first.");
      accountTriggerRef.current?.focus();
      return;
    }
    const amountOk = mode === "single" ? entryAmount > 0 : entryDebit > 0 || entryCredit > 0;
    if (!amountOk) {
      setError(mode === "single" ? "Enter an amount." : "Enter a Debit or a Credit amount.");
      amountInputRef.current?.focus();
      return;
    }

    const row: CommittedLine = {
      id: entryEditingId ?? Math.random().toString(36).slice(2, 9),
      ref: entryRef,
      label: entryLabel,
      narration: entryNarration,
      amount: entryAmount,
      debit: entryDebit,
      credit: entryCredit,
    };

    setLines((ls) => {
      if (entryEditingId) return ls.map((l) => (l.id === entryEditingId ? row : l));
      return [...ls, row];
    });
    setSaved(false);
    resetEntryBar();
    setTimeout(() => accountTriggerRef.current?.focus(), 0);
  }

  function editRow(l: CommittedLine) {
    setEntryEditingId(l.id);
    setEntryRef(l.ref);
    setEntryLabel(l.label);
    setEntryNarration(l.narration);
    setEntryAmount(l.amount);
    setEntryDebit(l.debit);
    setEntryCredit(l.credit);
    setTimeout(() => narrationInputRef.current?.focus(), 0);
  }

  function removeRow(id: string) {
    setLines((ls) => ls.filter((l) => l.id !== id));
    if (entryEditingId === id) resetEntryBar();
    setSaved(false);
  }

  const singleTotal = lines.reduce((s, l) => s + l.amount, 0);
  const dualDebit = lines.reduce((s, l) => s + l.debit, 0);
  const dualCredit = lines.reduce((s, l) => s + l.credit, 0);
  const whtAmount = withholdingTax ? Math.round((singleTotal * whtPercent) / 100) : 0;
  const netCash = singleTotal - whtAmount;
  const balanced = mode === "dual" ? Math.abs(dualDebit - dualCredit) < 0.01 : true;

  function buildFinalLines(): VoucherLineDraft[] | null {
    if (mode === "dual") {
      if (!lines.length) return null;
      return lines.map((l) => ({
        ref: l.ref,
        narration: l.narration,
        debit: l.debit,
        credit: l.credit,
      }));
    }

    if (!lines.length) return null;
    const userSide = anchor.kind === "none" ? "debit" : anchor.side === "debit" ? "credit" : "debit";
    const rows: VoucherLineDraft[] = lines.map((l) => ({
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

  /** Shared by Save, Print and Download PDF — a voucher that can't be
   *  saved can't be printed either. */
  function validationError(): string | null {
    if (mode === "single" && anchor.kind === "bank" && !bankRef) {
      return "Choose the bank account this voucher posts against.";
    }
    if (mode === "single" && anchor.kind === "bank" && lines.some((l) => l.ref === bankRef)) {
      return "A row uses the same account as the bank account above — choose a different account.";
    }
    if (!lines.length) {
      return "Add at least one row (fill the entry bar and press Enter).";
    }
    if (mode === "dual" && !balanced) {
      return `Debit and Credit don't match — Dr Rs ${formatAmount(dualDebit)}, Cr Rs ${formatAmount(dualCredit)}.`;
    }
    if (withholdingTax && !whtAccountRef) {
      return "Choose the Withholding Tax Payable account for this voucher.";
    }
    return null;
  }

  async function handleSave() {
    setError(null);
    const problem = validationError();
    if (problem) {
      setError(problem);
      return;
    }

    const finalLines = buildFinalLines();
    if (!finalLines) {
      setError("Add at least one row (fill the entry bar and press Enter).");
      return;
    }

    const combinedNarration = lines.map((l) => l.narration).filter(Boolean).join("; ");

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
    // Clearing while editing an existing (already-saved) voucher only
    // discards the unsaved changes in this form — it no longer deletes
    // the saved voucher itself. A saved voucher can only be removed by
    // voiding it (see handleVoid below), which keeps its audit trail.
    if (editingId) {
      const freedNumber = voucherNo;
      setEditingId(null);
      setEditingStatus(null);
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
    setEditingStatus(full.status);
    setVoucherNo(full.header.voucherNo);
    setNumberReady(true);
    setDate(full.header.date);
    setChequeNo(full.header.chequeNo ?? "");
    setChequeDate(full.header.chequeDate ?? "");
    setError(null);
    setSaved(false);
    resetEntryBar();

    if (mode === "dual") {
      setLines(
        full.lines.map((l) => ({
          id: l.id,
          ref: l.ref,
          label: accountLabel(l.ref),
          narration: l.narration,
          amount: 0,
          debit: l.debit,
          credit: l.credit,
        }))
      );
      return;
    }

    let resolvedBankRef = bankRef;
    if (anchor.kind === "bank") {
      const guess = full.lines.find((l) => l.ref.startsWith("coa:") && !l.narration.startsWith("Withholding tax @"));
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
        label: accountLabel(l.ref),
        narration: l.narration,
        amount: l.debit || l.credit,
        debit: 0,
        credit: 0,
      }))
    );
  }

  /** Builds the formatted voucher PDF from what's on screen right now
   *  (the real posting lines, including the automatic cash/bank and
   *  withholding-tax legs, debits first). */
  async function buildPdfBytes(): Promise<Uint8Array | null> {
    setError(null);
    const problem = validationError();
    if (problem) {
      setError(problem);
      return null;
    }
    const finalLines = buildFinalLines();
    if (!finalLines) {
      setError("Add at least one row (fill the entry bar and press Enter).");
      return null;
    }

    const describe = (ref: string) => {
      const found = accounts.find((a: LedgerAccount) => a.ref === ref);
      return {
        no: found?.sublabel ?? "",
        name: found?.label ?? (ref === CASH_REF ? "Cash in Hand" : ref),
      };
    };
    const pdfLines = finalLines
      .map((l) => {
        const d = describe(l.ref);
        return {
          accountNo: d.no,
          accountName: d.name,
          narration: l.narration,
          debit: l.debit,
          credit: l.credit,
        };
      })
      .sort((a, b) => Number(b.debit > 0) - Number(a.debit > 0));

    const payload: VoucherPdfData = {
      business: {
        name: business?.name || "Business",
        address: business?.address,
        phone: business?.contactPhone,
        email: business?.contactEmail,
        taxNumber: business?.taxNumber,
      },
      logoPng: await loadLogoAsPng(business?.logoUrl),
      title,
      voucherNo,
      date,
      chequeNo: showCheque ? chequeNo : null,
      chequeDate: showCheque ? chequeDate : null,
      lines: pdfLines,
      preparedBy: user?.name || user?.email || null,
    };
    return buildVoucherPdf(payload);
  }

  async function handlePrint() {
    setOutputBusy("print");
    try {
      const bytes = await buildPdfBytes();
      if (bytes) printPdf(bytes);
    } catch (e) {
      console.error("Voucher print failed:", e);
      setError("Couldn't prepare the voucher for printing. Please try again.");
    } finally {
      setOutputBusy(null);
    }
  }

  async function handleDownloadPdf() {
    setOutputBusy("pdf");
    try {
      const bytes = await buildPdfBytes();
      if (bytes) {
        const safe = `${title}-${voucherNo}`.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
        downloadPdf(bytes, `${safe}.pdf`);
      }
    } catch (e) {
      console.error("Voucher PDF failed:", e);
      setError("Couldn't create the PDF. Please try again.");
    } finally {
      setOutputBusy(null);
    }
  }

  async function handleVoid() {
    if (!editingId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    const reason = window.prompt(
      "Reason for voiding this voucher (kept in the audit trail):"
    );
    if (reason === null) {
      setConfirmingDelete(false);
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required to void a posted voucher.");
      return;
    }
    setSaving(true);
    const { error: voidErr } = await voidVoucher(editingId, reason.trim());
    setSaving(false);
    setConfirmingDelete(false);
    if (voidErr) {
      setError(voidErr);
      return;
    }
    await backToNewVoucher();
  }

  async function handleClose() {
    setConfirmingDelete(false);
    await backToNewVoucher();
  }

  const entryAmountField =
    mode === "single" ? (
      <Input
        ref={amountInputRef}
        type="number"
        placeholder="Amount"
        className="text-right"
        value={entryAmount || ""}
        onChange={(e) => setEntryAmount(Number(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && commitEntry()}
      />
    ) : (
      <div className="grid grid-cols-2 gap-1.5">
        <Input
          ref={amountInputRef}
          type="number"
          placeholder="Dr"
          className="text-right"
          value={entryDebit || ""}
          onChange={(e) => { setEntryDebit(Number(e.target.value)); setEntryCredit(0); }}
          onKeyDown={(e) => e.key === "Enter" && commitEntry()}
        />
        <Input
          type="number"
          placeholder="Cr"
          className="text-right"
          value={entryCredit || ""}
          onChange={(e) => { setEntryCredit(Number(e.target.value)); setEntryDebit(0); }}
          onKeyDown={(e) => e.key === "Enter" && commitEntry()}
        />
      </div>
    );

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
            {editingId && editingStatus && editingStatus !== "draft" && (
              <span
                className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  editingStatus === "void"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {editingStatus === "void"
                  ? "Void — read only"
                  : "Posted — locked. Use Void to correct it."}
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
        </div>
      </div>

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
              <Label>
                {anchorLabel ?? "Bank Account"} {anchor.side === "debit" ? "(Dr)" : "(Cr)"}
              </Label>
              <AccountPicker
                accounts={accounts.filter((a) => a.kind === "coa")}
                value={bankRef}
                onChange={(ref) => { setBankRef(ref); setSaved(false); }}
                loading={accountsLoading}
                placeholder="Search your bank account head…"
              />
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

        {/* Entry bar — fill this, press Enter, it drops into the grid below */}
        <div className="rounded-lg border border-brand-600/30 bg-brand-50/40 p-3">
          <p className="text-[11px] font-medium text-brand-700 uppercase tracking-wide mb-2">
            {entryEditingId ? "Editing row — press Enter to update" : "New entry"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr_120px] gap-2 sm:items-center">
            <div>
              <span className="block text-[11px] text-slate-400 mb-0.5 sm:hidden">A/c No</span>
              <button
                ref={accountTriggerRef}
                type="button"
                disabled={!!fixedLineRef}
                onClick={() => setAccountModalOpen(true)}
                className="w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white px-3 flex items-center justify-between gap-1 text-left text-sm disabled:bg-slate-50 disabled:text-slate-500 hover:border-brand-600/50 transition-colors"
              >
                <span className={entryRef ? "text-slate-900 figure" : "text-slate-400"}>
                  {entryRef ? accounts.find((a) => a.ref === entryRef)?.sublabel ?? "—" : "A/c No…"}
                </span>
                {!fixedLineRef && <MoreHorizontal size={14} className="text-slate-400 shrink-0" />}
              </button>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 mb-0.5 sm:hidden">A/c Name</span>
              <div className="h-10 sm:h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-700 truncate">
                {entryLabel || "—"}
              </div>
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 mb-0.5 sm:hidden">Narration</span>
              <Input
                ref={narrationInputRef}
                placeholder="Narration"
                value={entryNarration}
                onChange={(e) => setEntryNarration(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && amountInputRef.current?.focus()}
              />
            </div>
            <div>
              <span className="block text-[11px] text-slate-400 mb-0.5 sm:hidden">
                {mode === "dual" ? "Dr / Cr" : "Amount"}
              </span>
              {entryAmountField}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <CornerDownLeft size={11} /> Press Enter in Amount to add the row
            </p>
            <Button type="button" variant="secondary" onClick={commitEntry}>
              {entryEditingId ? "Update Row" : "Add Row"}
            </Button>
          </div>
        </div>

        {/* Grid of committed rows */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="text-left font-medium px-3 py-2 w-28">A/c No</th>
                <th className="text-left font-medium px-3 py-2">A/c Name</th>
                <th className="text-left font-medium px-3 py-2">Narration</th>
                <th className="text-right font-medium px-3 py-2 w-28">
                  {mode === "dual" ? "Debit" : "Amount"}
                </th>
                {mode === "dual" && <th className="text-right font-medium px-3 py-2 w-28">Credit</th>}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={mode === "dual" ? 6 : 5} className="text-center text-slate-400 py-6 text-sm">
                    No rows yet — fill the entry bar above.
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => editRow(l)}
                    className={`border-t border-slate-100 cursor-pointer ${
                      entryEditingId === l.id ? "bg-brand-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-500 figure">{accounts.find((a) => a.ref === l.ref)?.sublabel ?? ""}</td>
                    <td className="px-3 py-2 text-slate-900">{l.label}</td>
                    <td className="px-3 py-2 text-slate-500 truncate max-w-[220px]">{l.narration}</td>
                    <td className="px-3 py-2 text-right figure font-medium">
                      Rs {formatAmount(mode === "dual" ? l.debit : l.amount)}
                    </td>
                    {mode === "dual" && (
                      <td className="px-3 py-2 text-right figure font-medium">Rs {formatAmount(l.credit)}</td>
                    )}
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeRow(l.id); }}
                        className="text-slate-300 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="rule-t pt-4 space-y-1.5 text-sm">
          {mode === "single" ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Total Amount</span>
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
                Total Debit Rs {formatAmount(dualDebit)} &nbsp;·&nbsp; Total Credit Rs {formatAmount(dualCredit)}
              </span>
              {!balanced && (
                <span className="text-xs font-medium text-money-out">Not balanced yet</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar: Save / Clear / Open / Delete / Close, then Print & PDF */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !numberReady || (editingStatus !== null && editingStatus !== "draft")}
        >
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
          onClick={handleVoid}
          disabled={saving || !editingId}
          className={confirmingDelete ? "border-red-300 text-red-700 bg-red-50" : ""}
        >
          {confirmingDelete ? "Confirm Void?" : "Void"}
        </Button>
        <Button variant="secondary" onClick={handleClose} disabled={saving}>
          Close
        </Button>
        <Button variant="secondary" onClick={handlePrint} disabled={saving || !!outputBusy}>
          <Printer size={15} />
          {outputBusy === "print" ? "Preparing…" : "Print"}
        </Button>
        <Button variant="secondary" onClick={handleDownloadPdf} disabled={saving || !!outputBusy}>
          <Download size={15} />
          {outputBusy === "pdf" ? "Preparing…" : "Download PDF"}
        </Button>
      </div>

      {accountModalOpen && (
        <AccountSearchModal
          accounts={accounts}
          onSelect={handlePickAccount}
          onClose={() => setAccountModalOpen(false)}
        />
      )}

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
