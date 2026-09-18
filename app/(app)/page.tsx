"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw, TriangleAlert } from "lucide-react";
import { modulesForUser, visibleModuleKeys } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/supabase/businesses";
import { useBusiness } from "@/components/business-provider";
import { useAuth } from "@/components/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchDashboard } from "@/lib/supabase/dashboard";
import { EMPTY_DASHBOARD, type DashboardData } from "@/lib/dashboard";
import { CashPosition } from "@/components/dashboard/cash-position";
import { OwedPanel } from "@/components/dashboard/owed-panel";
import { FiguresStrip } from "@/components/dashboard/figures-strip";
import { FlowChart } from "@/components/dashboard/flow-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { TopParties } from "@/components/dashboard/top-parties";
import { QuickActions } from "@/components/dashboard/quick-actions";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { business, isOwner, membership } = useBusiness();
  const { user } = useAuth();

  const access = {
    isOwner,
    moduleKeys: membership ? effectiveModuleKeys(membership) : [],
  };
  const modules = modulesForUser(business?.category, access);
  const allowedKeys = visibleModuleKeys(business?.category, access);
  const categoryLabel = business?.category
    ? BUSINESS_CATEGORY_LABELS[business.category]
    : null;

  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "demo">("demo");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const result = await fetchDashboard();
    setData(result.data);
    setSource(result.source);
    setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const thisMonth = new Date().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-[1180px] mx-auto space-y-4 dash-in">
      {/* Page head */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[19px] font-semibold text-slate-900">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            {categoryLabel && (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11.5px] font-medium text-brand-700">
                {categoryLabel}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-slate-500">
            {business?.name ? `${business.name} · ` : ""}
            Figures below cover {thisMonth} and the last twelve months.
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {/* Data-source note */}
      {!isSupabaseConfigured && (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800">
          <TriangleAlert size={14} />
          Demo mode — these are sample figures. Connect Supabase to see your own
          book (see README).
        </p>
      )}
      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
          <TriangleAlert size={14} />
          Couldn&apos;t read your figures: {error}. Showing sample data instead.
        </p>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Row 1 — where the money is, and who owes what */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <CashPosition lines={data.cashLines} />
            </div>
            <div className="lg:col-span-5">
              <OwedPanel
                receivable={data.totals.receivable}
                payable={data.totals.payable}
                overdueReceivable={data.totals.overdueReceivable}
                ageing={data.ageing}
              />
            </div>
          </div>

          {/* Row 2 — month-to-date figures */}
          <FiguresStrip
            bankBalance={data.cashLines.reduce((sum, l) => sum + l.balance, 0)}
            sales={data.totals.sales}
            salesPrev={data.totals.salesPrev}
            outstandingInvoices={data.totals.receivable}
            expenses={data.totals.expenses}
            expensesPrev={data.totals.expensesPrev}
            periodLabel={`${thisMonth} to date`}
          />

          {/* Row 3 — trend and exposure */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <FlowChart months={data.months} />
            </div>
            <div className="lg:col-span-4">
              <TopParties parties={data.topParties} />
            </div>
          </div>

          {/* Row 4 — what happened, what to do next */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <ActivityFeed items={data.activity} />
            </div>
            <div className="lg:col-span-5">
              <QuickActions allowed={allowedKeys} />
            </div>
          </div>
        </>
      )}

      {/* Modules — kept, but as a quiet strip instead of the whole page */}
      <section className="rule-t pt-5">
        <h2 className="text-[13px] font-medium text-slate-600">Your modules</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {modules.filter((m) => m.key !== "dashboard").map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-brand-600/40 transition-colors"
              >
                <Icon size={17} className="text-slate-400 group-hover:text-brand-700 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-slate-900 truncate">
                    {m.label}
                  </span>
                  <span className="block text-[11.5px] text-slate-500 truncate">
                    {m.description}
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="text-slate-300 group-hover:text-brand-600 shrink-0"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 h-[264px] rounded-2xl bg-slate-200/70 animate-pulse" />
        <div className="lg:col-span-5 h-[264px] rounded-2xl bg-slate-200/50 animate-pulse" />
      </div>
      <div className="h-[110px] rounded-2xl bg-slate-200/50 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-[320px] rounded-2xl bg-slate-200/50 animate-pulse" />
        <div className="lg:col-span-4 h-[320px] rounded-2xl bg-slate-200/50 animate-pulse" />
      </div>
    </div>
  );
}
