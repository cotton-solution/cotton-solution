import { supabase } from "@/lib/supabase/client";

export type OpeningBalanceRow = {
  accountCode: string;
  openingDebit: number;
  openingCredit: number;
};

export async function fetchOpeningBalances(): Promise<OpeningBalanceRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("opening_balances")
    .select("account_code, opening_debit, opening_credit");
  if (error || !data) {
    if (error) console.error("fetchOpeningBalances error:", error.message);
    return [];
  }
  return data.map((r) => ({
    accountCode: r.account_code,
    openingDebit: Number(r.opening_debit) || 0,
    openingCredit: Number(r.opening_credit) || 0,
  }));
}

/**
 * Sets (or replaces, or clears with 0/0) one account's opening
 * balance. Posts a real balanced entry to the ledger against the
 * Opening Balance Equity suspense account (migration_23) — never
 * additive, always the account's single current opening figure.
 */
export async function saveOpeningBalance(
  accountCode: string,
  openingDebit: number,
  openingCredit: number
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.rpc("set_opening_balance", {
    p_account_code: accountCode,
    p_opening_debit: openingDebit || 0,
    p_opening_credit: openingCredit || 0,
  });
  if (error && /function set_opening_balance/i.test(error.message)) {
    return {
      error:
        "Opening Balances needs one database update. Run supabase/migration_23_opening_balances.sql once in the Supabase SQL Editor, then try again.",
    };
  }
  return { error: error?.message ?? null };
}
