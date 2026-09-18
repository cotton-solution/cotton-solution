import { supabase } from "@/lib/supabase/client";

export type Warehouse = {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
};

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  isActive: boolean;
  /** Computed client-side from stock movements — not stored directly. */
  onHand?: number;
};

export type StockMovement = {
  id: string;
  itemId: string;
  warehouseId: string | null;
  movementType: "in" | "out";
  qty: number;
  reference: string | null;
  notes: string | null;
  movementDate: string;
};

/* ------------------------------ Demo data ------------------------------ */

export const demoWarehouses: Warehouse[] = [
  { id: "demo-wh-1", name: "Main Warehouse", location: "Lahore", isActive: true },
  { id: "demo-wh-2", name: "Karachi Depot", location: "Karachi", isActive: true },
];

export const demoItems: InventoryItem[] = [
  { id: "demo-item-1", sku: "SKU-1001", name: "A4 Copier Paper (Ream)", unit: "Box", reorderLevel: 20, unitCost: 850, isActive: true },
  { id: "demo-item-2", sku: "SKU-1002", name: "Steel Office Chair", unit: "Pcs", reorderLevel: 5, unitCost: 12500, isActive: true },
  { id: "demo-item-3", sku: "SKU-1003", name: "LED Panel Light 40W", unit: "Pcs", reorderLevel: 15, unitCost: 2100, isActive: true },
];

export const demoStockMovements: StockMovement[] = [
  { id: "demo-mv-1", itemId: "demo-item-1", warehouseId: "demo-wh-1", movementType: "in", qty: 60, reference: "BILL-4821", notes: null, movementDate: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10) },
  { id: "demo-mv-2", itemId: "demo-item-1", warehouseId: "demo-wh-1", movementType: "out", qty: 46, reference: "Internal use", notes: null, movementDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10) },
  { id: "demo-mv-3", itemId: "demo-item-2", warehouseId: "demo-wh-1", movementType: "in", qty: 8, reference: "BILL-4790", notes: null, movementDate: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10) },
  { id: "demo-mv-4", itemId: "demo-item-3", warehouseId: "demo-wh-2", movementType: "in", qty: 12, reference: "BILL-4805", notes: null, movementDate: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10) },
];

/** Net on-hand quantity per item from a list of movements. */
export function onHandByItem(movements: StockMovement[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of movements) {
    out[m.itemId] = (out[m.itemId] ?? 0) + (m.movementType === "in" ? m.qty : -m.qty);
  }
  return out;
}

/* ------------------------------ Warehouses ------------------------------ */

export async function fetchWarehouses(): Promise<Warehouse[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, name, location, is_active")
    .order("name");
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id, name: r.name, location: r.location, isActive: r.is_active }));
}

export async function saveWarehouse(
  wh: Omit<Warehouse, "id"> & { id?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = { name: wh.name, location: wh.location, is_active: wh.isActive };
  const { error } = wh.id
    ? await supabase.from("warehouses").update(payload).eq("id", wh.id)
    : await supabase.from("warehouses").insert(payload);
  return { error: error?.message ?? null };
}

/* ------------------------------ Items ------------------------------------ */

export async function fetchItems(): Promise<InventoryItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, sku, name, unit, reorder_level, unit_cost, is_active")
    .order("name");
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    unit: r.unit,
    reorderLevel: Number(r.reorder_level) || 0,
    unitCost: Number(r.unit_cost) || 0,
    isActive: r.is_active,
  }));
}

export async function saveItem(
  item: Omit<InventoryItem, "id" | "onHand"> & { id?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = {
    sku: item.sku,
    name: item.name,
    unit: item.unit,
    reorder_level: item.reorderLevel,
    unit_cost: item.unitCost,
    is_active: item.isActive,
  };
  const { error } = item.id
    ? await supabase.from("inventory_items").update(payload).eq("id", item.id)
    : await supabase.from("inventory_items").insert(payload);
  return { error: error?.message ?? null };
}

/* ------------------------------ Stock movements --------------------------- */

export async function fetchStockMovements(): Promise<StockMovement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, item_id, warehouse_id, movement_type, qty, reference, notes, movement_date")
    .order("movement_date", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    itemId: r.item_id,
    warehouseId: r.warehouse_id,
    movementType: r.movement_type,
    qty: Number(r.qty) || 0,
    reference: r.reference,
    notes: r.notes,
    movementDate: r.movement_date,
  }));
}

export async function saveStockMovement(
  mv: Omit<StockMovement, "id">
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("stock_movements").insert({
    item_id: mv.itemId,
    warehouse_id: mv.warehouseId,
    movement_type: mv.movementType,
    qty: mv.qty,
    reference: mv.reference,
    notes: mv.notes,
    movement_date: mv.movementDate,
  });
  return { error: error?.message ?? null };
}
