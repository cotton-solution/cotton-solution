"use client";

import { useMemo } from "react";
import { useAccountDirectory } from "@/lib/hooks/use-account-directory";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";
import { accountTypeLabel, type AccountType } from "@/lib/coa-data";

/**
 * One entry a voucher line can post against — either a Chart of
 * Accounts head (an expense, income, asset, liability or equity
 * account) or a party (customer/vendor) ledger. `ref` is the single
 * value stored on the line: "coa:<code>" or "party:<id>".
 */
export type LedgerAccount = {
  ref: string;
  label: string;
  sublabel: string;
  kind: "coa" | "party";
  accountType?: AccountType;
};

export function coaRef(code: string): string {
  return `coa:${code}`;
}
export function partyRef(id: string): string {
  return `party:${id}`;
}
export function parseRef(
  ref: string
): { kind: "coa"; code: string } | { kind: "party"; id: string } | null {
  if (ref.startsWith("coa:")) return { kind: "coa", code: ref.slice(4) };
  if (ref.startsWith("party:")) return { kind: "party", id: ref.slice(6) };
  return null;
}

/**
 * Every account a voucher line can be posted against, merged and
 * ready to search — the "select account" box behaves like a phone's
 * contact search: type a few letters of a party's name, an expense
 * head, or an account code, and every match shows up regardless of
 * where it lives.
 */
export function useLedgerAccounts(): {
  accounts: LedgerAccount[];
  loading: boolean;
} {
  const { accounts: coa, loading: coaLoading } = useAccountDirectory();
  const { parties, loading: partiesLoading } = usePartyDirectory();

  const accounts = useMemo<LedgerAccount[]>(() => {
    const coaRows: LedgerAccount[] = coa.map((a) => ({
      ref: coaRef(a.code),
      label: a.name,
      sublabel: a.code,
      kind: "coa",
    }));
    const partyRows: LedgerAccount[] = parties.map((p) => ({
      ref: partyRef(p.id),
      label: p.name,
      sublabel: p.id,
      kind: "party",
    }));
    // Parties first — they're who most voucher lines are written
    // against day to day; expense/income heads still show right below.
    return [...partyRows, ...coaRows];
  }, [coa, parties]);

  return { accounts, loading: coaLoading || partiesLoading };
}

export { accountTypeLabel };
