"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchAccountsFromSupabase } from "@/lib/supabase/chart-of-accounts";
import { defaultPartySubHeads } from "@/lib/party-data";

/**
 * The Party sub heads (Buyer, Seller, Misc Parties and any the user added in
 * Chart of Accounts) — what Party Master offers in its "Sub Head" box.
 * Falls back to the three defaults until the database has its own.
 */
export function usePartySubHeads(): { subHeads: { code: string; name: string }[] } {
  const [subHeads, setSubHeads] = useState(defaultPartySubHeads);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    fetchAccountsFromSupabase().then((rows) => {
      if (cancelled) return;
      const heads = rows
        .filter((a) => a.accountType === "party" && a.isGroup && a.isActive)
        .map((a) => ({ code: a.code, name: a.name }))
        .sort((a, b) => a.code.localeCompare(b.code));
      if (heads.length) setSubHeads(heads);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { subHeads };
}
