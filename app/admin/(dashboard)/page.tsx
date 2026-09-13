"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  CircleX,
  Sparkles,
  Receipt,
  ReceiptText,
} from "lucide-react";
import {
  fetchAllBusinesses,
  type Business,
  type SubscriptionStatus,
} from "@/lib/supabase/businesses";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS, BUSINESS_TYPE_STYLES } from "@/lib/business-types";

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function AdminDashboardPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setBusinesses(await fetchAllBusinesses());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = businesses.reduce(
    (acc, b) => {
      acc[b.subscriptionStatus] = (acc[b.subscriptionStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<SubscriptionStatus, number>
  );
  const newThisMonth = businesses.filter((b) => isThisMonth(b.createdAt)).length;
  const unbilled = businesses.filter((b) => b.billingStatus === "unbilled").length;
  const billed = businesses.filter((b) => b.billingStatus === "billed").length;

  const byType = BUSINESS_TYPES.map((t) => ({
    ...t,
    count: businesses.filter((b) => b.businessType === t.value).length,
  }));

  return (
    <>
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-6">
        <p className="text-lg font-semibold">Welcome, Admin!</p>
        <p className="text-emerald-50/90 text-sm mt-1">Bahar-e-Madina Commission Agent</p>
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
          label="New Requests"
          color="text-amber-700 bg-amber-50"
        />
        <StatCard
          icon={<CircleX size={18} />}
          value={(counts.expired ?? 0) + (counts.suspended ?? 0)}
          label="Expired"
          color="text-red-700 bg-red-50"
        />
        <StatCard
          icon={<Receipt size={18} />}
          value={unbilled}
          label="Unbilled"
          color="text-amber-700 bg-amber-50"
        />
        <StatCard
          icon={<ReceiptText size={18} />}
          value={billed}
          label="Billed"
          color="text-emerald-700 bg-emerald-50"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          value={newThisMonth}
          label="New This Month"
          color="text-indigo-700 bg-indigo-50"
          span
        />
      </div>

      {/* Accounts by category */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Accounts by Category</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every business registers under one category and runs as its own account.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 md:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {byType.map((t) => (
            <div key={t.value} className="p-4 flex flex-col gap-2">
              <span
                className={`inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium ${BUSINESS_TYPE_STYLES[t.value]}`}
              >
                {BUSINESS_TYPE_LABELS[t.value]}
              </span>
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? "—" : t.count}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        <QuickLink href="/admin/accounts/new" label="Review New Requests" />
        <QuickLink href="/admin/billing/unbilled" label="See Unbilled Accounts" />
        <QuickLink href="/admin/web-settings" label="Update Web Settings" />
      </div>
    </>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
    >
      {label} →
    </Link>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  span,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  span?: boolean;
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 ${
        span ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
