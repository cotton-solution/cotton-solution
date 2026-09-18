"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchPartiesFromSupabase } from "@/lib/supabase/parties";
import { mockParties, type Party } from "@/lib/party-data";

/**
 * Every form that needs a party dropdown — invoices, contracts,
 * weighment slips, vouchers, multi-invoice batches — used to import
 * `mockParties` directly, so a party added in Party Master (which does
 * read/write Supabase) never showed up anywhere else in the app.
 *
 * This hook is the one place that decides where the party list comes
 * from, so every form stays in sync with Party Master automatically.
 */
export function usePartyDirectory(): { parties: Party[]; loading: boolean } {
  const [parties, setParties] = useState<Party[]>(
    isSupabaseConfigured ? [] : mockParties
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);
    fetchPartiesFromSupabase()
      .then((rows) => {
        if (!cancelled) setParties(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { parties, loading };
}
