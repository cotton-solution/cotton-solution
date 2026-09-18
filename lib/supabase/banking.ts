import { supabase } from "@/lib/supabase/client";

export type BankAccount = {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string | null;
  branch: string | null;
  openingBalance: number;
  isActive: boolean;
};

export type CreditCard = {
  id: string;
  cardName: string;
  bankName: string;
  lastFour: string | null;
  creditLimit: number;
  currentBalance: number;
  statementDay: number | null;
  isActive: boolean;
};

export type Reconciliation = {
  id: string;
  bankAccountId: string;
  statementDate: string;
  statementBalance: number;
  bookBalance: number;
  status: "open" | "reconciled";
  notes: string | null;
};

/* ------------------------------ Demo data ------------------------------ */

export const demoBankAccounts: BankAccount[] = [
  { id: "demo-bank-1", accountName: "Main Operating Account", bankName: "Meezan Bank", accountNumber: "0142-0091234-01", branch: "Gulberg", openingBalance: 2500000, isActive: true },
  { id: "demo-bank-2", accountName: "Payroll Account", bankName: "HBL", accountNumber: "7719-0056781-09", branch: "Model Town", openingBalance: 850000, isActive: true },
];

export const demoCreditCards: CreditCard[] = [
  { id: "demo-cc-1", cardName: "Business Platinum", bankName: "Standard Chartered", lastFour: "4821", creditLimit: 1000000, currentBalance: 184500, statementDay: 5, isActive: true },
];

export const demoReconciliations: Reconciliation[] = [
  { id: "demo-rec-1", bankAccountId: "demo-bank-1", statementDate: new Date().toISOString().slice(0, 10), statementBalance: 2480000, bookBalance: 2500000, status: "open", notes: "Two cheques still outstanding" },
];

/* ------------------------------ Bank accounts --------------------------- */

export async function fetchBankAccounts(): Promise<BankAccount[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, account_number, branch, opening_balance, is_active")
    .order("account_name");
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    accountName: r.account_name,
    bankName: r.bank_name,
    accountNumber: r.account_number,
    branch: r.branch,
    openingBalance: Number(r.opening_balance) || 0,
    isActive: r.is_active,
  }));
}

export async function saveBankAccount(
  account: Omit<BankAccount, "id"> & { id?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = {
    account_name: account.accountName,
    bank_name: account.bankName,
    account_number: account.accountNumber,
    branch: account.branch,
    opening_balance: account.openingBalance,
    is_active: account.isActive,
  };
  const { error } = account.id
    ? await supabase.from("bank_accounts").update(payload).eq("id", account.id)
    : await supabase.from("bank_accounts").insert(payload);
  return { error: error?.message ?? null };
}

export async function deleteBankAccount(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/* ------------------------------ Credit cards ----------------------------- */

export async function fetchCreditCards(): Promise<CreditCard[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("credit_cards")
    .select("id, card_name, bank_name, last_four, credit_limit, current_balance, statement_day, is_active")
    .order("card_name");
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    cardName: r.card_name,
    bankName: r.bank_name,
    lastFour: r.last_four,
    creditLimit: Number(r.credit_limit) || 0,
    currentBalance: Number(r.current_balance) || 0,
    statementDay: r.statement_day,
    isActive: r.is_active,
  }));
}

export async function saveCreditCard(
  card: Omit<CreditCard, "id"> & { id?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = {
    card_name: card.cardName,
    bank_name: card.bankName,
    last_four: card.lastFour,
    credit_limit: card.creditLimit,
    current_balance: card.currentBalance,
    statement_day: card.statementDay,
    is_active: card.isActive,
  };
  const { error } = card.id
    ? await supabase.from("credit_cards").update(payload).eq("id", card.id)
    : await supabase.from("credit_cards").insert(payload);
  return { error: error?.message ?? null };
}

export async function deleteCreditCard(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("credit_cards").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/* ------------------------------ Reconciliation --------------------------- */

export async function fetchReconciliations(): Promise<Reconciliation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("bank_reconciliations")
    .select("id, bank_account_id, statement_date, statement_balance, book_balance, status, notes")
    .order("statement_date", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    bankAccountId: r.bank_account_id,
    statementDate: r.statement_date,
    statementBalance: Number(r.statement_balance) || 0,
    bookBalance: Number(r.book_balance) || 0,
    status: r.status,
    notes: r.notes,
  }));
}

export async function saveReconciliation(
  rec: Omit<Reconciliation, "id"> & { id?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const payload = {
    bank_account_id: rec.bankAccountId,
    statement_date: rec.statementDate,
    statement_balance: rec.statementBalance,
    book_balance: rec.bookBalance,
    status: rec.status,
    notes: rec.notes,
  };
  const { error } = rec.id
    ? await supabase.from("bank_reconciliations").update(payload).eq("id", rec.id)
    : await supabase.from("bank_reconciliations").insert(payload);
  return { error: error?.message ?? null };
}
