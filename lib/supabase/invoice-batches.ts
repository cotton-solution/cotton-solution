import { supabase } from "@/lib/supabase/client";

export type BatchLinePayload = {
  partyId: string;
  invoiceType: "Purchase" | "Sale";
  amount: number;
};

export async function saveInvoiceBatch(
  batchLabel: string,
  lines: BatchLinePayload[]
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("invoice_batches")
    .insert({ batch_label: batchLabel })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create invoice batch." };
  }

  const validLines = lines.filter((l) => l.amount > 0);
  if (validLines.length > 0) {
    const { error: linesError } = await supabase
      .from("invoice_batch_lines")
      .insert(
        validLines.map((l) => ({
          batch_id: data.id,
          party_id: l.partyId,
          invoice_type: l.invoiceType.toLowerCase(),
          amount: l.amount,
        }))
      );
    if (linesError) return { error: linesError.message };
  }

  return { error: null };
}
