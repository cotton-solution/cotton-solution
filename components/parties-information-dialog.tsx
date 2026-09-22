"use client";

import { useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { PopupWindow, PopupCheck } from "@/components/popup-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveParty, deletePartyById } from "@/lib/supabase/parties";
import { usePartySubHeads } from "@/lib/hooks/use-party-subheads";
import {
  emptyParty,
  nextPartyId,
  accountExtensionOf,
  computeAccountNo,
  partyRankings,
  provinces,
  towns,
  partyGroups,
  type Party,
} from "@/lib/party-data";

/**
 * "Parties Information" popup — Chart of Accounts handled the way the
 * legacy desktop screen does: Parent Account (the party sub head) +
 * A/C Extension compute the Account No live, a full party profile
 * form, and the same Save / Clear / Delete / Switch / Close actions,
 * with the scrollable party list docked on the right (stacks above
 * the form on narrow screens).
 */
export function PartiesInformationDialog({
  parties,
  loading,
  onClose,
  onChanged,
}: {
  parties: Party[];
  loading?: boolean;
  onClose: () => void;
  /** Re-fetch the party list after a save/delete so every open page stays in sync. */
  onChanged: () => void;
}) {
  const { subHeads } = usePartySubHeads();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Party>(() =>
    emptyParty(nextPartyId(parties, subHeads[0]?.code))
  );
  const [extension, setExtension] = useState("10001");
  const [asVendor, setAsVendor] = useState(false);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parentAccount = draft.subHeadCode || subHeads[0]?.code || "";
  const accountNo = computeAccountNo(parentAccount, extension) || draft.id;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.includes(q)
    );
  }, [parties, filter]);

  function set<K extends keyof Party>(key: K, value: Party[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function selectParty(p: Party) {
    setSelectedId(p.id);
    setDraft(p);
    setExtension(accountExtensionOf(p.id, p.subHeadCode || subHeads[0]?.code || "") || p.id);
    setAsVendor(p.canAlsoBeVendor);
    setErrorMsg(null);
  }

  function handleNew() {
    const head = parentAccount || subHeads[0]?.code;
    const id = nextPartyId(parties, head);
    setSelectedId(null);
    setDraft({ ...emptyParty(id), subHeadCode: head });
    setExtension(accountExtensionOf(id, head || "0"));
    setAsVendor(false);
    setErrorMsg(null);
  }

  function handleParentAccountChange(code: string) {
    const id = computeAccountNo(code, extension) || nextPartyId(parties, code);
    setDraft((d) => ({ ...d, subHeadCode: code, id }));
  }

  function handleExtensionChange(ext: string) {
    setExtension(ext);
    const id = computeAccountNo(parentAccount, ext);
    if (id) setDraft((d) => ({ ...d, id }));
  }

  /** Buyer <-> Seller, matching the desktop "Switch" button — flips which
   *  sub head (and therefore Account No block) this party sits under. */
  function handleSwitch() {
    const buyer = subHeads.find((s) => s.name === "Buyer")?.code;
    const seller = subHeads.find((s) => s.name === "Seller")?.code;
    if (!buyer || !seller) return;
    const nextHead = parentAccount === seller ? buyer : seller;
    handleParentAccountChange(nextHead);
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      setErrorMsg("Party Name is required.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    const toSave: Party = { ...draft, canAlsoBeVendor: asVendor };
    if (isSupabaseConfigured) {
      const { error } = await saveParty(toSave);
      if (error) {
        setErrorMsg(error);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    onChanged();
    selectParty(toSave);
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!window.confirm(`Delete party ${draft.name || selectedId}?`)) return;
    if (isSupabaseConfigured) {
      const { error } = await deletePartyById(selectedId);
      if (error) {
        setErrorMsg(error);
        return;
      }
    }
    onChanged();
    handleNew();
  }

  return (
    <PopupWindow
      title="Parties"
      icon={<Users size={15} className="text-slate-500" />}
      maxWidth="max-w-5xl"
      onClose={onClose}
      footer={
        <>
          <PopupCheck label="In Active" checked={!draft.isActive} onChange={(v) => set("isActive", !v)} />
          <div className="flex-1" />
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button variant="secondary" onClick={handleNew}>Clear</Button>
          <Button variant="danger" onClick={handleDelete} disabled={!selectedId}>Delete</Button>
          <Button variant="secondary" onClick={handleSwitch}>Switch</Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </>
      }
    >
      {errorMsg && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* ---- form ---- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Parent Account</label>
              <Select value={parentAccount} onChange={(e) => handleParentAccountChange(e.target.value)}>
                {subHeads.map((s) => (
                  <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">A/C Extension</label>
              <Input value={extension} onChange={(e) => handleExtensionChange(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Account No</label>
              <Input readOnly value={accountNo} className="bg-slate-50 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Manual No</label>
              <Input value={draft.manualNo} onChange={(e) => set("manualNo", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Region</label>
              <Input value={draft.region} onChange={(e) => set("region", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Territory</label>
              <Input value={draft.territory} onChange={(e) => set("territory", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ranking</label>
              <Select value={draft.ranking} onChange={(e) => set("ranking", e.target.value)}>
                <option value="">Select Ranking</option>
                {partyRankings.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Party Name</label>
              <Input autoFocus value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title in Urdu</label>
              <Input dir="rtl" value={draft.nameUrdu} onChange={(e) => set("nameUrdu", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Mobile No</label>
              <Input value={draft.mobile} onChange={(e) => set("mobile", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CNIC No</label>
              <Input value={draft.ntnCnic} onChange={(e) => set("ntnCnic", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Debit Limit</label>
              <Input type="number" value={draft.debitLimit || ""} onChange={(e) => set("debitLimit", Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Credit Limit</label>
              <Input type="number" value={draft.creditLimit || ""} onChange={(e) => set("creditLimit", Number(e.target.value) || 0)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone No</label>
              <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person</label>
              <Input value={draft.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">STN No</label>
              <Input value={draft.stn} onChange={(e) => set("stn", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">H.S Code</label>
              <Input value={draft.hsCode} onChange={(e) => set("hsCode", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">E.F.S Code</label>
              <Input value={draft.efsCode} onChange={(e) => set("efsCode", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Province</label>
              <Select value={draft.province} onChange={(e) => set("province", e.target.value)}>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
              <Input value={draft.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
              <Select value={draft.city || towns[0]} onChange={(e) => set("city", e.target.value)}>
                {towns.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Party Group</label>
            <Select value={draft.group || partyGroups[0]} onChange={(e) => set("group", e.target.value)}>
              {partyGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bank</label>
                <Input value={draft.bankAccount ? draft.beneficiaryName : ""} placeholder="Bank name" readOnly className="bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Beneficiary Name</label>
                <Input value={draft.beneficiaryName} onChange={(e) => set("beneficiaryName", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bank Account #</label>
                <Input value={draft.bankAccount} onChange={(e) => set("bankAccount", e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox checked={asVendor} onChange={(e) => setAsVendor(e.target.checked)} />
              Can also be a vendor
            </label>
          </div>
        </div>

        {/* ---- party list ---- */}
        <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden lg:max-h-[560px]">
          <div className="relative border-b border-slate-200 p-2">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="w-full h-8 rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar max-h-64 lg:max-h-none">
            {loading ? (
              <p className="p-3 text-xs text-slate-400">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="p-3 text-xs text-slate-400">No parties yet.</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectParty(p)}
                  className={cn(
                    "w-full text-left px-3 py-2 border-b border-slate-100 text-xs",
                    selectedId === p.id ? "bg-brand-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="font-mono text-slate-400">{p.id}</div>
                  <div className="text-slate-800 truncate">{p.name}</div>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-slate-200 p-2">
            <Button variant="secondary" className="w-full text-xs h-8" onClick={handleNew}>
              + New Party
            </Button>
          </div>
        </div>
      </div>
    </PopupWindow>
  );
}
