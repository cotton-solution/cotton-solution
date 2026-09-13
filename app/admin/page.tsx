"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  CircleX,
  Sparkles,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import {
  fetchAllBusinesses,
  updateBusinessSubscription,
  type Business,
  type SubscriptionStatus,
} from "@/lib/supabase/businesses";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trial: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  expired: "bg-red-50 text-red-700",
  suspended: "bg-slate-200 text-slate-600",
};

function oneYearFromToday(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function AdminDashboard() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setBusinesses(await fetchAllBusinesses());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogOut() {
    await signOut();
    router.push("/admin/login");
  }

  async function activateOneYear(b: Business) {
    setBusyId(b.id);
    await updateBusinessSubscription(b.id, {
      subscriptionStatus: "active",
      subscriptionExpiresAt: oneYearFromToday(),
    });
    await load();
    setBusyId(null);
  }

  async function suspend(b: Business) {
    setBusyId(b.id);
    await updateBusinessSubscription(b.id, { subscriptionStatus: "suspended" });
    await load();
    setBusyId(null);
  }

  async function reinstate(b: Business) {
    setBusyId(b.id);
    await updateBusinessSubscription(b.id, { subscriptionStatus: "active" });
    await load();
    setBusyId(null);
  }

  const counts = businesses.reduce(
    (acc, b) => {
      acc[b.subscriptionStatus] = (acc[b.subscriptionStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<SubscriptionStatus, number>
  );
  const newThisMonth = businesses.filter((b) => isThisMonth(b.createdAt)).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-50">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <ShieldCheck size={16} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Bahar-e-Madina</p>
            <p className="text-[11px] text-emerald-200/70">Service Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium bg-white/10 text-white">
            <LayoutDashboard size={16} />
            Dashboard
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/70">
            <Building2 size={16} />
            Businesses
          </div>
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-200 hover:bg-white/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <ShieldCheck size={13} />
            Admin
          </span>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
          {/* Welcome banner */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-6">
            <p className="text-lg font-semibold">Welcome, Admin!</p>
            <p className="text-emerald-50/90 text-sm mt-1">
              Bahar-e-Madina Commission Agent
            </p>
            <p className="text-emerald-100/60 text-xs mt-0.5">
              Service Owner Panel · Subscriptions &amp; Billing
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              icon={<Building2 size={18} />}
              value={businesses.length}
              label="Total Businesses"
              color="text-slate-700 bg-slate-100"
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              value={counts.active ?? 0}
              label="Active"
              color="text-emerald-700 bg-emerald-50"
            />
            <StatCard
              icon={<Clock size={18} />}
              value={counts.trial ?? 0}
              label="Trial"
              color="text-amber-700 bg-amber-50"
            />
            <StatCard
              icon={<CircleX size={18} />}
              value={counts.expired ?? 0}
              label="Expired"
              color="text-red-700 bg-red-50"
            />
            <StatCard
              icon={<Ban size={18} />}
              value={counts.suspended ?? 0}
              label="Suspended"
              color="text-slate-600 bg-slate-200"
            />
            <StatCard
              icon={<Sparkles size={18} />}
              value={newThisMonth}
              label="New This Month"
              color="text-indigo-700 bg-indigo-50"
            />
          </div>

          {/* Businesses table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">
                Businesses
              </h2>
              <button
                onClick={load}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <RefreshCcw size={13} />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-2.5 font-medium">Business</th>
                    <th className="px-4 py-2.5 font-medium">Contact Email</th>
                    <th className="px-4 py-2.5 font-medium">Plan</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Expires On</th>
                    <th className="px-4 py-2.5 font-medium">Signed Up</th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && businesses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                        No businesses have signed up yet.
                      </td>
                    </tr>
                  )}
                  {businesses.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {b.name}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {b.contactEmail ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{b.plan}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.subscriptionStatus]}`}
                        >
                          {b.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {b.subscriptionExpiresAt ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          {b.subscriptionStatus !== "suspended" && (
                            <Button
                              variant="secondary"
                              className="h-8 px-2.5 text-xs"
                              disabled={busyId === b.id}
                              onClick={() => activateOneYear(b)}
                            >
                              Activate +1yr
                            </Button>
                          )}
                          {b.subscriptionStatus === "suspended" ? (
                            <Button
                              variant="secondary"
                              className="h-8 px-2.5 text-xs"
                              disabled={busyId === b.id}
                              onClick={() => reinstate(b)}
                            >
                              Reinstate
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              className="h-8 px-2.5 text-xs"
                              disabled={busyId === b.id}
                              onClick={() => suspend(b)}
                            >
                              Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-900 leading-none">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminDashboard />
    </AdminAuthGate>
  );
}
