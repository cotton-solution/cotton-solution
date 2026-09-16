import type { ModuleKey } from "@/lib/modules";

export type MemberRole = "admin" | "accountant" | "trader" | "viewer" | "custom";

export const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  accountant: "Accountant",
  trader: "Trader",
  viewer: "Viewer",
  custom: "Custom",
};

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  admin: "Full access to every module, including User Access",
  accountant: "Accounts Forms, Accounts Reports",
  trader: "Trader module + Accounts Reports",
  viewer: "Read-only style access to Accounts Reports",
  custom: "Pick exactly which modules this person can open",
};

/** Modules each built-in role gets by default. "custom" has no default —
 *  the owner picks module_keys by hand for that person instead. */
export const DEFAULT_ROLE_MODULES: Record<
  Exclude<MemberRole, "custom">,
  ModuleKey[]
> = {
  admin: [
    "accounts-forms",
    "accounts-reports",
    "brokerage",
    "general",
    "crops",
    "trader",
    "user-access",
  ],
  accountant: ["accounts-forms", "accounts-reports"],
  trader: ["trader", "accounts-reports"],
  viewer: ["accounts-reports"],
};

export type TeamMember = {
  id: string; // business_members.id
  userId: string;
  email: string;
  name: string;
  role: MemberRole;
  moduleKeys: ModuleKey[]; // only meaningful when role === "custom"
  isActive: boolean;
  createdAt: string;
};

/** The modules a member can actually see, resolving role defaults vs.
 *  a hand-picked "custom" list. */
export function effectiveModuleKeys(member: {
  role: MemberRole;
  moduleKeys: ModuleKey[];
}): ModuleKey[] {
  if (member.role === "custom") return member.moduleKeys;
  return DEFAULT_ROLE_MODULES[member.role];
}

export function emptyMemberDraft(): {
  name: string;
  email: string;
  role: MemberRole;
  moduleKeys: ModuleKey[];
} {
  return { name: "", email: "", role: "accountant", moduleKeys: [] };
}

/** Demo-mode data — mirrors the shape a real Supabase business would
 *  have after inviting a couple of staff logins. */
export const mockTeamMembers: TeamMember[] = [
  {
    id: "demo-1",
    userId: "demo-1",
    email: "accountant@demo.local",
    name: "Bilal Accountant",
    role: "accountant",
    moduleKeys: [],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    userId: "demo-2",
    email: "trader.desk@demo.local",
    name: "Sana Trader",
    role: "trader",
    moduleKeys: [],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];
