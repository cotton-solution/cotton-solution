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
  | "contra_bank_to_cash";

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
