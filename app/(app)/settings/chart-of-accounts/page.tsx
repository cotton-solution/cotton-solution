"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, FolderPlus, Database, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  mockAccounts,
  accountTypes,
  accountTypeLabel,
  emptyAccount,
  nextAccountCode,
  type Account,
  type AccountType,
} from "@/lib/coa-data";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAccountsFromSupabase,
  saveAccount,
  deleteAccountByCode,
} from "@/lib/supabase/chart-of-accounts";

type Mode = "view" | "creating" | "editing";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(
    isSupabaseConfigured ? [] : mockAccounts
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    isSupabaseConfigured ? null : mockAccounts[0]?.id ?? null
  );
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<Account>(
    isSupabaseConfigured
      ? emptyAccount(nextAccountCode("asset", []))
      : mockAccounts[0] ?? emptyAccount(nextAccountCode("asset", []))
  );

  const [typeFilter, setTypeFilter] = useState<AccountType | "ALL">("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [nameSearch, setNameSearch] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);
    fetchAccountsFromSupabase()
      .then((rows) => {
        if (cancelled) return;
        setAccounts(rows);
        setSelectedId(rows[0]?.id ?? null);
        setDraft(rows[0] ?? emptyAccount(nextAccountCode("asset", rows)));
      })
      .catch((e) => setErrorMsg(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchType = typeFilter === "ALL" || a.accountType === typeFilter;
      const matchActive = showInactive || a.isActive;
      const matchName = a.name
        .toLowerCase()
        .includes(nameSearch.trim().toLowerCase());
      return matchType && matchActive && matchName;
    });
  }, [accounts, typeFilter, showInactive, nameSearch]);

  const fieldsDisabled = mode === "view";
  const isNewCode = mode === "creating";

  // Parent must be an existing account of the same type, and can't be
  // the account itself.
  const parentOptions = useMemo(
    () =>
      accounts.filter(
        (a) => a.accountType === draft.accountType && a.code !== draft.code
      ),
    [accounts, draft.accountType]
  );

  function selectAccount(a: Account) {
    setSelectedId(a.id);
    setDraft(a);
    setMode("view");
  }

  function handleNew() {
    const draftNew = emptyAccount(nextAccountCode("asset", accounts));
    setSelectedId(null);
    setDraft(draftNew);
    setMode("creating");
  }

  function handleEdit() {
    if (!selectedId) return;
    setMode("editing");
  }

  async function handleRemove() {
    if (!selectedId) return;
    const hasChildren = accounts.some((a) => a.parentCode === draft.code);
    if (hasChildren) {
      window.alert(
        "This account has sub-accounts under it. Re-parent or remove those first."
      );
      return;
    }
    if (!window.confirm(`Remove account ${draft.name || draft.code}?`)) return;

    if (isSupabaseConfigured) {
      const { error } = await deleteAccountByCode(selectedId);
      if (error) {
        setErrorMsg(error);
        return;
      }
    }

    const remaining = accounts.filter((a) => a.id !== selectedId);
    setAccounts(remaining);
    const next = remaining[0] ?? null;
    setSelectedId(next?.id ?? null);
    setDraft(next ?? emptyAccount(nextAccountCode("asset", remaining)));
    setMode("view");
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      window.alert("Account name is required before saving.");
      return;
    }
    if (!draft.code.trim()) {
      window.alert("Account code is required before saving.");
      return;
    }
    const duplicate = accounts.some(
      (a) => a.code === draft.code && a.id !== selectedId
    );
    if (isNewCode && accounts.some((a) => a.code === draft.code)) {
      window.alert(`Account code ${draft.code} already exists.`);
      return;
    }
    if (duplicate) {
      window.alert(`Account code ${draft.code} is already used by another account.`);
      return;
    }

    if (isSupabaseConfigured) {
      const { error } = await saveAccount(draft);
      if (error) {
        setErrorMsg(error);
        return;
      }
    }

    if (mode === "creating") {
      setAccounts((prev) => [...prev, { ...draft, id: draft.code }]);
    } else {
      setAccounts((prev) =>
        prev.map((a) => (a.id === selectedId ? { ...draft, id: draft.code } : a))
      );
    }
    setSelectedId(draft.code);
    setMode("view");
  }

  function handleClose() {
    const original = accounts.find((a) => a.id === selectedId);
    setDraft(original ?? emptyAccount(nextAccountCode("asset", accounts)));
    setMode("view");
  }

  function update<K extends keyof Account>(key: K, value: Account[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleTypeChange(newType: AccountType) {
    setDraft((d) => ({
      ...d,
      accountType: newType,
      parentCode: "",
      // Only re-suggest the code while creating — editing an existing
      // account should never silently change its code.
      code: isNewCode ? nextAccountCode(newType, accounts) : d.code,
      id: isNewCode ? nextAccountCode(newType, accounts) : d.id,
    }));
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Chart of Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Add, edit, and organize the accounts used across vouchers,
            invoices, and reports.
          </p>
        </div>
        <Button onClick={handleNew} className="shrink-0">
          <FolderPlus size={16} />
          New Account
        </Button>
      </div>

      {/* Demo notice only — nothing about the backend is shown to real customers. */}
      {!isSupabaseConfigured && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-amber-50 text-amber-700">
          <Database size={14} />
          Demo mode — data is in-memory only. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to persist data (see README).
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
          <CircleAlert size={14} />
          {errorMsg}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="type-filter">Account Type</Label>
            <Select
              id="type-filter"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as AccountType | "ALL")
              }
            >
              <option value="ALL">--- ALL TYPES ---</option>
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="name-search">Search by Name</Label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                id="name-search"
                placeholder="Type an account name..."
                className="pl-9"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive accounts
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Existing accounts list */}
        <div className="order-2 lg:order-1 rounded-xl border border-slate-200 bg-white shadow-card flex flex-col max-h-[520px]">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Accounts ({filteredAccounts.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-slate-100">
            {loading && (
              <p className="p-4 text-sm text-slate-400">Loading accounts…</p>
            )}
            {!loading && filteredAccounts.length === 0 && (
              <p className="p-4 text-sm text-slate-400">No accounts found.</p>
            )}
            {filteredAccounts.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAccount(a)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors",
                  selectedId === a.id && mode === "view" ? "bg-brand-50" : ""
                )}
              >
                <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                  {a.name}
                  {!a.isActive && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {a.code} &middot; {accountTypeLabel(a.accountType)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Account form */}
        <div className="order-1 lg:order-2 rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Account Details
              {mode !== "view" && (
                <span className="ml-2 text-brand-600 normal-case font-medium">
                  ({mode === "creating" ? "New entry" : "Editing"})
                </span>
              )}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="account-code">Account Code</Label>
                <Input
                  id="account-code"
                  value={draft.code}
                  disabled={fieldsDisabled || !isNewCode}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      code: e.target.value,
                      id: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="account-type">Account Type</Label>
                <Select
                  id="account-type"
                  value={draft.accountType}
                  disabled={fieldsDisabled}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as AccountType)
                  }
                >
                  {accountTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={draft.isActive}
                    disabled={fieldsDisabled}
                    onChange={(e) => update("isActive", e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <div className="sm:col-span-2 md:col-span-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={draft.name}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="parent-account">Parent Account</Label>
                <Select
                  id="parent-account"
                  value={draft.parentCode}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("parentCode", e.target.value)}
                >
                  <option value="">--- Top level (no parent) ---</option>
                  {parentOptions.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Codes starting with 1 = Asset, 2 = Liability, 3 = Equity,
              4 = Income, 5 = Expense — matching the numbering already used
              across your vouchers and party master.
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleNew}
              disabled={mode !== "view"}
            >
              New
            </Button>
            <Button
              variant="secondary"
              onClick={handleEdit}
              disabled={mode !== "view" || !selectedId}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleRemove}
              disabled={mode !== "view" || !selectedId}
            >
              Remove
            </Button>
            <div className="flex-1" />
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={mode === "view"}
            >
              Close
            </Button>
            <Button onClick={handleSave} disabled={mode === "view"}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
