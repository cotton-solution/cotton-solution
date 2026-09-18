"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/**
 * ============================================================
 * DOCUMENT NUMBERING
 * ------------------------------------------------------------
 * Every form used to pick `${prefix}-${random 4 digit number}`,
 * which collides constantly — two people saving a Cash Receiving
 * Voucher in the same minute have a 1-in-9000 chance of landing on
 * the same number, and nothing in the schema stops it.
 *
 * This hook instead reads the highest existing number for that
 * prefix (scoped to the business by RLS, same as every other query
 * here) and counts up from it — the way a paper voucher book works.
 *
 * Demo mode (no Supabase) has nothing to read the max from, and
 * nothing persists between page loads anyway (see README), so it
 * counts up a session-only in-memory sequence per prefix instead of
 * calling Math.random() — numbers issued in one sitting still don't
 * collide, and they look like a real book instead of noise.
 * ============================================================
 */

const demoSequences = new Map<string, number>();

function nextDemoNumber(prefix: string): string {
  const seed = demoSequences.get(prefix) ?? 4000;
  const next = seed + 1;
  demoSequences.set(prefix, next);
  return `${prefix}-${next}`;
}

/** Highest trailing integer found after "PREFIX-" across a column's values. */
function highestSuffix(values: string[], prefix: string): number {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const v of values) {
    const m = re.exec(v);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

export function useDocumentNumber(
  prefix: string,
  table: string,
  column: string
): { number: string; ready: boolean } {
  const [number, setNumber] = useState(() =>
    supabase ? `${prefix}-…` : nextDemoNumber(prefix)
  );
  const [ready, setReady] = useState(() => !supabase);

  useEffect(() => {
    let cancelled = false;
    if (!supabase) return;

    (async () => {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .like(column, `${prefix}-%`);

      if (cancelled) return;
      if (error || !data) {
        // Fall back to a session sequence rather than block the form.
        setNumber(nextDemoNumber(prefix));
        setReady(true);
        return;
      }
      const values = (data as unknown as Record<string, string>[])
        .map((row) => row[column])
        .filter(Boolean);
      const next = highestSuffix(values, prefix) + 1;
      setNumber(`${prefix}-${Math.max(next, 1001)}`);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // Re-run only if the identity of what we're numbering changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, table, column]);

  return { number, ready };
}
