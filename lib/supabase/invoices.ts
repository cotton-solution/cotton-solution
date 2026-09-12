import { supabase } from "@/lib/supabase/client";

export type InvoiceCategory = "brokerage" | "general" | "crop";

export type InvoiceLinePayload = {
  description: string;
  unit: string;
  qty: number;
  rate: number;
};

export type InvoicePayload = {
  invoiceNo: string;
  category: InvoiceCategory;
  invoiceType: "purchase" | "sale";
  invoiceDate: string;
  partyId: string;
  subtotal: number;
  brokeragePercent: number;
  brokerageAmount: number;
  netTotal: number;
  notes?: string;
  lines: InvoiceLinePayload[];
};

export async function saveInvoice(
  payload: InvoicePayload
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      invoice_no: payload.invoiceNo,
      invoice_category: payload.category,
      invoice_type: payload.invoiceType,
      invoice_date: payload.invoiceDate,
      party_id: payload.partyId,
      subtotal: payload.subtotal,
      brokerage_percent: payload.brokeragePercent,
      brokerage_amount: payload.brokerageAmount,
      net_total: payload.netTotal,
      notes: payload.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create invoice." };
  }

  const validLines = payload.lines.filter((l) => l.description.trim());
  if (validLines.length > 0) {
    const { error: linesError } = await supabase.from("invoice_lines").insert(
      validLines.map((l) => ({
        invoice_id: data.id,
        description: l.description,
        unit: l.unit,
        qty: l.qty,
        rate: l.rate,
      }))
    );
    if (linesError) return { error: linesError.message };
  }

  return { error: null };
}
