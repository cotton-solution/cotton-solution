"use client";

import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { usePartyDirectory } from "@/lib/hooks/use-party-directory";
import { useDocumentNumber } from "@/lib/hooks/use-document-number";
import { cropNames, defaultCropUnits } from "@/lib/crops";
import { saveContract } from "@/lib/supabase/contracts";

export function ContractForm({
  title,
  invoicePrefix,
  contractType,
  partyLabel,
}: {
  title: string;
  invoicePrefix: string;
  contractType: "purchase" | "sale";
  partyLabel: "Vendor" | "Customer";
}) {
  const { number: contractNo, ready: numberReady } = useDocumentNumber(
    invoicePrefix,
    "contracts",
    "contract_no"
  );
  const { parties, loading: partiesLoading } = usePartyDirectory();
  const [contractDate, setContractDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [deliveryDate, setDeliveryDate] = useState("");
  const [partyId, setPartyId] = useState("");

  useEffect(() => {
    if (!partyId && parties.length > 0) setPartyId(parties[0].id);
  }, [parties, partyId]);
  const [crop, setCrop] = useState(cropNames[0]);
  const [unit, setUnit] = useState(defaultCropUnits[0].unitName);
  const [quantity, setQuantity] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [advance, setAdvance] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const contractValue = quantity * rate;
  const balance = contractValue - advance;

  async function handleSave() {
    if (!partyId) {
      setError(`Add a ${partyLabel.toLowerCase()} in Party Master first.`);
      return;
    }
    setError(null);
    setSaving(true);
    const { error } = await saveContract({
      contractNo,
      contractType,
      contractDate,
      deliveryDate: deliveryDate || undefined,
      partyId,
      crop,
      unit,
      quantity,
      rate,
      advance,
      notes,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Contract #{" "}
            <span className="font-medium text-slate-700">
              {numberReady ? contractNo : "Assigning…"}
            </span>
          </p>
        </div>
        {saved && (
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
            Saved
          </span>
        )}
      </div>

      <DataModeBanner />

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
          <CircleAlert size={14} />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contract-date">Contract Date</Label>
            <Input
              id="contract-date"
              type="date"
              value={contractDate}
              onChange={(e) => {
                setContractDate(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div>
            <Label htmlFor="delivery-date">Delivery Date</Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => {
                setDeliveryDate(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="contract-party">{partyLabel}</Label>
            <Select
              id="contract-party"
              value={partyId}
              disabled={partiesLoading || parties.length === 0}
              onChange={(e) => {
                setPartyId(e.target.value);
                setSaved(false);
              }}
            >
              {parties.length === 0 && (
                <option value="">
                  {partiesLoading ? "Loading parties…" : "No parties yet"}
                </option>
              )}
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </Select>
            {!partiesLoading && parties.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                No {partyLabel.toLowerCase()}s yet — add one in Party Master.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="crop">Crop</Label>
            <Select
              id="crop"
              value={crop}
              onChange={(e) => {
                setCrop(e.target.value);
                setSaved(false);
              }}
            >
              {cropNames.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select
              id="unit"
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                setSaved(false);
              }}
            >
              {defaultCropUnits.map((u) => (
                <option key={u.unitName}>{u.unitName}</option>
              ))}
              <option>Bags</option>
              <option>Bales</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={quantity || ""}
              onChange={(e) => {
                setQuantity(parseFloat(e.target.value) || 0);
                setSaved(false);
              }}
            />
          </div>
          <div>
            <Label htmlFor="rate">Rate (per unit)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              value={rate || ""}
              onChange={(e) => {
                setRate(parseFloat(e.target.value) || 0);
                setSaved(false);
              }}
            />
          </div>

          <div>
            <Label htmlFor="advance">Advance Paid</Label>
            <Input
              id="advance"
              type="number"
              min={0}
              value={advance || ""}
              onChange={(e) => {
                setAdvance(parseFloat(e.target.value) || 0);
                setSaved(false);
              }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-8 text-sm">
          <div className="flex justify-between sm:block">
            <span className="text-slate-500">Contract Value</span>
            <p className="font-semibold text-slate-900 tabular-nums sm:mt-1">
              {contractValue.toLocaleString("en-PK")}
            </p>
          </div>
          <div className="flex justify-between sm:block">
            <span className="text-slate-500">Balance Due</span>
            <p className="font-semibold text-slate-900 tabular-nums sm:mt-1">
              {balance.toLocaleString("en-PK")}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="contract-notes">Notes</Label>
          <Input
            id="contract-notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
            }}
            placeholder="Terms, quality specs, or other remarks"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button onClick={handleSave} disabled={saving || !partyId}>
          {saving ? "Saving…" : "Save Contract"}
        </Button>
      </div>
    </div>
  );
}
