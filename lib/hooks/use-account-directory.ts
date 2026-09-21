"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchAccountsFromSupabase } from "@/lib/supabase/chart-of-accounts";
import { journalAccounts, type JournalAccount } from "@/lib/chart-of-accounts";

/**
 * Same problem as party directory, on the Chart of Accounts side: the
 * Journal Voucher form posted against a hardcoded 10-row list instead
 * of the accounts actually created on the (live) Chart of Accounts
 * screen, so a new account was invisible to every journal entry.
 */
export function useAccountDirectory(): {
  accounts: JournalAccount[];
  loading: boolean;
} {
  const [accounts, setAccounts] = useState<JournalAccount[]>(
    isSupabaseConfigured ? [] : journalAccounts
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);
    fetchAccountsFromSupabase()
      .then((rows) => {
        if (!cancelled) {
          setAccounts(
            rows
              .filter((a) => a.isActive && !a.isGroup)
              .map((a) => ({ code: a.code, name: a.name }))
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { accounts, loading };
}
