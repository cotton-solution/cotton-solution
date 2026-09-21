export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense"
  | "party";

export type Account = {
  id: string; // = code, unique within the business
  code: string;
  name: string;
  accountType: AccountType;
  parentCode: string; // "" = top-level (no parent)
  isActive: boolean;
  /** Party heads and the parties under them come from Party Master — shown, not edited, here. */
  readOnly?: boolean;
};

export const accountTypes: { value: AccountType; label: string; prefix: string }[] = [
  { value: "asset", label: "Asset", prefix: "1" },
  { value: "liability", label: "Liability", prefix: "2" },
  { value: "equity", label: "Equity", prefix: "3" },
  { value: "income", label: "Income", prefix: "4" },
  { value: "expense", label: "Expense", prefix: "5" },
  { value: "party", label: "Party", prefix: "6" },
];

/** The types an account can be created as here (parties are added in Party Master). */
export const editableAccountTypes = accountTypes.filter((t) => t.value !== "party");

export function accountTypeLabel(t: AccountType): string {
  return accountTypes.find((a) => a.value === t)?.label ?? t;
}

/** Mirrors the default rows `seed_new_business()` inserts in Supabase,
 *  so demo mode (no Supabase configured) looks the same as a fresh
 *  real account. */
export const mockAccounts: Account[] = [
  {
    id: "1010001",
    code: "1010001",
    name: "Cash in Hand",
    accountType: "asset",
    parentCode: "",
    isActive: true,
  },
  {
    id: "1020001",
    code: "1020001",
    name: "Bank Account",
    accountType: "asset",
    parentCode: "",
    isActive: true,
  },
  {
    id: "2010001",
    code: "2010001",
    name: "Withholding Tax Payable",
    accountType: "liability",
    parentCode: "",
    isActive: true,
  },
  {
    id: "4010001",
    code: "4010001",
    name: "Brokerage Commission Income",
    accountType: "income",
    parentCode: "",
    isActive: true,
  },
  {
    id: "5010001",
    code: "5010001",
    name: "Office & Admin Expenses",
    accountType: "expense",
    parentCode: "",
    isActive: true,
  },
  {
    id: "5010002",
    code: "5010002",
    name: "Labour & Loading Charges",
    accountType: "expense",
    parentCode: "",
    isActive: true,
  },
];

export function emptyAccount(code: string): Account {
  return {
    id: code,
    code,
    name: "",
    accountType: "asset",
    parentCode: "",
    isActive: true,
  };
}

/** Suggests the next free code inside a type's numbering block
 *  (e.g. next Asset after 1020001 -> 1030001). Editable by the user
 *  afterwards — this is a starting point, not a hard rule. */
export function nextAccountCode(
  accountType: AccountType,
  accounts: Account[]
): string {
  const prefix = accountTypes.find((a) => a.value === accountType)!.prefix;
  const sameType = accounts.filter((a) => a.code.startsWith(prefix));
  if (sameType.length === 0) return `${prefix}010001`;
  const maxSuffix = sameType.reduce((max, a) => {
    const n = parseInt(a.code.slice(1), 10);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `${prefix}${String(maxSuffix + 10000).padStart(6, "0")}`;
}
