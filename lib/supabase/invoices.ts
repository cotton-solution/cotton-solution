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

export type InvoiceRecord = {
  id: string;
  invoiceNo: string;
  category: InvoiceCategory;
  invoiceType: "purchase" | "sale";
  invoiceDate: string;
  partyId: string | null;
  subtotal: number;
  brokerageAmount: number;
  netTotal: number;
  notes: string | null;
  status: "draft" | "posted" | "void";
  voidReason: string | null;
};

/**
 * All saved invoices for the signed-in business (RLS scopes this
 * automatically), newest first. Powers the invoice list on each
 * module's hub page — previously there was no way to find an invoice
 * again once it had been saved.
 */
export async function fetchInvoices(filter?: {
  category?: InvoiceCategory;
}): Promise<InvoiceRecord[]> {
  if (!supabase) return [];
  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_no, invoice_category, invoice_type, invoice_date, party_id, subtotal, brokerage_amount, net_total, notes, status, void_reason"
    )
    .order("invoice_date", { ascending: false })
    .order("invoice_no", { ascending: false });

  if (filter?.category) query = query.eq("invoice_category", filter.category);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("fetchInvoices error:", error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    invoiceNo: row.invoice_no,
    category: row.invoice_category,
    invoiceType: row.invoice_type,
    invoiceDate: row.invoice_date,
    partyId: row.party_id,
    subtotal: Number(row.subtotal) || 0,
    brokerageAmount: Number(row.brokerage_amount) || 0,
    netTotal: Number(row.net_total) || 0,
    notes: row.notes,
    status: (row.status as InvoiceRecord["status"] | null) ?? "posted",
    voidReason: row.void_reason,
  }));
}

/**
 * Void a saved invoice instead of deleting it — see voidVoucher in
 * lib/supabase/vouchers.ts for why (migration_19).
 */
export async function voidInvoice(
  id: string,
  reason?: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.rpc("void_invoice", {
    p_id: id,
    p_reason: reason || null,
  });
  if (error && /function void_invoice/i.test(error.message)) {
    return {
      error:
        "Voiding needs one database update. Run supabase/migration_19_document_lifecycle_and_audit.sql once in the Supabase SQL Editor, then try again.",
    };
  }
  return { error: error?.message ?? null };
}

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
