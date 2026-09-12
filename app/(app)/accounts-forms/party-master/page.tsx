"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRoundPlus, Database, CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  mockParties,
  towns,
  sectors,
  partyGroups,
  emptyParty,
  nextPartyId,
  type Party,
} from "@/lib/party-data";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchPartiesFromSupabase,
  saveParty,
  deletePartyById,
} from "@/lib/supabase/parties";

type Mode = "view" | "creating" | "editing";

export default function PartyMasterPage() {
  const [parties, setParties] = useState<Party[]>(
    isSupabaseConfigured ? [] : mockParties
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    isSupabaseConfigured ? null : mockParties[0]?.id ?? null
  );
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<Party>(
    isSupabaseConfigured
      ? emptyParty(nextPartyId([]))
      : mockParties[0] ?? emptyParty(nextPartyId([]))
  );
  const [viewAsVendor, setViewAsVendor] = useState(false);

  const [townFilter, setTownFilter] = useState("--- ALL TOWNS ---");
  const [sectorFilter, setSectorFilter] = useState("--- ALL SECTORS ---");
  const [nameSearch, setNameSearch] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);
    fetchPartiesFromSupabase()
      .then((rows) => {
        if (cancelled) return;
        setParties(rows);
        setSelectedId(rows[0]?.id ?? null);
        setDraft(rows[0] ?? emptyParty(nextPartyId(rows)));
      })
      .catch((e) => setErrorMsg(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchTown =
        townFilter === "--- ALL TOWNS ---" || p.town === townFilter;
      const matchSector =
        sectorFilter === "--- ALL SECTORS ---" || p.sector === sectorFilter;
      const matchName = p.name
        .toLowerCase()
        .includes(nameSearch.trim().toLowerCase());
      return matchTown && matchSector && matchName;
    });
  }, [parties, townFilter, sectorFilter, nameSearch]);

  const fieldsDisabled = mode === "view";

  function selectParty(p: Party) {
    setSelectedId(p.id);
    setDraft(p);
    setMode("view");
    setViewAsVendor(false);
  }

  function handleNew() {
    const draftNew = emptyParty(nextPartyId(parties));
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
    if (!window.confirm(`Remove party ${draft.name || draft.id}?`)) return;

    if (isSupabaseConfigured) {
      const { error } = await deletePartyById(selectedId);
      if (error) {
        setErrorMsg(error);
        return;
      }
    }

    const remaining = parties.filter((p) => p.id !== selectedId);
    setParties(remaining);
    const next = remaining[0] ?? null;
    setSelectedId(next?.id ?? null);
    setDraft(next ?? emptyParty(nextPartyId(remaining)));
    setMode("view");
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      window.alert("Name is required before saving.");
      return;
    }

    if (isSupabaseConfigured) {
      const { error } = await saveParty(draft);
      if (error) {
        setErrorMsg(error);
        return;
      }
    }

    if (mode === "creating") {
      setParties((prev) => [...prev, draft]);
    } else {
      setParties((prev) =>
        prev.map((p) => (p.id === draft.id ? draft : p))
      );
    }
    setSelectedId(draft.id);
    setMode("view");
  }

  function handleSwitch() {
    if (!draft.canAlsoBeVendor) return;
    setViewAsVendor((v) => !v);
  }

  function handleClose() {
    const original = parties.find((p) => p.id === selectedId);
    setDraft(original ?? emptyParty(nextPartyId(parties)));
    setMode("view");
    setViewAsVendor(false);
  }

  function update<K extends keyof Party>(key: K, value: Party[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Customers / Party Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chart of Accounts: Current Assets &rarr; Accounts Receivable /
            Sundry Debtors (prefix 62)
          </p>
        </div>
        <Button onClick={handleNew} className="shrink-0">
          <UserRoundPlus size={16} />
          New Party
        </Button>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2",
          isSupabaseConfigured
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        )}
      >
        <Database size={14} />
        {isSupabaseConfigured
          ? "Connected to Supabase — changes are saved to your database."
          : "Demo mode — data is in-memory only. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to persist data (see README)."}
      </div>

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
            <Label htmlFor="town-filter">Town Name</Label>
            <Select
              id="town-filter"
              value={townFilter}
              onChange={(e) => setTownFilter(e.target.value)}
            >
              <option>--- ALL TOWNS ---</option>
              {towns.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sector-filter">Sector Name</Label>
            <Select
              id="sector-filter"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
            >
              <option>--- ALL SECTORS ---</option>
              {sectors.map((s) => (
                <option key={s}>{s}</option>
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
                placeholder="Type a party name..."
                className="pl-9"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Existing parties list */}
        <div className="order-2 lg:order-1 rounded-xl border border-slate-200 bg-white shadow-card flex flex-col max-h-[520px]">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Existing Parties ({filteredParties.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-slate-100">
            {loading && (
              <p className="p-4 text-sm text-slate-400">Loading parties…</p>
            )}
            {!loading && filteredParties.length === 0 && (
              <p className="p-4 text-sm text-slate-400">No parties found.</p>
            )}
            {filteredParties.map((p) => (
              <button
                key={p.id}
                onClick={() => selectParty(p)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors",
                  selectedId === p.id && mode === "view"
                    ? "bg-brand-50"
                    : ""
                )}
              >
                <p className="text-sm font-medium text-slate-900 truncate">
                  {p.name}
                </p>
                <p className="text-xs text-slate-500">{p.id}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Party profile form */}
        <div className="order-1 lg:order-2 rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Party Profile
              {mode !== "view" && (
                <span className="ml-2 text-brand-600 normal-case font-medium">
                  ({mode === "creating" ? "New entry" : "Editing"})
                </span>
              )}
            </p>
            {draft.canAlsoBeVendor && (
              <span className="text-xs font-medium text-slate-500">
                Viewing as:{" "}
                <span className="text-brand-700">
                  {viewAsVendor ? "Vendor" : "Customer"}
                </span>
              </span>
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="party-id">Party ID</Label>
                <Input id="party-id" value={draft.id} disabled />
              </div>
              <div>
                <Label htmlFor="party-group">Party Group</Label>
                <Select
                  id="party-group"
                  value={draft.group}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("group", e.target.value)}
                >
                  {partyGroups.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={draft.canAlsoBeVendor}
                    disabled={fieldsDisabled}
                    onChange={(e) =>
                      update("canAlsoBeVendor", e.target.checked)
                    }
                  />
                  Can also be a vendor
                </label>
              </div>

              <div>
                <Label htmlFor="name-urdu">Name in Urdu</Label>
                <Input
                  id="name-urdu"
                  dir="rtl"
                  value={draft.nameUrdu}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("nameUrdu", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={draft.name}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <Label htmlFor="business-name">English Business Name</Label>
                <Input
                  id="business-name"
                  value={draft.englishBusinessName}
                  disabled={fieldsDisabled}
                  onChange={(e) =>
                    update("englishBusinessName", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="town">Town</Label>
                <Select
                  id="town"
                  value={draft.town}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("town", e.target.value)}
                >
                  {towns.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Select
                  id="sector"
                  value={draft.sector}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("sector", e.target.value)}
                >
                  {sectors.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={draft.city}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={draft.address}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={draft.mobile}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("mobile", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={draft.phone}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fax">Fax</Label>
                <Input
                  id="fax"
                  value={draft.fax}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("fax", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={draft.email}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contact-person">Contact Person</Label>
                <Input
                  id="contact-person"
                  value={draft.contactPerson}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("contactPerson", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="stn">STN #</Label>
                <Input
                  id="stn"
                  value={draft.stn}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("stn", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ntn-cnic">NTN / CNIC #</Label>
                <Input
                  id="ntn-cnic"
                  value={draft.ntnCnic}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("ntnCnic", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bank-account">Bank Account #</Label>
                <Input
                  id="bank-account"
                  value={draft.bankAccount}
                  disabled={fieldsDisabled}
                  onChange={(e) => update("bankAccount", e.target.value)}
                />
              </div>
            </div>
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
            <Button
              variant="secondary"
              onClick={handleSwitch}
              disabled={mode !== "view" || !draft.canAlsoBeVendor}
            >
              Switch
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
