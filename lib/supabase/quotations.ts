import { supabase } from "@/lib/supabase/client";

export type QuoteLine = {
  id: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
};

export type Quotation = {
  id: string;
  quoteNo: string;
  quoteDate: string;
  partyId: string | null;
  subtotal: number;
  netTotal: number;
  status: "draft" | "sent" | "accepted" | "declined" | "converted";
  validUntil: string | null;
  notes: string | null;
};

export const demoQuotations: Quotation[] = [
  { id: "demo-q-1", quoteNo: "QT-1042", quoteDate: new Date().toISOString().slice(0, 10), partyId: "C-0001", subtotal: 420000, netTotal: 420000, status: "sent", validUntil: null, notes: null },
  { id: "demo-q-2", quoteNo: "QT-1041", quoteDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), partyId: "C-0002", subtotal: 178500, netTotal: 178500, status: "accepted", validUntil: null, notes: "Approved by procurement" },
];

export async function fetchQuotations(): Promise<Quotation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("quotations")
    .select("id, quote_no, quote_date, party_id, subtotal, net_total, status, valid_until, notes")
    .order("quote_date", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    quoteNo: r.quote_no,
    quoteDate: r.quote_date,
    partyId: r.party_id,
    subtotal: Number(r.subtotal) || 0,
    netTotal: Number(r.net_total) || 0,
    status: r.status,
    validUntil: r.valid_until,
    notes: r.notes,
  }));
}

export async function nextQuoteNumber(existing: Quotation[]): Promise<string> {
  const nums = existing
    .map((q) => Number(q.quoteNo.replace(/[^0-9]/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1040) + 1;
  return `QT-${next}`;
}

export async function saveQuotation(
  quote: Omit<Quotation, "id"> & { id?: string },
  lines: Omit<QuoteLine, "id">[]
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = {
    quote_no: quote.quoteNo,
    quote_date: quote.quoteDate,
    party_id: quote.partyId,
    subtotal: quote.subtotal,
    net_total: quote.netTotal,
    status: quote.status,
    valid_until: quote.validUntil,
    notes: quote.notes,
  };
  if (quote.id) {
    const { error } = await supabase.from("quotations").update(payload).eq("id", quote.id);
    return { error: error?.message ?? null };
  }
  const { data, error } = await supabase.from("quotations").insert(payload).select("id").single();
  if (error || !data) return { error: error?.message ?? "Could not save quotation." };
  if (lines.length) {
    await supabase.from("quotation_lines").insert(
      lines.map((l) => ({
        quotation_id: data.id,
        description: l.description,
        unit: l.unit,
        qty: l.qty,
        rate: l.rate,
      }))
    );
  }
  return { error: null };
}

export async function setQuotationStatus(
  id: string,
  status: Quotation["status"]
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
  return { error: error?.message ?? null };
}
