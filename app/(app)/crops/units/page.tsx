"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { defaultCropUnits, type CropUnit } from "@/lib/crops";

export default function CropUnitsPage() {
  const [units, setUnits] = useState<CropUnit[]>(defaultCropUnits);
  const [crop, setCrop] = useState("");
  const [unitName, setUnitName] = useState("Maund");
  const [kgsPerUnit, setKgsPerUnit] = useState<number>(40);

  function addUnit() {
    if (!crop.trim() || !kgsPerUnit) return;
    setUnits((prev) => [...prev, { crop: crop.trim(), unitName, kgsPerUnit }]);
    setCrop("");
    setUnitName("Maund");
    setKgsPerUnit(40);
  }

  function removeUnit(index: number) {
    setUnits((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Crop Units</h1>
        <p className="text-sm text-slate-500 mt-1">
          Standard weight-conversion units used across contracts, weighment
          and invoices.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Crop
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Unit Name
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">
                KGS per Unit
              </th>
              <th className="px-2 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {units.map((u, i) => (
              <tr key={`${u.crop}-${i}`}>
                <td className="px-4 py-3 text-slate-900 font-medium">
                  {u.crop}
                </td>
                <td className="px-4 py-3 text-slate-700">{u.unitName}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {u.kgsPerUnit}
                </td>
                <td className="px-2 py-3 text-center">
                  <button
                    onClick={() => removeUnit(i)}
                    aria-label="Remove unit"
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Add New Unit
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="crop-name">Crop Name</Label>
            <Input
              id="crop-name"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="e.g. Maize"
            />
          </div>
          <div>
            <Label htmlFor="unit-name">Unit Name</Label>
            <Input
              id="unit-name"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="kgs-per-unit">KGS per Unit</Label>
            <Input
              id="kgs-per-unit"
              type="number"
              min={0}
              step={0.001}
              value={kgsPerUnit || ""}
              onChange={(e) => setKgsPerUnit(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={addUnit}>
            <Plus size={16} />
            Add Unit
          </Button>
        </div>
      </div>
    </div>
  );
}
