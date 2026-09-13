"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, RefreshCcw } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-emerald-400">
            <ShieldCheck size={18} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">
              Service Admin
            </p>
            <p className="text-xs text-slate-500">
              Registered businesses &amp; subscriptions
            </p>
          </div>
        </div>
        <button
          onClick={handleLogOut}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </header>

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={businesses.length} />
          <StatCard label="Active" value={counts.active ?? 0} />
          <StatCard label="Trial" value={counts.trial ?? 0} />
          <StatCard
            label="Expired / Suspended"
            value={(counts.expired ?? 0) + (counts.suspended ?? 0)}
          />
        </div>

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
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900 mt-1">{value}</p>
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
