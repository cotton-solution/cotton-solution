import { supabase } from "@/lib/supabase/client";
import type { ModuleKey } from "@/lib/modules";
import type { MemberRole, TeamMember } from "@/lib/team-data";

type MemberRow = {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: MemberRole;
  module_keys: ModuleKey[] | null;
  is_active: boolean;
  created_at: string;
};

function rowToMember(row: MemberRow): TeamMember {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name ?? "",
    role: row.role,
    moduleKeys: row.module_keys ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/** Everyone the current (owner's) business has invited. Empty for a
 *  staff login — RLS only lets them see their own membership row. */
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("business_members")
    .select("id, user_id, email, name, role, module_keys, is_active, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchTeamMembers error:", error.message);
    return [];
  }
  return (data as MemberRow[]).map(rowToMember);
}

export type Membership = {
  role: MemberRole;
  moduleKeys: ModuleKey[];
  isActive: boolean;
};

/** The signed-in user's own membership row, or null if they're the
 *  business owner (owners have no row — they simply own the business). */
export async function fetchMyMembership(): Promise<Membership | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("business_members")
    .select("role, module_keys, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return {
    role: data.role,
    moduleKeys: data.module_keys ?? [],
    isActive: data.is_active,
  };
}

export async function updateTeamMember(
  id: string,
  updates: { role?: MemberRole; moduleKeys?: ModuleKey[]; isActive?: boolean; name?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("business_members")
    .update({
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.moduleKeys !== undefined
        ? { module_keys: updates.moduleKeys }
        : {}),
      ...(updates.isActive !== undefined ? { is_active: updates.isActive } : {}),
      ...(updates.name !== undefined ? { name: updates.name } : {}),
    })
    .eq("id", id);

  return { error: error?.message ?? null };
}

/**
 * Creates a brand-new staff login (auth user) and a business_members row
 * for it. Runs through /api/team/invite because creating another
 * person's login needs the Supabase service-role key, which must never
 * reach the browser — see that route for the server-side logic.
 */
export async function inviteTeamMember(payload: {
  name: string;
  email: string;
  role: MemberRole;
  moduleKeys: ModuleKey[];
}): Promise<{ error: string | null; tempPassword?: string }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not signed in." };

  const res = await fetch("/api/team/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: body.error ?? `Request failed (${res.status}).` };
  }
  return { error: null, tempPassword: body.tempPassword };
}
