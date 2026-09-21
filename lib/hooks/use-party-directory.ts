"use client";

import { useCallback, useEffect, useState } from "react";
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
export function usePartyDirectory(): {
  parties: Party[];
  loading: boolean;
  /** Re-read the list (e.g. after a party was added elsewhere on the page). */
  refresh: () => void;
} {
  const [parties, setParties] = useState<Party[]>(
    isSupabaseConfigured ? [] : mockParties
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    if (!isSupabaseConfigured) setParties([...mockParties]);
    else setTick((t) => t + 1);
  }, []);

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
  }, [tick]);

  return { parties, loading, refresh };
}
