import { supabase } from "@/lib/supabase/client";
import type { Account, AccountType } from "@/lib/coa-data";

type AccountRow = {
  code: string;
  name: string;
  account_type: AccountType;
  parent_code: string | null;
  is_active: boolean;
  is_group?: boolean | null;
};

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.code,
    code: row.code,
    name: row.name,
    accountType: row.account_type,
    parentCode: row.parent_code ?? "",
    isActive: row.is_active,
    isGroup: row.is_group ?? false,
  };
}

function accountToRow(account: Account): AccountRow {
  return {
    code: account.code,
    name: account.name,
    account_type: account.accountType,
    parent_code: account.parentCode || null,
    is_active: account.isActive,
    // Only sent for sub heads, so ordinary accounts keep saving even before
    // migration_15 (which adds this column) has been run.
    ...(account.isGroup ? { is_group: true } : {}),
  };
}

export async function fetchAccountsFromSupabase(): Promise<Account[]> {
  if (!supabase) return [];
  const run = (columns: string) =>
    supabase!.from("chart_of_accounts").select(columns).order("code", { ascending: true });

  // `is_group` (sub heads) arrives with migration_15 — load without it until then.
  let { data, error } = await run("code, name, account_type, parent_code, is_active, is_group");
  if (error) ({ data, error } = await run("code, name, account_type, parent_code, is_active"));

  if (error || !data) {
    if (error) console.error("fetchAccountsFromSupabase error:", error.message);
    return [];
  }
  return (data as unknown as AccountRow[]).map(rowToAccount);
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

  if (error && /is_group|account_type_check/i.test(error.message)) {
    return {
      error:
        "Sub heads and Party accounts need one database update. Run supabase/migration_15_coa_sub_heads.sql once in the Supabase SQL Editor, then save again.",
    };
  }
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
