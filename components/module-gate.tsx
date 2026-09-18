"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { moduleKeyFromPath, canAccessModuleForUser } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { useBusiness } from "@/components/business-provider";
import { Button } from "@/components/ui/button";

/**
 * Hides a module from customers whose business category is not
 * entitled to it, and from staff logins whose assigned role doesn't
 * include it — including when they type the URL directly. Runs inside
 * the app layout, after BusinessGate, so `business` is already loaded
 * by the time this renders.
 */
export function ModuleGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { business, isOwner, membership, loading } = useBusiness();

  const moduleKey = moduleKeyFromPath(pathname);
  const allowed = moduleKey
    ? canAccessModuleForUser(
        business?.category,
        {
          isOwner,
          moduleKeys: membership ? effectiveModuleKeys(membership) : [],
        },
        moduleKey
      )
    : true;

  useEffect(() => {
    if (!loading && moduleKey && !allowed) {
      const timer = setTimeout(() => router.replace("/"), 4000);
      return () => clearTimeout(timer);
    }
  }, [loading, moduleKey, allowed, router]);

  if (loading || allowed) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-3 rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Lock size={20} />
        </div>
        <h1 className="text-base font-semibold text-slate-900">
          Module not available
        </h1>
        <p className="text-sm text-slate-500">
          This module isn&apos;t part of your current plan. Contact support if
          you&apos;d like it added to your account.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => router.replace("/")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
