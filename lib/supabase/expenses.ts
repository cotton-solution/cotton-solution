import { supabase } from "@/lib/supabase/client";

export type Expense = {
  id: string;
  expenseDate: string;
  category: string;
  amount: number;
  paymentMethod: "cash" | "bank" | "credit_card";
  notes: string | null;
  receiptNote: string | null;
};

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries & Wages",
  "Travel & Conveyance",
  "Office Supplies",
  "Repairs & Maintenance",
  "Marketing",
  "Professional Fees",
  "Insurance",
  "Miscellaneous",
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const demoExpenses: Expense[] = [
  { id: "demo-exp-1", expenseDate: isoDaysAgo(1), category: "Rent", amount: 150000, paymentMethod: "bank", notes: "Office rent — this month", receiptNote: null },
  { id: "demo-exp-2", expenseDate: isoDaysAgo(2), category: "Utilities", amount: 32500, paymentMethod: "cash", notes: "Electricity bill", receiptNote: "Receipt filed" },
  { id: "demo-exp-3", expenseDate: isoDaysAgo(3), category: "Travel & Conveyance", amount: 8600, paymentMethod: "cash", notes: null, receiptNote: null },
  { id: "demo-exp-4", expenseDate: isoDaysAgo(5), category: "Salaries & Wages", amount: 420000, paymentMethod: "bank", notes: "Staff salaries", receiptNote: null },
  { id: "demo-exp-5", expenseDate: isoDaysAgo(9), category: "Office Supplies", amount: 14200, paymentMethod: "credit_card", notes: null, receiptNote: null },
];

export async function fetchExpenses(): Promise<Expense[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("expenses")
    .select("id, expense_date, category, amount, payment_method, notes, receipt_note")
    .order("expense_date", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    expenseDate: r.expense_date,
    category: r.category,
    amount: Number(r.amount) || 0,
    paymentMethod: r.payment_method,
    notes: r.notes,
    receiptNote: r.receipt_note,
  }));
}

export async function saveExpense(
  expense: Omit<Expense, "id"> & { id?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = {
    expense_date: expense.expenseDate,
    category: expense.category,
    amount: expense.amount,
    payment_method: expense.paymentMethod,
    notes: expense.notes,
    receipt_note: expense.receiptNote,
  };
  const { error } = expense.id
    ? await supabase.from("expenses").update(payload).eq("id", expense.id)
    : await supabase.from("expenses").insert(payload);
  return { error: error?.message ?? null };
}

export async function deleteExpense(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  return { error: error?.message ?? null };
}
