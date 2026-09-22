"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, FolderPlus, Layers, Database, CircleAlert, Users } from "lucide-react";
import { PartiesInformationDialog } from "@/components/parties-information-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  mockAccounts,
  accountTypes,
  emptyAccount,
  nextAccountCode,
  nextPartySubHeadCode,
  defaultPartySubHeadAccounts,
  type Account,
  type AccountType,
} from "@/lib/coa-data";
import {
  mockParties,
  emptyParty,
  nextPartyId,
  partySubHead,
  subHeadFromId,
  type Party,
} from "@/lib/party-data";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAccountsFromSupabase,
  saveAccount,
  deleteAccountByCode,
} from "@/lib/supabase/chart-of-accounts";
import { saveParty } from "@/lib/supabase/parties";

/**
 * ============================================================
 * CHART OF ACCOUNTS
 * ------------------------------------------------------------
 *   Account Type   fixed:  Party, Asset, Liability, Equity, Income, Expense
 *     Sub Head     added here, e.g.  Expense -> Administration,  Party -> Buyer
 *       Head of Account (Account Head)  added under a sub head, e.g.
 *                    Administration -> Stationery Expense,  Buyer -> ABC Traders
 *
 * A Party head of account IS a party: adding one here creates it in
 * Party Master (with its ID inside the sub head's block).
 * ============================================================
 */

type Mode = "view" | "creating" | "editing";
type CreateKind = "subhead" | "account";

type Row =
  | { kind: "type"; type: AccountType; label: string }
  | { kind: "empty"; type: AccountType }
  | { kind: "item"; account: Account; depth: 1 | 2; childCount?: number };

const byCode = (a: Account, b: Account) => a.code.localeCompare(b.code);

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(
    isSupabaseConfigured ? [] : mockAccounts
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [createKind, setCreateKind] = useState<CreateKind>("account");
  const [draft, setDraft] = useState<Account>(emptyAccount(nextAccountCode("asset", [])));

  const [typeFilter, setTypeFilter] = useState<AccountType | "ALL">("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [nameSearch, setNameSearch] = useState("");

  const { parties, loading: partiesLoading, refresh: refreshParties } = usePartyDirectory();
  const [partiesPopupOpen, setPartiesPopupOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);
    fetchAccountsFromSupabase()
      .then((rows) => !cancelled && setAccounts(rows))
      .catch((e) => setErrorMsg(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /* --------- everything the tree is built from --------- */

  // Real accounts + sub heads, the Party sub heads (shown from defaults until
  // the database has its own), and every party as a head of account.
  const all = useMemo<Account[]>(() => {
    const hasPartySubHeads = accounts.some((a) => a.accountType === "party" && a.isGroup);
    const virtual = hasPartySubHeads
      ? []
      : defaultPartySubHeadAccounts.map((a) => ({ ...a, readOnly: true }));
    const partyRows: Account[] = parties.map((p: Party) => ({
      id: `party:${p.id}`,
      code: p.id,
      name: p.name,
      accountType: "party",
      parentCode: partySubHead(p),
      isActive: true,
      isGroup: false,
      readOnly: true,
    }));
    return [...accounts, ...virtual, ...partyRows];
  }, [accounts, parties]);

  /** Sub heads a head of account of this type can sit under. */
  const subHeadsOf = (type: AccountType) =>
    all.filter((a) => a.accountType === type && a.isGroup && a.isActive).sort(byCode);

  const rows = useMemo<Row[]>(() => {
    const q = nameSearch.trim().toLowerCase();
    const matches = (a: Account) =>
      !q || a.name.toLowerCase().includes(q) || a.code.includes(q);
    const out: Row[] = [];

    for (const t of accountTypes) {
      if (typeFilter !== "ALL" && typeFilter !== t.value) continue;
      const list = all.filter(
        (a) => a.accountType === t.value && (showInactive || a.isActive)
      );
      const subs = list.filter((a) => a.isGroup).sort(byCode);
      const kidsOf = (code: string) =>
        list.filter((a) => !a.isGroup && a.parentCode === code).sort(byCode);
      const loose = list
        .filter((a) => !a.isGroup && !subs.some((s) => s.code === a.parentCode))
        .sort(byCode);

      const block: Row[] = [];
      for (const s of subs) {
        const kids = kidsOf(s.code);
        const shown = q ? kids.filter(matches) : kids;
        if (q && !matches(s) && shown.length === 0) continue;
        block.push({ kind: "item", account: s, depth: 1, childCount: kids.length });
        shown.forEach((k) => block.push({ kind: "item", account: k, depth: 2 }));
      }
      loose
        .filter(matches)
        .forEach((a) => block.push({ kind: "item", account: a, depth: 1 }));

      // Every account type is always listed; while searching, only those with matches.
      if (block.length || !q) {
        out.push({ kind: "type", type: t.value, label: t.label });
        if (block.length) out.push(...block);
        else out.push({ kind: "empty", type: t.value });
      }
    }
    return out;
  }, [all, typeFilter, showInactive, nameSearch]);

  const itemCount = rows.filter((r) => r.kind === "item").length;

  /* --------- form state helpers --------- */

  const fieldsDisabled = mode === "view";
  const isNew = mode === "creating";
  const isParty = draft.accountType === "party" && !draft.isGroup;
  const subHeadOptions = subHeadsOf(draft.accountType);

  function select(a: Account) {
    setSelectedId(a.id);
    setDraft(a);
    setMode("view");
    setErrorMsg(null);
  }

  /** Default sub head + next free code for a new entry of this type. */
  function defaultsFor(type: AccountType, kind: CreateKind) {
    if (kind === "subhead") {
      return {
        parentCode: "",
        code: type === "party" ? nextPartySubHeadCode(all) : nextAccountCode(type, accounts),
      };
    }
    const first = subHeadsOf(type)[0]?.code ?? "";
    if (type === "party") {
      return { parentCode: first, code: nextPartyId(parties, first || undefined) };
    }
    return { parentCode: "", code: nextAccountCode(type, accounts) };
  }

  function startCreate(kind: CreateKind) {
    // Start from the type currently being browsed, else the first one (Party).
    const type = typeFilter !== "ALL" ? typeFilter : accountTypes[0].value;
    const d = defaultsFor(type, kind);
    setCreateKind(kind);
    setSelectedId(null);
    setErrorMsg(null);
    setDraft({
      ...emptyAccount(d.code),
      accountType: type,
      parentCode: d.parentCode,
      isGroup: kind === "subhead",
    });
    setMode("creating");
  }

  function update<K extends keyof Account>(key: K, value: Account[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleTypeChange(type: AccountType) {
    const d = defaultsFor(type, createKind);
    setDraft((cur) => ({ ...cur, accountType: type, parentCode: d.parentCode, code: d.code, id: d.code }));
  }

  function handleSubHeadChange(code: string) {
    setDraft((cur) => {
      // A party's ID follows its sub head (Buyer 621…, Seller 631…).
      if (isNew && cur.accountType === "party" && !cur.isGroup) {
        const id = nextPartyId(parties, code || undefined);
        return { ...cur, parentCode: code, code: id, id };
      }
      return { ...cur, parentCode: code };
    });
  }

  function handleEdit() {
    if (!selectedId || draft.readOnly) return;
    setMode("editing");
  }

  async function handleRemove() {
    if (!selectedId || draft.readOnly) return;
    if (draft.isGroup && all.some((a) => a.parentCode === draft.code && a.id !== draft.id)) {
      window.alert("This sub head still has accounts under it. Move or remove those first.");
      return;
    }
    if (!window.confirm(`Remove ${draft.isGroup ? "sub head" : "account"} ${draft.name || draft.code}?`)) return;

    if (isSupabaseConfigured) {
      const { error } = await deleteAccountByCode(selectedId);
      if (error) {
        setErrorMsg(error);
        return;
      }
    }
    setAccounts((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
    setDraft(emptyAccount(nextAccountCode("asset", accounts)));
    setMode("view");
  }

  async function handleSave() {
    setErrorMsg(null);
    if (!draft.name.trim()) {
      window.alert(`${draft.isGroup ? "Sub head" : isParty ? "Party" : "Account"} name is required before saving.`);
      return;
    }
    if (!draft.code.trim()) {
      window.alert("A code is required before saving.");
      return;
    }

    // ---- a new Party head of account = a new party in Party Master ----
    if (isNew && isParty) {
      if (!draft.parentCode) {
        window.alert("Choose the sub head (Buyer, Seller, …) this party belongs under.");
        return;
      }
      if (parties.some((p) => p.id === draft.code)) {
        window.alert(`Party ID ${draft.code} already exists.`);
        return;
      }
      const party: Party = {
        ...emptyParty(draft.code),
        name: draft.name.trim(),
        englishBusinessName: draft.name.trim(),
        // Stored only when it differs from what the ID block already says.
        subHeadCode: draft.parentCode !== subHeadFromId(draft.code) ? draft.parentCode : undefined,
      };
      if (isSupabaseConfigured) {
        const { error } = await saveParty(party);
        if (error) {
          setErrorMsg(error);
          return;
        }
      } else {
        mockParties.push(party);
      }
      refreshParties();
      setSelectedId(`party:${party.id}`);
      setDraft({
        id: `party:${party.id}`,
        code: party.id,
        name: party.name,
        accountType: "party",
        parentCode: draft.parentCode,
        isActive: true,
        isGroup: false,
        readOnly: true,
      });
      setMode("view");
      return;
    }

    // ---- sub heads and ordinary heads of account ----
    if (isNew && all.some((a) => a.code === draft.code)) {
      window.alert(`Code ${draft.code} already exists.`);
      return;
    }
    if (!isNew && all.some((a) => a.code === draft.code && a.id !== selectedId)) {
      window.alert(`Code ${draft.code} is already used by another account.`);
      return;
    }

    if (isSupabaseConfigured) {
      const { error } = await saveAccount(draft);
      if (error) {
        setErrorMsg(error);
        return;
      }
    }

    const saved = { ...draft, id: draft.code };
    setAccounts((prev) =>
      isNew ? [...prev, saved] : prev.map((a) => (a.id === selectedId ? saved : a))
    );
    setSelectedId(saved.id);
    setDraft(saved);
    setMode("view");
  }

  function handleClose() {
    const original = all.find((a) => a.id === selectedId);
    setDraft(original ?? emptyAccount(nextAccountCode("asset", accounts)));
    setMode("view");
    setErrorMsg(null);
  }

  const kindLabel = draft.isGroup ? "Sub Head" : isParty ? "Party" : "Account Head";
  const formTitle =
    mode === "creating"
      ? createKind === "subhead"
        ? "New sub head"
        : "New head of account"
      : mode === "editing"
      ? "Editing"
      : "";

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Chart of Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Account Type &rarr; Sub Head &rarr; Head of Account. Add a sub head
            under a type, then add heads of account under that sub head.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="secondary" onClick={() => setPartiesPopupOpen(true)}>
            <Users size={16} />
            Parties Popup
          </Button>
          <Button variant="secondary" onClick={() => startCreate("subhead")}>
            <Layers size={16} />
            Add Sub Head
          </Button>
          <Button onClick={() => startCreate("account")}>
            <FolderPlus size={16} />
            Add Account Head
          </Button>
        </div>
      </div>

      {partiesPopupOpen && (
        <PartiesInformationDialog
          parties={parties}
          loading={partiesLoading}
          onClose={() => setPartiesPopupOpen(false)}
          onChanged={refreshParties}
        />
      )}

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
              onChange={(e) => setTypeFilter(e.target.value as AccountType | "ALL")}
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
                placeholder="Type a name or code..."
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

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Tree: Type -> Sub Head -> Head of Account */}
        <div className="order-2 lg:order-1 rounded-xl border border-slate-200 bg-white shadow-card flex flex-col max-h-[560px]">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Accounts ({itemCount})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {loading && <p className="p-4 text-sm text-slate-400">Loading accounts…</p>}
            {!loading && itemCount === 0 && nameSearch.trim() && (
              <p className="p-4 text-sm text-slate-400">No accounts found.</p>
            )}
            {rows.map((r) => {
              if (r.kind === "empty") {
                return (
                  <p key={`empty-${r.type}`} className="px-4 py-2.5 text-xs text-slate-400 border-b border-slate-100">
                    Nothing here yet — use Add Sub Head.
                  </p>
                );
              }
              if (r.kind === "type") {
                return (
                  <p
                    key={`type-${r.type}`}
                    className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100/80 border-y border-slate-200 first:border-t-0"
                  >
                    {r.label}
                  </p>
                );
              }
              const a = r.account;
              const isSub = !!a.isGroup;
              return (
                <button
                  key={a.id}
                  onClick={() => select(a)}
                  className={cn(
                    "w-full text-left py-2.5 pr-4 hover:bg-slate-50 transition-colors border-b border-slate-100",
                    r.depth === 1 ? "pl-4" : "pl-9",
                    selectedId === a.id && mode === "view" ? "bg-brand-50" : ""
                  )}
                >
                  <p
                    className={cn(
                      "text-sm text-slate-900 truncate flex items-center gap-2",
                      isSub ? "font-semibold" : "font-medium"
                    )}
                  >
                    {a.name}
                    {isSub && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-700 bg-brand-50 rounded px-1.5 py-0.5">
                        Sub Head · {r.childCount ?? 0}
                      </span>
                    )}
                    {!a.isActive && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{a.code}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Details form */}
        <div className="order-1 lg:order-2 rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {kindLabel} Details
              {formTitle && (
                <span className="ml-2 text-brand-600 normal-case font-medium">({formTitle})</span>
              )}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="account-type">Account Type</Label>
                <Select
                  id="account-type"
                  value={draft.accountType}
                  disabled={!isNew}
                  onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                >
                  {accountTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>

              {!draft.isGroup ? (
                <div>
                  <Label htmlFor="sub-head">Sub Head</Label>
                  <Select
                    id="sub-head"
                    value={draft.parentCode}
                    disabled={fieldsDisabled || !!draft.readOnly}
                    onChange={(e) => handleSubHeadChange(e.target.value)}
                  >
                    {draft.accountType !== "party" && (
                      <option value="">--- No sub head ---</option>
                    )}
                    {draft.accountType === "party" && !draft.parentCode && (
                      <option value="">--- Choose a sub head ---</option>
                    )}
                    {draft.parentCode &&
                      !subHeadOptions.some((s) => s.code === draft.parentCode) && (
                        <option value={draft.parentCode}>{draft.parentCode} (current)</option>
                      )}
                    {subHeadOptions.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="hidden md:block" />
              )}

              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={draft.isActive}
                    disabled={fieldsDisabled || !!draft.readOnly}
                    onChange={(e) => update("isActive", e.target.checked)}
                  />
                  Active
                </label>
              </div>

              <div>
                <Label htmlFor="account-code">
                  {draft.isGroup ? "Sub Head Code" : isParty ? "Party ID" : "Account Code"}
                </Label>
                <Input
                  id="account-code"
                  value={draft.code}
                  disabled={fieldsDisabled || !isNew || isParty}
                  onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value, id: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-1 md:col-span-2">
                <Label htmlFor="account-name">
                  {draft.isGroup ? "Sub Head Name" : isParty ? "Party Name" : "Head of Account"}
                </Label>
                <Input
                  id="account-name"
                  value={draft.name}
                  disabled={fieldsDisabled || !!draft.readOnly}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder={
                    draft.isGroup
                      ? draft.accountType === "party"
                        ? "e.g. Buyer"
                        : "e.g. Administration"
                      : isParty
                      ? "e.g. ABC Traders"
                      : "e.g. Stationery Expense"
                  }
                />
              </div>
            </div>

            {draft.readOnly && (
              <p className="text-xs rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                {draft.isGroup
                  ? "This is one of the standard party sub heads. Run migration_15 (see README) to add your own sub heads and rename these."
                  : "This party is managed in Party Master — change its details there."}{" "}
                {!draft.isGroup && (
                  <Link href="/sales/customers" className="font-medium text-brand-700 hover:underline">
                    Open Party Master →
                  </Link>
                )}
              </p>
            )}

            <p className="text-xs text-slate-400">
              Codes starting with 1 = Asset, 2 = Liability, 3 = Equity,
              4 = Income, 5 = Expense, 6 = Party (6200000 Buyer, 6300000 Seller,
              6400000 Misc Parties) — matching the numbering already used across
              your vouchers and party master.
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleEdit}
              disabled={mode !== "view" || !selectedId || !!draft.readOnly}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={handleRemove}
              disabled={mode !== "view" || !selectedId || !!draft.readOnly}
            >
              Remove
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={handleClose} disabled={mode === "view"}>
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
