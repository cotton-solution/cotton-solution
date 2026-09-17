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
import { cropNames } from "@/lib/crops";
import { saveWeighment } from "@/lib/supabase/weighment";

export function WeighmentForm({
  title,
  slipPrefix,
  slipType,
  partyLabel,
}: {
  title: string;
  slipPrefix: string;
  slipType: "purchase" | "sale";
  partyLabel: "Vendor" | "Customer";
}) {
  const { number: slipNo, ready: numberReady } = useDocumentNumber(
    slipPrefix,
    "weighment_slips",
    "slip_no"
  );
  const { parties, loading: partiesLoading } = usePartyDirectory();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleNo, setVehicleNo] = useState("");
  const [partyId, setPartyId] = useState("");

  useEffect(() => {
    if (!partyId && parties.length > 0) setPartyId(parties[0].id);
  }, [parties, partyId]);
  const [crop, setCrop] = useState(cropNames[0]);
  const [bags, setBags] = useState<number>(0);
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const netWeight = Math.max(grossWeight - tareWeight, 0);

  async function handleSave() {
    if (!partyId) {
      setError(`Add a ${partyLabel.toLowerCase()} in Party Master first.`);
      return;
    }
    setError(null);
    setSaving(true);
    const { error } = await saveWeighment({
      slipNo,
      slipType,
      slipDate: date,
      vehicleNo,
      partyId,
      crop,
      bags,
      grossWeight,
      tareWeight,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Slip #{" "}
            <span className="font-medium text-slate-700">
              {numberReady ? slipNo : "Assigning…"}
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
            <Label htmlFor="w-date">Date</Label>
            <Input
              id="w-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSaved(false);
              }}
            />
          </div>
          <div>
            <Label htmlFor="vehicle-no">Vehicle #</Label>
            <Input
              id="vehicle-no"
              value={vehicleNo}
              placeholder="e.g. LEA-4471"
              onChange={(e) => {
                setVehicleNo(e.target.value);
                setSaved(false);
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="w-party">{partyLabel}</Label>
            <Select
              id="w-party"
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
            <Label htmlFor="w-crop">Crop</Label>
            <Select
              id="w-crop"
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
            <Label htmlFor="bags">Number of Bags</Label>
            <Input
              id="bags"
              type="number"
              min={0}
              value={bags || ""}
              onChange={(e) => {
                setBags(parseFloat(e.target.value) || 0);
                setSaved(false);
              }}
            />
          </div>

          <div>
            <Label htmlFor="gross-weight">Gross Weight (KG)</Label>
            <Input
              id="gross-weight"
              type="number"
              min={0}
              value={grossWeight || ""}
              onChange={(e) => {
                setGrossWeight(parseFloat(e.target.value) || 0);
                setSaved(false);
              }}
            />
          </div>
          <div>
            <Label htmlFor="tare-weight">Tare Weight (KG)</Label>
            <Input
              id="tare-weight"
              type="number"
              min={0}
              value={tareWeight || ""}
              onChange={(e) => {
                setTareWeight(parseFloat(e.target.value) || 0);
                setSaved(false);
              }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex justify-between items-center">
          <span className="text-sm text-slate-500">Net Weight</span>
          <span className="text-lg font-semibold text-slate-900 tabular-nums">
            {netWeight.toLocaleString("en-PK")} KG
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => window.print()}>
          Print Slip
        </Button>
        <Button onClick={handleSave} disabled={saving || !partyId}>
          {saving ? "Saving…" : "Save Slip"}
        </Button>
      </div>
    </div>
  );
}
