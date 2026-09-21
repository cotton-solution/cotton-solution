"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, Weight } from "lucide-react";
import { InvoiceForm, type InvoiceFormProps } from "@/components/invoice-form";
import {
  fetchWeighment,
  markWeighmentMoved,
  type Weighment,
} from "@/lib/supabase/weighments";

/**
 * The bill / invoice form, plus the "Move to Purchase / Sale" hand-off.
 *
 * When the page is opened as  …?weighment=<id>  the weighment's party, date,
 * product and final weight (as KG quantity) are filled in — the user only
 * adds the rate and saves. Saving marks that weighment "moved", so it can't
 * be moved a second time. Without the query string this is just the normal form.
 */
export function InvoiceFormWithWeighment(props: InvoiceFormProps) {
  const weighmentId = useSearchParams().get("weighment");
  const isSale = props.invoiceType === "sale";
  const backHref = isSale ? "/sales/weighment" : "/purchases/weighment";

  const [loading, setLoading] = useState(Boolean(weighmentId));
  const [weighment, setWeighment] = useState<Weighment | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [movedTo, setMovedTo] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    if (!weighmentId) return;
    let cancelled = false;
    setLoading(true);
    fetchWeighment(weighmentId)
      .then((w) => {
        if (cancelled) return;
        if (!w) setProblem("That weighment could not be found.");
        else if (w.kind !== props.invoiceType)
          setProblem("That weighment belongs to the other side (purchase vs sale).");
        else if (w.status === "moved")
          setProblem(
            `${w.weighmentNo} was already moved${w.movedInvoiceNo ? ` to ${w.movedInvoiceNo}` : ""} — it can only be moved once.`
          );
        else if (!w.finalWeight)
          setProblem(`${w.weighmentNo} has no final weight yet — enter it in the Weighment list first.`);
        else setWeighment(w);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [weighmentId, props.invoiceType]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading weighment…</p>;
  }

  const prefill = weighment
    ? {
        partyId: weighment.partyId,
        date: weighment.date,
        notes: `Weighment ${weighment.weighmentNo}${
          weighment.vehicleNo ? ` · Vehicle ${weighment.vehicleNo}` : ""
        }`,
        lines: [
          {
            description: weighment.product,
            unit: "KG",
            qty: weighment.finalWeight,
            rate: 0,
          },
        ],
      }
    : undefined;

  return (
    <div className="space-y-4">
      {problem && (
        <div className="flex items-start gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-amber-50 text-amber-800">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            {problem}{" "}
            <Link href={backHref} className="underline">
              Back to Weighment
            </Link>
          </span>
        </div>
      )}

      {weighment && !movedTo && (
        <div className="flex items-start gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-brand-50 text-brand-700">
          <Weight size={14} className="mt-0.5 shrink-0" />
          <span>
            From weighment {weighment.weighmentNo}
            {weighment.vehicleNo ? ` · ${weighment.vehicleNo}` : ""} — final weight{" "}
            {weighment.finalWeight.toLocaleString("en-IN")} KG is filled in below. Enter
            the rate and save to finish; the weighment is then marked as moved.
          </span>
        </div>
      )}

      {movedTo && weighment && (
        <div className="flex items-start gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700">
          <CircleCheck size={14} className="mt-0.5 shrink-0" />
          <span>
            {weighment.weighmentNo} moved to {movedTo}.{" "}
            <Link href={backHref} className="underline">
              Back to Weighment
            </Link>
          </span>
        </div>
      )}

      {moveError && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
          <CircleAlert size={14} /> {moveError}
        </div>
      )}

      <InvoiceForm
        {...props}
        key={weighment?.id ?? "blank"}
        prefill={prefill ?? props.prefill}
        onSaved={async (invoiceNo) => {
          props.onSaved?.(invoiceNo);
          if (!weighment) return;
          const { error } = await markWeighmentMoved(weighment.id, invoiceNo);
          if (error) setMoveError(`Saved, but the weighment couldn't be marked as moved: ${error}`);
          else setMovedTo(invoiceNo);
        }}
      />
    </div>
  );
}
