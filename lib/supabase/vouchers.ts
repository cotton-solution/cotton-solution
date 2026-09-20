import { supabase } from "@/lib/supabase/client";

export type VoucherType =
  | "cash_receiving"
  | "cash_payment"
  | "bank_receipt"
  | "bank_payment"
  | "bank_cheque_deposit"
  | "bank_cheque_issue"
  | "cash_payment_wht"
  | "contra_cash_to_bank"
  | "contra_bank_to_cash"
  | "ibft";

export type VoucherRecord = {
  id: string;
  voucherNo: string;
  voucherType: VoucherType | "journal";
  date: string;
  partyId: string | null;
  bankAccount: string | null;
  chequeNo: string | null;
  grossAmount: number;
  whtAmount: number;
  netAmount: number;
  narration: string | null;
};

/**
 * All saved vouchers for the signed-in business, newest first. Powers
 * the voucher list on the Accounts Forms hub — previously a saved
 * voucher was only ever visible again by re-running a full report.
 */
export async function fetchVouchers(filter?: {
  types?: (VoucherType | "journal")[];
}): Promise<VoucherRecord[]> {
  if (!supabase) return [];
  let query = supabase
    .from("vouchers")
    .select(
      "id, voucher_no, voucher_type, voucher_date, party_id, bank_account, cheque_no, gross_amount, wht_amount, net_amount, narration"
    )
    .order("voucher_date", { ascending: false })
    .order("voucher_no", { ascending: false });

  if (filter?.types?.length) query = query.in("voucher_type", filter.types);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("fetchVouchers error:", error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    voucherNo: row.voucher_no,
    voucherType: row.voucher_type,
    date: row.voucher_date,
    partyId: row.party_id,
    bankAccount: row.bank_account,
    chequeNo: row.cheque_no,
    grossAmount: Number(row.gross_amount) || 0,
    whtAmount: Number(row.wht_amount) || 0,
    netAmount: Number(row.net_amount) || 0,
    narration: row.narration,
  }));
}

export type SimpleVoucherPayload = {
  voucherNo: string;
  voucherType: VoucherType;
  date: string;
  partyId?: string;
  bankAccount?: string;
  chequeNo?: string;
  chequeDate?: string;
  grossAmount: number;
  whtPercent?: number;
  whtAmount?: number;
  netAmount: number;
  narration?: string;
};

export async function saveVoucher(
  payload: SimpleVoucherPayload
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("vouchers").insert({
    voucher_no: payload.voucherNo,
    voucher_type: payload.voucherType,
    voucher_date: payload.date,
    party_id: payload.partyId || null,
    bank_account: payload.bankAccount || null,
    cheque_no: payload.chequeNo || null,
    cheque_date: payload.chequeDate || null,
    gross_amount: payload.grossAmount,
    wht_percent: payload.whtPercent || 0,
    wht_amount: payload.whtAmount || 0,
    net_amount: payload.netAmount,
    narration: payload.narration || null,
  });
  return { error: error?.message ?? null };
}

export type JournalLinePayload = {
  account: string; // chart_of_accounts.code
  debit: number;
  credit: number;
};

export async function saveJournalVoucher(
  header: { voucherNo: string; date: string; narration?: string },
  lines: JournalLinePayload[]
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);

  const { data, error } = await supabase
    .from("vouchers")
    .insert({
      voucher_no: header.voucherNo,
      voucher_type: "journal",
      voucher_date: header.date,
      gross_amount: totalDebit,
      net_amount: totalDebit,
      narration: header.narration || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create journal voucher." };
  }

  const { error: linesError } = await supabase.from("voucher_lines").insert(
    lines.map((l) => ({
      voucher_id: data.id,
      account_code: l.account,
      debit: l.debit,
      credit: l.credit,
    }))
  );

  return { error: linesError?.message ?? null };
}

/* ============================================================
 * Multi-row voucher entry (every voucher type)
 * ------------------------------------------------------------
 * Every voucher — not just Journal — is a header plus one or more
 * voucher_lines rows. A line points at either a Chart of Accounts
 * head ("coa:<code>") or a party ("party:<id>") — see
 * lib/hooks/use-ledger-accounts.ts for that ref format.
 * ============================================================ */

export type VoucherLineDraft = {
  /** "coa:<code>" | "party:<id>" — see use-ledger-accounts.ts */
  ref: string;
  narration: string;
  debit: number;
  credit: number;
};

export type VoucherHeaderDraft = {
  voucherNo: string;
  voucherType: VoucherType | "journal";
  date: string;
  narration?: string;
  chequeNo?: string;
  chequeDate?: string;
};

export type FullVoucher = {
  id: string;
  header: VoucherHeaderDraft;
  lines: (VoucherLineDraft & { id: string })[];
};

function firstPartyId(lines: VoucherLineDraft[]): string | null {
  for (const l of lines) {
    if (l.ref.startsWith("party:")) return l.ref.slice(6);
  }
  return null;
}

function lineToRow(voucherId: string, line: VoucherLineDraft, lineNo: number) {
  const isParty = line.ref.startsWith("party:");
  return {
    voucher_id: voucherId,
    account_code: isParty ? null : line.ref.slice(4),
    party_id: isParty ? line.ref.slice(6) : null,
    line_narration: line.narration || null,
    debit: line.debit,
    credit: line.credit,
    line_no: lineNo,
  };
}

/**
 * Insert a new voucher (header + lines), or — when `existingId` is
 * given — replace an already-saved voucher's header and lines in
 * place (used when editing a voucher reopened via "Open").
 */
export async function saveVoucherWithLines(
  header: VoucherHeaderDraft,
  lines: VoucherLineDraft[],
  existingId?: string
): Promise<{ error: string | null; id?: string }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const total = lines.reduce((s, l) => s + l.debit, 0);
  const headerRow = {
    voucher_no: header.voucherNo,
    voucher_type: header.voucherType,
    voucher_date: header.date,
    party_id: firstPartyId(lines),
    cheque_no: header.chequeNo || null,
    cheque_date: header.chequeDate || null,
    gross_amount: total,
    net_amount: total,
    narration: header.narration || null,
  };

  let voucherId = existingId;

  if (existingId) {
    const { error: updateError } = await supabase
      .from("vouchers")
      .update(headerRow)
      .eq("id", existingId);
    if (updateError) return { error: updateError.message };

    const { error: deleteError } = await supabase
      .from("voucher_lines")
      .delete()
      .eq("voucher_id", existingId);
    if (deleteError) return { error: deleteError.message };
  } else {
    const { data, error: insertError } = await supabase
      .from("vouchers")
      .insert(headerRow)
      .select("id")
      .single();
    if (insertError || !data) {
      return { error: insertError?.message ?? "Could not save voucher." };
    }
    voucherId = data.id;
  }

  if (lines.length) {
    const { error: linesError } = await supabase
      .from("voucher_lines")
      .insert(lines.map((l, i) => lineToRow(voucherId!, l, i + 1)));
    if (linesError) return { error: linesError.message };
  }

  return { error: null, id: voucherId };
}

/** Load a saved voucher's header and lines, for the Open dialog. */
export async function fetchVoucherWithLines(
  id: string
): Promise<FullVoucher | null> {
  if (!supabase) return null;

  const { data: h, error: hErr } = await supabase
    .from("vouchers")
    .select("id, voucher_no, voucher_type, voucher_date, cheque_no, cheque_date, narration")
    .eq("id", id)
    .single();
  if (hErr || !h) return null;

  const { data: rows, error: lErr } = await supabase
    .from("voucher_lines")
    .select("id, account_code, party_id, line_narration, debit, credit, line_no")
    .eq("voucher_id", id)
    .order("line_no", { ascending: true });
  if (lErr) return null;

  return {
    id: h.id,
    header: {
      voucherNo: h.voucher_no,
      voucherType: h.voucher_type,
      date: h.voucher_date,
      narration: h.narration ?? undefined,
      chequeNo: h.cheque_no ?? undefined,
      chequeDate: h.cheque_date ?? undefined,
    },
    lines: (rows ?? []).map((r) => ({
      id: r.id,
      ref: r.party_id ? `party:${r.party_id}` : `coa:${r.account_code}`,
      narration: r.line_narration ?? "",
      debit: Number(r.debit) || 0,
      credit: Number(r.credit) || 0,
    })),
  };
}

/** Delete a voucher and its lines (lines cascade via FK). */
export async function deleteVoucherCascade(
  id: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type VoucherSummary = {
  id: string;
  voucherNo: string;
  date: string;
  narration: string | null;
  amount: number;
};

/** Vouchers of one type, for the "Open" search list — newest first. */
export async function searchVouchersByType(
  voucherType: VoucherType | "journal",
  query?: string
): Promise<VoucherSummary[]> {
  if (!supabase) return [];
  let q = supabase
    .from("vouchers")
    .select("id, voucher_no, voucher_date, narration, net_amount")
    .eq("voucher_type", voucherType)
    .order("voucher_date", { ascending: false })
    .order("voucher_no", { ascending: false })
    .limit(200);

  if (query?.trim()) {
    q = q.or(`voucher_no.ilike.%${query}%,narration.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    voucherNo: r.voucher_no,
    date: r.voucher_date,
    narration: r.narration,
    amount: Number(r.net_amount) || 0,
  }));
}

const demoNumberSequences = new Map<string, number>();

/**
 * The next voucher number for a prefix, callable repeatedly (after
 * Save, Delete, or Close) unlike useDocumentNumber which only reads
 * once on mount. Demo mode counts a session-only sequence, same
 * pattern as useDocumentNumber.
 */
export async function fetchNextVoucherNumber(prefix: string): Promise<string> {
  if (!supabase) {
    const seed = demoNumberSequences.get(prefix) ?? 4000;
    const next = seed + 1;
    demoNumberSequences.set(prefix, next);
    return `${prefix}-${next}`;
  }
  const { data, error } = await supabase
    .from("vouchers")
    .select("voucher_no")
    .like("voucher_no", `${prefix}-%`);

  if (error || !data) {
    const seed = demoNumberSequences.get(prefix) ?? 4000;
    const next = seed + 1;
    demoNumberSequences.set(prefix, next);
    return `${prefix}-${next}`;
  }
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 1000;
  for (const row of data) {
    const m = re.exec(row.voucher_no as string);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${max + 1}`;
}
