import { supabase } from "@/lib/supabase/client";

export type ContractPayload = {
  contractNo: string;
  contractType: "purchase" | "sale";
  contractDate: string;
  deliveryDate?: string;
  partyId: string;
  crop: string;
  unit: string;
  quantity: number;
  rate: number;
  advance: number;
  notes?: string;
};

export async function saveContract(
  payload: ContractPayload
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("contracts").insert({
    contract_no: payload.contractNo,
    contract_type: payload.contractType,
    contract_date: payload.contractDate,
    delivery_date: payload.deliveryDate || null,
    party_id: payload.partyId,
    crop: payload.crop,
    unit: payload.unit,
    quantity: payload.quantity,
    rate: payload.rate,
    advance: payload.advance,
    notes: payload.notes || null,
  });
  return { error: error?.message ?? null };
}
