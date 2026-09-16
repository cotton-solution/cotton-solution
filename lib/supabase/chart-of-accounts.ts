import { supabase } from "@/lib/supabase/client";
import type { Account, AccountType } from "@/lib/coa-data";

type AccountRow = {
  code: string;
  name: string;
  account_type: AccountType;
  parent_code: string | null;
  is_active: boolean;
};

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.code,
    code: row.code,
    name: row.name,
    accountType: row.account_type,
    parentCode: row.parent_code ?? "",
    isActive: row.is_active,
  };
}

function accountToRow(account: Account): AccountRow {
  return {
    code: account.code,
    name: account.name,
    account_type: account.accountType,
    parent_code: account.parentCode || null,
    is_active: account.isActive,
  };
}

export async function fetchAccountsFromSupabase(): Promise<Account[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("code, name, account_type, parent_code, is_active")
    .order("code", { ascending: true });

  if (error) {
    console.error("fetchAccountsFromSupabase error:", error.message);
    return [];
  }
  return (data as AccountRow[]).map(rowToAccount);
}

export async function saveAccount(
  account: Account
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("chart_of_accounts")
    .upsert(
      { ...accountToRow(account), updated_at: new Date().toISOString() },
      { onConflict: "business_id,code" }
    );

  return { error: error?.message ?? null };
}

export async function deleteAccountByCode(
  code: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("chart_of_accounts")
    .delete()
    .eq("code", code);

  return { error: error?.message ?? null };
}
