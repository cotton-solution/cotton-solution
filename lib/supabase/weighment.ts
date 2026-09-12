import { supabase } from "@/lib/supabase/client";

export type WeighmentPayload = {
  slipNo: string;
  slipType: "purchase" | "sale";
  slipDate: string;
  vehicleNo: string;
  partyId: string;
  crop: string;
  bags: number;
  grossWeight: number;
  tareWeight: number;
};

export async function saveWeighment(
  payload: WeighmentPayload
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("weighment_slips").insert({
    slip_no: payload.slipNo,
    slip_type: payload.slipType,
    slip_date: payload.slipDate,
    vehicle_no: payload.vehicleNo || null,
    party_id: payload.partyId,
    crop: payload.crop,
    bags: payload.bags,
    gross_weight: payload.grossWeight,
    tare_weight: payload.tareWeight,
  });
  return { error: error?.message ?? null };
}
