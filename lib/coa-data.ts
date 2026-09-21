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
  /** A sub head: a group that other accounts sit under. Not used in vouchers. */
  isGroup?: boolean;
};

export const accountTypes: { value: AccountType; label: string; prefix: string }[] = [
  // Parties come first — everywhere the types are listed.
  { value: "party", label: "Party", prefix: "6" },
  { value: "asset", label: "Asset", prefix: "1" },
  { value: "liability", label: "Liability", prefix: "2" },
  { value: "equity", label: "Equity", prefix: "3" },
  { value: "income", label: "Income", prefix: "4" },
  { value: "expense", label: "Expense", prefix: "5" },
];

/** The types a sub head can be created under (party heads are fixed: Buyers / Sellers / Misc Parties). */
export const editableAccountTypes = accountTypes.filter((t) => t.value !== "party");

export function accountTypeLabel(t: AccountType): string {
  return accountTypes.find((a) => a.value === t)?.label ?? t;
}

/** The Party sub heads every business starts with (Chart of Accounts → Parties). */
export const defaultPartySubHeadAccounts: Account[] = [
  { id: "6200000", code: "6200000", name: "Buyer", accountType: "party", parentCode: "", isActive: true, isGroup: true },
  { id: "6300000", code: "6300000", name: "Seller", accountType: "party", parentCode: "", isActive: true, isGroup: true },
  { id: "6400000", code: "6400000", name: "Misc Parties", accountType: "party", parentCode: "", isActive: true, isGroup: true },
];

/** Mirrors the default rows `seed_new_business()` inserts in Supabase,
 *  so demo mode (no Supabase configured) looks the same as a fresh
 *  real account. */
export const mockAccounts: Account[] = [
  ...defaultPartySubHeadAccounts,
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

/** Next code for a new Party sub head: 6500000, 6600000 … (the 3 defaults use 62/63/64). */
export function nextPartySubHeadCode(accounts: Account[]): string {
  const nums = accounts
    .filter((a) => a.accountType === "party" && a.isGroup)
    .map((a) => parseInt(a.code, 10))
    .filter((n) => !isNaN(n));
  const max = Math.max(6400000, ...nums);
  return String(Math.floor(max / 100000) * 100000 + 100000);
}

export function emptyAccount(code: string): Account {
  return {
    id: code,
    code,
    name: "",
    accountType: "asset",
    parentCode: "",
    isActive: true,
    isGroup: false,
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
