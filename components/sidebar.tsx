"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { modulesForUser } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/supabase/businesses";
import { useAuth } from "@/components/auth-provider";
import { useBusiness } from "@/components/business-provider";
import { BusinessLogo, useBusinessIdentity } from "@/components/business-mark";
import { NavTree } from "@/components/nav-tree";

export function Sidebar() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { business, isOwner, membership } = useBusiness();
  const identity = useBusinessIdentity();

  const modules = modulesForUser(business?.category, {
    isOwner,
    moduleKeys: membership ? effectiveModuleKeys(membership) : [],
  });
  const categoryLabel = business?.category
    ? BUSINESS_CATEGORY_LABELS[business.category]
    : null;

  // Each business shows only its own name & logo (Settings → Company
  // Profile) — the platform's branding never appears after login.
  const displayName = identity.name;

  async function handleLogOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex lg:w-[264px] lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
      <Link
        href="/"
        className="flex items-center gap-2.5 h-16 px-5 border-b border-slate-200 hover:bg-slate-50 transition-colors"
      >
        <BusinessLogo
          name={identity.name}
          logoUrl={identity.logoUrl}
          loading={identity.loading}
        />
        <div className="leading-tight min-w-0">
          {identity.loading && !displayName ? (
            <div className="h-3.5 w-28 rounded bg-slate-100 animate-pulse" />
          ) : (
            <p className="text-sm font-semibold text-slate-900 truncate">
              {displayName}
            </p>
          )}
          <p className="text-xs text-slate-500 truncate">
            {categoryLabel ?? "Business Account"}
          </p>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-3 py-4">
        <NavTree modules={modules} />
      </div>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleLogOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut size={18} className="text-slate-400" />
          Log out
        </button>
      </div>
    </aside>
  );
}
