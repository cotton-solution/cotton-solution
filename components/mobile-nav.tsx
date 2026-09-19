"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { modulesForUser } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/supabase/businesses";
import { useAuth } from "@/components/auth-provider";
import { useBusiness } from "@/components/business-provider";
import { BusinessLogo, useBusinessIdentity } from "@/components/business-mark";
import { NavTree } from "@/components/nav-tree";

export function MobileNav() {
  const [open, setOpen] = useState(false);
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
  const displayName = identity.name;

  async function handleLogOut() {
    setOpen(false);
    await signOut();
    router.push("/login");
  }

  return (
    <>
      <button
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[290px] max-w-[88vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 min-w-0"
              >
                <BusinessLogo
                  name={identity.name}
                  logoUrl={identity.logoUrl}
                  loading={identity.loading}
                />
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {categoryLabel ?? "Business Account"}
                  </p>
                </div>
              </Link>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar px-3 py-4">
              <NavTree modules={modules} dense onNavigate={() => setOpen(false)} />
            </div>

            <div className="border-t border-slate-200 p-3">
              <button
                onClick={handleLogOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={18} className="text-slate-400" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
