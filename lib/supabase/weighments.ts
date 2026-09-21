import { supabase } from "@/lib/supabase/client";
import { mockParties } from "@/lib/party-data";

/**
 * Weighment — the weight of a load (vehicle) recorded before it becomes a
 * purchase bill or a sale invoice.
 *
 *   1. Save the weighment (date, vehicle, product, party, weight).
 *   2. Once the final weight is in, "Move to Purchase / Sale" opens the
 *      bill / invoice with that weight already filled in.
 *   3. Saving that bill marks the weighment "moved" — it can't be moved twice.
 */

export type WeighmentKind = "purchase" | "sale";
export type WeighmentStatus = "pending" | "moved";

export type Weighment = {
  id: string;
  kind: WeighmentKind;
  /** Shown as "Purchase ID" (PUR-1001) or "Sale ID" (SAL-1001). */
  weighmentNo: string;
  date: string;
  vehicleNo: string;
  product: string;
  partyId: string | null;
  /** In KG. 0 means "still waiting for the weight". */
  finalWeight: number;
  status: WeighmentStatus;
  movedInvoiceNo: string | null;
};

export const WEIGHMENT_PREFIX: Record<WeighmentKind, string> = {
  purchase: "PUR",
  sale: "SAL",
};

type Row = {
  id: string;
  kind: WeighmentKind;
  weighment_no: string;
  weighment_date: string;
  vehicle_no: string | null;
  product: string | null;
  party_id: string | null;
  final_weight: number | string | null;
  status: WeighmentStatus;
  moved_invoice_no: string | null;
};

const COLUMNS =
  "id, kind, weighment_no, weighment_date, vehicle_no, product, party_id, final_weight, status, moved_invoice_no";

function fromRow(r: Row): Weighment {
  return {
    id: r.id,
    kind: r.kind,
    weighmentNo: r.weighment_no,
    date: r.weighment_date,
    vehicleNo: r.vehicle_no ?? "",
    product: r.product ?? "",
    partyId: r.party_id,
    finalWeight: Number(r.final_weight) || 0,
    status: r.status,
    movedInvoiceNo: r.moved_invoice_no,
  };
}

/** A missing table means migration_12 hasn't been run yet — say so plainly. */
function friendly(message: string): string {
  if (/weighments/i.test(message) && /(does not exist|schema cache|not find)/i.test(message)) {
    return "The weighments table doesn't exist yet. Run supabase/migration_12_weighments.sql once in the Supabase SQL Editor, then try again.";
  }
  return message;
}

/* ------------------------- Demo-mode (no database) ------------------------- */

const today = () => new Date().toISOString().slice(0, 10);
const demoParty = mockParties[0]?.id ?? null;

const demoStore: Weighment[] = [
  { id: "demo-w-1", kind: "purchase", weighmentNo: "PUR-1001", date: today(), vehicleNo: "LEA-1234", product: "Cotton", partyId: demoParty, finalWeight: 5200, status: "pending", movedInvoiceNo: null },
  { id: "demo-w-2", kind: "sale", weighmentNo: "SAL-1001", date: today(), vehicleNo: "MNA-7788", product: "Cotton", partyId: demoParty, finalWeight: 0, status: "pending", movedInvoiceNo: null },
];

/* ---------------------------------- API ---------------------------------- */

export async function fetchWeighments(kind: WeighmentKind): Promise<Weighment[]> {
  if (!supabase) return demoStore.filter((w) => w.kind === kind);
  const { data, error } = await supabase
    .from("weighments")
    .select(COLUMNS)
    .eq("kind", kind)
    .order("weighment_date", { ascending: false })
    .order("weighment_no", { ascending: false });
  if (error || !data) {
    if (error) console.error("fetchWeighments error:", error.message);
    return [];
  }
  return (data as unknown as Row[]).map(fromRow);
}

export async function fetchWeighment(id: string): Promise<Weighment | null> {
  if (!supabase) return demoStore.find((w) => w.id === id) ?? null;
  const { data, error } = await supabase
    .from("weighments")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return fromRow(data as unknown as Row);
}

/** The next Purchase ID / Sale ID: PUR-1001, PUR-1002, … */
export async function fetchNextWeighmentNo(kind: WeighmentKind): Promise<string> {
  const prefix = WEIGHMENT_PREFIX[kind];
  let numbers: number[];
  if (!supabase) {
    numbers = demoStore
      .filter((w) => w.kind === kind)
      .map((w) => Number(w.weighmentNo.replace(/\D/g, "")) || 0);
  } else {
    const { data } = await supabase
      .from("weighments")
      .select("weighment_no")
      .like("weighment_no", `${prefix}-%`);
    numbers = (data ?? []).map((r: { weighment_no: string }) => Number(r.weighment_no.replace(/\D/g, "")) || 0);
  }
  const next = (numbers.length ? Math.max(...numbers) : 1000) + 1;
  return `${prefix}-${next}`;
}

export type NewWeighment = {
  kind: WeighmentKind;
  weighmentNo: string;
  date: string;
  vehicleNo: string;
  product: string;
  partyId: string | null;
  finalWeight: number;
};

export async function saveWeighment(w: NewWeighment): Promise<{ error: string | null }> {
  if (!supabase) {
    demoStore.unshift({
      id: `demo-w-${Date.now()}`,
      ...w,
      status: "pending",
      movedInvoiceNo: null,
    });
    return { error: null };
  }
  const { error } = await supabase.from("weighments").insert({
    kind: w.kind,
    weighment_no: w.weighmentNo,
    weighment_date: w.date,
    vehicle_no: w.vehicleNo || null,
    product: w.product || null,
    party_id: w.partyId,
    final_weight: w.finalWeight,
  });
  return { error: error ? friendly(error.message) : null };
}

/** Set / correct the weight — only while the weighment is still pending. */
export async function updateWeighmentWeight(
  id: string,
  finalWeight: number
): Promise<{ error: string | null }> {
  if (!supabase) {
    const w = demoStore.find((x) => x.id === id);
    if (w && w.status === "pending") w.finalWeight = finalWeight;
    return { error: null };
  }
  const { error } = await supabase
    .from("weighments")
    .update({ final_weight: finalWeight })
    .eq("id", id)
    .eq("status", "pending");
  return { error: error ? friendly(error.message) : null };
}

/** One-time hand-off to a bill / invoice. A second call is a no-op error. */
export async function markWeighmentMoved(
  id: string,
  invoiceNo: string
): Promise<{ error: string | null }> {
  if (!supabase) {
    const w = demoStore.find((x) => x.id === id);
    if (!w || w.status === "moved") return { error: "Already moved." };
    w.status = "moved";
    w.movedInvoiceNo = invoiceNo;
    return { error: null };
  }
  const { data, error } = await supabase
    .from("weighments")
    .update({
      status: "moved",
      moved_invoice_no: invoiceNo,
      moved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending") // guards against moving the same weighment twice
    .select("id");
  if (error) return { error: friendly(error.message) };
  if (!data || data.length === 0) return { error: "This weighment was already moved." };
  return { error: null };
}
