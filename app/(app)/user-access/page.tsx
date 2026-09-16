"use client";

import { useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  Database,
  CircleAlert,
  Copy,
  Check,
  ShieldOff,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { MODULES, type ModuleKey } from "@/lib/modules";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  DEFAULT_ROLE_MODULES,
  mockTeamMembers,
  emptyMemberDraft,
  effectiveModuleKeys,
  type MemberRole,
  type TeamMember,
} from "@/lib/team-data";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchTeamMembers,
  updateTeamMember,
  inviteTeamMember,
} from "@/lib/supabase/team";
import { useBusiness } from "@/components/business-provider";

const ROLES: MemberRole[] = ["admin", "accountant", "trader", "viewer", "custom"];
const ASSIGNABLE_MODULES = MODULES.filter((m) => m.key !== "user-access");

export default function UserAccessPage() {
  const { isOwner, membership, loading: businessLoading } = useBusiness();

  const [members, setMembers] = useState<TeamMember[]>(
    isSupabaseConfigured ? [] : mockTeamMembers
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [draft, setDraft] = useState(emptyMemberDraft());
  const [inviting, setInviting] = useState(false);
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canManage =
    !isSupabaseConfigured || isOwner || membership?.role === "admin";

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);
    fetchTeamMembers()
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .catch((e) => setErrorMsg(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const rolePreviewModules = useMemo(() => {
    if (draft.role === "custom") return draft.moduleKeys;
    return DEFAULT_ROLE_MODULES[draft.role];
  }, [draft.role, draft.moduleKeys]);

  function toggleDraftModule(key: ModuleKey) {
    setDraft((d) => ({
      ...d,
      moduleKeys: d.moduleKeys.includes(key)
        ? d.moduleKeys.filter((k) => k !== key)
        : [...d.moduleKeys, key],
    }));
  }

  async function handleInvite() {
    setErrorMsg(null);
    setLastTempPassword(null);
    if (!draft.name.trim() || !draft.email.trim()) {
      window.alert("Name and email are required.");
      return;
    }
    if (draft.role === "custom" && draft.moduleKeys.length === 0) {
      window.alert("Pick at least one module for a Custom role.");
      return;
    }

    setInviting(true);
    if (isSupabaseConfigured) {
      const { error, tempPassword } = await inviteTeamMember(draft);
      setInviting(false);
      if (error) {
        setErrorMsg(error);
        return;
      }
      setLastTempPassword(tempPassword ?? null);
      const rows = await fetchTeamMembers();
      setMembers(rows);
    } else {
      // Demo mode: just add to the in-memory list.
      const newMember: TeamMember = {
        id: `demo-${Date.now()}`,
        userId: `demo-${Date.now()}`,
        email: draft.email,
        name: draft.name,
        role: draft.role,
        moduleKeys: draft.moduleKeys,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setMembers((prev) => [...prev, newMember]);
      setLastTempPassword("demo-mode-no-real-login");
      setInviting(false);
    }
    setDraft(emptyMemberDraft());
  }

  async function handleToggleActive(member: TeamMember) {
    if (isSupabaseConfigured) {
      const { error } = await updateTeamMember(member.id, {
        isActive: !member.isActive,
      });
      if (error) {
        setErrorMsg(error);
        return;
      }
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, isActive: !m.isActive } : m))
    );
  }

  async function handleRoleChange(member: TeamMember, role: MemberRole) {
    const moduleKeys = role === "custom" ? effectiveModuleKeys(member) : [];
    if (isSupabaseConfigured) {
      const { error } = await updateTeamMember(member.id, { role, moduleKeys });
      if (error) {
        setErrorMsg(error);
        return;
      }
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, role, moduleKeys } : m))
    );
  }

  function copyPassword() {
    if (!lastTempPassword) return;
    navigator.clipboard?.writeText(lastTempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!businessLoading && !canManage) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Lock size={20} />
          </div>
          <h1 className="text-base font-semibold text-slate-900">
            Owner / Admin only
          </h1>
          <p className="text-sm text-slate-500">
            Only the business owner or an Admin team member can manage user
            access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">User Access</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add staff logins and control exactly which modules each one can
          open.
        </p>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2",
          isSupabaseConfigured
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        )}
      >
        <Database size={14} />
        {isSupabaseConfigured
          ? "Connected to Supabase — new logins are real and can sign in immediately."
          : "Demo mode — invites are in-memory only and don't create real logins. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to persist data (see README)."}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
          <CircleAlert size={14} />
          {errorMsg}
        </div>
      )}

      {/* Invite form */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-card space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Add a Team Member
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="member-name">Full Name</Label>
            <Input
              id="member-name"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={draft.email}
              onChange={(e) =>
                setDraft((d) => ({ ...d, email: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="member-role">Role</Label>
            <Select
              id="member-role"
              value={draft.role}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  role: e.target.value as MemberRole,
                }))
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-500">
              {ROLE_DESCRIPTIONS[draft.role]}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {draft.role === "custom" ? "Pick modules" : "Modules this role gets"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ASSIGNABLE_MODULES.map((m) => {
              const on = rolePreviewModules.includes(m.key);
              return (
                <label
                  key={m.key}
                  className={cn(
                    "flex items-center gap-2 text-sm rounded-lg px-2.5 py-2",
                    draft.role === "custom" ? "bg-white border border-slate-200" : "",
                    on ? "text-slate-900" : "text-slate-400"
                  )}
                >
                  <Checkbox
                    checked={on}
                    disabled={draft.role !== "custom"}
                    onChange={() => toggleDraftModule(m.key)}
                  />
                  {m.label}
                </label>
              );
            })}
          </div>
        </div>

        <Button onClick={handleInvite} disabled={inviting}>
          <UserPlus size={16} />
          {inviting ? "Adding…" : "Add Team Member"}
        </Button>

        {lastTempPassword && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
            <p className="text-xs font-medium text-emerald-800">
              Login created. Share this temporary password with them once —
              it won&apos;t be shown again. They should change it after
              signing in.
            </p>
            <div className="flex gap-2">
              <PasswordInput value={lastTempPassword} readOnly className="flex-1" />
              <Button type="button" variant="secondary" onClick={copyPassword}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Team list */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Team Members ({members.length})
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {loading && (
            <p className="p-4 text-sm text-slate-400">Loading team…</p>
          )}
          {!loading && members.length === 0 && (
            <p className="p-4 text-sm text-slate-400">
              No team members yet — add one above.
            </p>
          )}
          {members.map((m) => (
            <div
              key={m.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                  {m.name || m.email}
                  {!m.isActive && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">
                      Deactivated
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 truncate">{m.email}</p>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={m.role}
                  onChange={(e) =>
                    handleRoleChange(m, e.target.value as MemberRole)
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleToggleActive(m)}
                className="shrink-0"
              >
                {m.isActive ? (
                  <>
                    <ShieldOff size={16} />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Reactivate
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
