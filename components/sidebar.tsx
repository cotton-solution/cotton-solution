"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Sprout } from "lucide-react";
import { modulesForUser } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/supabase/businesses";
import { useAuth } from "@/components/auth-provider";
import { useBusiness } from "@/components/business-provider";
import { useSiteSettings } from "@/components/site-settings-provider";
import { NavTree } from "@/components/nav-tree";

export function Sidebar() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { business, isOwner, membership } = useBusiness();
  const { settings } = useSiteSettings();

  const modules = modulesForUser(business?.category, {
    isOwner,
    moduleKeys: membership ? effectiveModuleKeys(membership) : [],
  });
  const categoryLabel = business?.category
    ? BUSINESS_CATEGORY_LABELS[business.category]
    : null;

  // Each paying business shows its own name & logo (set in Settings →
  // Company Profile) — the platform's own branding is only a fallback
  // for the brief moment before the business record has loaded.
  const displayName = business?.name || settings.siteName;
  const displayLogo = business?.logoUrl || settings.logoUrl;

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
        {displayLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayLogo}
            alt={displayName}
            className="h-9 w-9 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sprout size={18} />
          </div>
        )}
        <div className="leading-tight min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {displayName}
          </p>
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
