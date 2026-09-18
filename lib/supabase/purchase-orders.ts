import { supabase } from "@/lib/supabase/client";

export type POLine = {
  id: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
};

export type PurchaseOrder = {
  id: string;
  poNo: string;
  poDate: string;
  partyId: string | null;
  subtotal: number;
  netTotal: number;
  status: "draft" | "sent" | "received" | "cancelled";
  expectedDate: string | null;
  notes: string | null;
};

export const demoPurchaseOrders: PurchaseOrder[] = [
  { id: "demo-po-1", poNo: "PO-2201", poDate: new Date().toISOString().slice(0, 10), partyId: "V-0001", subtotal: 610000, netTotal: 610000, status: "sent", expectedDate: null, notes: null },
  { id: "demo-po-2", poNo: "PO-2200", poDate: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10), partyId: "V-0002", subtotal: 245000, netTotal: 245000, status: "received", expectedDate: null, notes: "Received in full" },
];

export async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, po_no, po_date, party_id, subtotal, net_total, status, expected_date, notes")
    .order("po_date", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    poNo: r.po_no,
    poDate: r.po_date,
    partyId: r.party_id,
    subtotal: Number(r.subtotal) || 0,
    netTotal: Number(r.net_total) || 0,
    status: r.status,
    expectedDate: r.expected_date,
    notes: r.notes,
  }));
}

export async function nextPONumber(existing: PurchaseOrder[]): Promise<string> {
  const nums = existing
    .map((p) => Number(p.poNo.replace(/[^0-9]/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 2200) + 1;
  return `PO-${next}`;
}

export async function savePurchaseOrder(
  po: Omit<PurchaseOrder, "id"> & { id?: string },
  lines: Omit<POLine, "id">[]
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = {
    po_no: po.poNo,
    po_date: po.poDate,
    party_id: po.partyId,
    subtotal: po.subtotal,
    net_total: po.netTotal,
    status: po.status,
    expected_date: po.expectedDate,
    notes: po.notes,
  };
  if (po.id) {
    const { error } = await supabase.from("purchase_orders").update(payload).eq("id", po.id);
    return { error: error?.message ?? null };
  }
  const { data, error } = await supabase.from("purchase_orders").insert(payload).select("id").single();
  if (error || !data) return { error: error?.message ?? "Could not save purchase order." };
  if (lines.length) {
    await supabase.from("purchase_order_lines").insert(
      lines.map((l) => ({
        purchase_order_id: data.id,
        description: l.description,
        unit: l.unit,
        qty: l.qty,
        rate: l.rate,
      }))
    );
  }
  return { error: null };
}

export async function setPurchaseOrderStatus(
  id: string,
  status: PurchaseOrder["status"]
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
  return { error: error?.message ?? null };
}
