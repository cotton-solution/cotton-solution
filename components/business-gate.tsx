"use client";

import type { ReactNode } from "react";
import { CircleAlert, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBusiness } from "@/components/business-provider";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";

export function BusinessGate({ children }: { children: ReactNode }) {
  const { business, loading } = useBusiness();
  const { signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  const pending = business && business.subscriptionStatus === "trial";
  const blocked =
    business &&
    (business.subscriptionStatus === "expired" ||
      business.subscriptionStatus === "suspended");

  if (pending || blocked) {
    async function handleLogOut() {
      await signOut();
      router.push("/login");
    }

    const status = business!.subscriptionStatus;
    const title =
      status === "trial"
        ? "Account pending approval"
        : status === "expired"
          ? "Subscription expired"
          : "Account suspended";
    const message =
      status === "trial"
        ? "Thanks for signing up! " +
          business!.name +
          " is waiting for approval from our team before you can start using the portal. This usually doesn't take long."
        : status === "expired"
          ? "Your yearly subscription for " +
            business!.name +
            " has expired. Please renew to continue using the portal."
          : "Access for " +
            business!.name +
            " has been suspended. Please contact support.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm w-full bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
          <div
            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
              status === "trial"
                ? "bg-amber-50 text-amber-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {status === "trial" ? (
              <Clock3 size={20} />
            ) : (
              <CircleAlert size={20} />
            )}
          </div>
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{message}</p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleLogOut}
          >
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
