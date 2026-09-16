"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Power, Sprout } from "lucide-react";
import { modulesForCategory } from "@/lib/modules";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/supabase/businesses";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { useBusiness } from "@/components/business-provider";
import { useSiteSettings } from "@/components/site-settings-provider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { business } = useBusiness();
  const { settings } = useSiteSettings();

  // Only the modules this customer's business category is entitled to.
  const items = modulesForCategory(business?.category);
  const categoryLabel = business?.category
    ? BUSINESS_CATEGORY_LABELS[business.category]
    : null;

  async function handleLogOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 h-16 px-5 border-b border-slate-200">
        {settings.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logoUrl}
            alt={settings.siteName}
            className="h-9 w-9 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sprout size={18} />
          </div>
        )}
        <div className="leading-tight min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {settings.siteName}
          </p>
          <p className="text-xs text-slate-500">
            {categoryLabel ?? "Commission Agent"}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto thin-scrollbar px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                size={18}
                className={active ? "text-brand-600" : "text-slate-400"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 space-y-1">
        <button
          onClick={handleLogOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut size={18} className="text-slate-400" />
          Log Out
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
          <Power size={18} className="text-slate-400" />
          Exit
        </button>
      </div>
    </aside>
  );
}
