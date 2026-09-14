"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { checkIsAdmin } from "@/lib/supabase/businesses";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (loading) return;

      if (!isSupabaseConfigured) {
        // No Supabase project connected yet — nothing to check against.
        setCheckingAdmin(false);
        setIsAdmin(false);
        return;
      }

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const admin = await checkIsAdmin();
      if (cancelled) return;

      if (!admin) {
        await signOut();
        router.replace("/admin/login?error=not_admin");
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [loading, user, router, signOut]);

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
