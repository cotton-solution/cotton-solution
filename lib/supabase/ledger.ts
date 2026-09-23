import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export type LedgerEntry = {
  id: string;
  date: string;
  accountCode: string;
  debit: number;
  credit: number;
  referenceType: string;
  referenceId: string;
  narration: string | null;
};

/**
 * Every posted (and reversed-if-voided) entry for one account, straight
 * from `transactions` — the ledger a voucher/invoice/expense actually
 * posted to (migration_20), not a mock. Powers the Account Ledger
 * report and the Parties/Chart-of-Accounts running-balance views.
 */
export async function fetchAccountLedger(
  accountCode: string,
  range?: { from?: string; to?: string }
): Promise<LedgerEntry[]> {
  if (!supabase) return [];
  let query = supabase
    .from("transactions")
    .select("id, transaction_date, account_code, debit, credit, reference_type, reference_id, narration")
    .eq("account_code", accountCode)
    .order("transaction_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (range?.from) query = query.gte("transaction_date", range.from);
  if (range?.to) query = query.lte("transaction_date", range.to);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("fetchAccountLedger error:", error.message);
    return [];
  }
  return data.map((r) => ({
    id: r.id,
    date: r.transaction_date,
    accountCode: r.account_code,
    debit: Number(r.debit) || 0,
    credit: Number(r.credit) || 0,
    referenceType: r.reference_type,
    referenceId: r.reference_id,
    narration: r.narration,
  }));
}

export type TrialBalanceRow = {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  closingBalance: number;
};

/**
 * Every account that has at least one ledger entry, with its net
 * closing balance — the real Trial Balance / Accounts Balances data,
 * computed straight from `transactions` (migration_20). Accounts
 * with a chart_of_accounts row get their proper name; a party's own
 * account code (which doubles as its ledger code) falls back to the
 * party's name.
 */
export async function fetchTrialBalance(range?: {
  from?: string;
  to?: string;
}): Promise<TrialBalanceRow[]> {
  if (!supabase) return [];

  let query = supabase.from("transactions").select("account_code, debit, credit, transaction_date");
  if (range?.from) query = query.gte("transaction_date", range.from);
  if (range?.to) query = query.lte("transaction_date", range.to);

  const [{ data: txRows, error: txErr }, { data: coaRows }, { data: partyRows }] = await Promise.all([
    query,
    supabase.from("chart_of_accounts").select("code, name, account_type"),
    supabase.from("parties_customers").select("party_id, name"),
  ]);

  if (txErr || !txRows) {
    if (txErr) console.error("fetchTrialBalance error:", txErr.message);
    return [];
  }

  const coaByCode = new Map((coaRows ?? []).map((c) => [c.code, c]));
  const partyByCode = new Map((partyRows ?? []).map((p) => [p.party_id, p.name]));

  const totals = new Map<string, { debit: number; credit: number }>();
  for (const row of txRows) {
    const key = row.account_code as string;
    const cur = totals.get(key) ?? { debit: 0, credit: 0 };
    cur.debit += Number(row.debit) || 0;
    cur.credit += Number(row.credit) || 0;
    totals.set(key, cur);
  }

  return Array.from(totals.entries())
    .map(([code, t]) => {
      const coa = coaByCode.get(code);
      return {
        accountCode: code,
        accountName: coa?.name ?? partyByCode.get(code) ?? code,
        accountType: coa?.account_type ?? (partyByCode.has(code) ? "party" : "unknown"),
        debit: t.debit,
        credit: t.credit,
        closingBalance: t.debit - t.credit,
      };
    })
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

export type PostingAccountRow = { key: string; accountCode: string };

const POSTING_KEYS = [
  { key: "cash", label: "Cash payments/receipts" },
  { key: "bank", label: "Bank payments/receipts (fallback)" },
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "brokerage_income", label: "Brokerage Income (on purchases)" },
  { key: "brokerage_expense", label: "Brokerage Expense (on sales)" },
  { key: "default_expense", label: "Default Expense (when no account is chosen)" },
  { key: "wht_payable", label: "Withholding Tax Payable" },
] as const;

export { POSTING_KEYS };

export async function fetchPostingAccounts(): Promise<PostingAccountRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("posting_accounts").select("key, account_code");
  if (error || !data) {
    if (error) console.error("fetchPostingAccounts error:", error.message);
    return [];
  }
  return data.map((r) => ({ key: r.key, accountCode: r.account_code }));
}

export async function savePostingAccount(
  key: string,
  accountCode: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("posting_accounts")
    .upsert({ key, account_code: accountCode }, { onConflict: "business_id,key" });
  if (error && /posting_accounts/i.test(error.message)) {
    return {
      error:
        "The ledger posting engine needs one database update. Run supabase/migration_20_ledger_posting_engine.sql once in the Supabase SQL Editor, then try again.",
    };
  }
  return { error: error?.message ?? null };
}
