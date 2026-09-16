"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { modulesForUser } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/supabase/businesses";
import { useBusiness } from "@/components/business-provider";

export default function DashboardPage() {
  const { business, isOwner, membership } = useBusiness();

  // Dashboard cards mirror the sidebar: only entitled modules, further
  // narrowed by role for a staff login.
  const items = modulesForUser(business?.category, {
    isOwner,
    moduleKeys: membership ? effectiveModuleKeys(membership) : [],
  });
  const categoryLabel = business?.category
    ? BUSINESS_CATEGORY_LABELS[business.category]
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          {categoryLabel && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
              {categoryLabel}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Welcome back. Choose a module below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-brand-600/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </div>
                <ArrowRight
                  size={16}
                  className="text-slate-300 group-hover:text-brand-600 transition-colors"
                />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-900">
                {item.label}
              </h2>
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
