"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { mockParties } from "@/lib/party-data";
import { cropNames } from "@/lib/crops";

export function WeighmentForm({
  title,
  slipPrefix,
  partyLabel,
}: {
  title: string;
  slipPrefix: string;
  partyLabel: "Vendor" | "Customer";
}) {
  const [slipNo] = useState(
    `${slipPrefix}-${Math.floor(1000 + Math.random() * 8999)}`
  );
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleNo, setVehicleNo] = useState("");
  const [partyId, setPartyId] = useState(mockParties[0]?.id ?? "");
  const [crop, setCrop] = useState(cropNames[0]);
  const [bags, setBags] = useState<number>(0);
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  const netWeight = Math.max(grossWeight - tareWeight, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Slip #{" "}
            <span className="font-medium text-slate-700">{slipNo}</span>
          </p>
        </div>
        {saved && (
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full">
            Saved
          </span>
        )}
      </div>

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
              onChange={(e) => {
                setPartyId(e.target.value);
                setSaved(false);
              }}
            >
              {mockParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </Select>
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
        <Button onClick={() => setSaved(true)}>Save Slip</Button>
      </div>
    </div>
  );
}
