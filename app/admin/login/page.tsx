"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { checkIsAdmin } from "@/lib/supabase/businesses";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const { signIn, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_admin"
      ? "That account is not authorized for the admin panel."
      : null
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        "Connect Supabase first (see README) — the admin panel needs a real database to check who's an admin."
      );
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setSubmitting(false);
      setError(signInError);
      return;
    }

    const admin = await checkIsAdmin();
    setSubmitting(false);

    if (!admin) {
      await signOut();
      setError("That account is not authorized for the admin panel.");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
            <ShieldCheck size={18} />
          </div>
          <span className="font-semibold text-white">
            Bahar-e-Madina — Service Admin
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-lg font-semibold text-white text-center">
            Admin sign in
          </h1>
          <p className="text-sm text-slate-400 text-center mt-1">
            Restricted to authorized service-owner accounts.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {error && (
              <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-950 text-red-300">
                <CircleAlert size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="admin-email" className="text-slate-300">
                Email address
              </Label>
              <Input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label htmlFor="admin-password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
