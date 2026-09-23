"use client";

import { useEffect, useState } from "react";
import { Landmark, CircleCheck, CircleAlert } from "lucide-react";
import { Select } from "@/components/ui/select";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAccountDirectory } from "@/lib/hooks/use-account-directory";
import {
  POSTING_KEYS,
  fetchPostingAccounts,
  savePostingAccount,
} from "@/lib/supabase/ledger";

/**
 * Where the automatic ledger posting engine (migration_20) sends
 * every voucher, invoice and expense — Cash, Sales, Purchases,
 * Brokerage Income/Expense, etc. Every business gets sensible
 * defaults on signup; this page is where they're reviewed or
 * repointed at a different Chart of Accounts head.
 */
export default function PostingAccountsPage() {
  const { accounts, loading: accountsLoading } = useAccountDirectory();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchPostingAccounts().then((rows) => {
      setMapping(Object.fromEntries(rows.map((r) => [r.key, r.accountCode])));
      setLoading(false);
    });
  }, []);

  async function handleChange(key: string, accountCode: string) {
    setMapping((m) => ({ ...m, [key]: accountCode }));
    setSavingKey(key);
    setError(null);
    const { error: err } = await savePostingAccount(key, accountCode);
    setSavingKey(null);
    if (err) {
      setError(err);
      return;
    }
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 1500);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <Landmark size={20} className="text-brand-600" />
          Posting Accounts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Every voucher, invoice and expense posts itself to the ledger
          automatically the moment it's saved — this is where each kind
          of posting is pointed at a Chart of Accounts head. Sensible
          defaults are already set; change one only if it doesn't match
          how this business actually keeps its books.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This is demo mode — connect Supabase to configure real posting
          accounts.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card divide-y divide-slate-100">
        {POSTING_KEYS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{label}</p>
              <p className="text-xs text-slate-400 font-mono">{key}</p>
            </div>
            <div className="flex items-center gap-2 w-64 shrink-0">
              <Select
                value={mapping[key] ?? ""}
                disabled={loading || accountsLoading || !isSupabaseConfigured}
                onChange={(e) => handleChange(key, e.target.value)}
              >
                <option value="" disabled>
                  {loading ? "Loading…" : "Select account…"}
                </option>
                {accounts.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </Select>
              {savingKey === key && (
                <span className="text-xs text-slate-400 shrink-0">Saving…</span>
              )}
              {savedKey === key && (
                <CircleCheck size={16} className="text-emerald-600 shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
        <CircleAlert size={14} className="shrink-0 mt-0.5 text-slate-400" />
        <p>
          Category-specific overrides are also supported at the database
          level (e.g. a different Sales account just for Brokerage
          invoices) — ask for that to be added here once you know which
          categories need to split out.
        </p>
      </div>
    </div>
  );
}
