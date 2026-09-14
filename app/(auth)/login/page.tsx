"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { isSupabaseConfigured, setRememberMe } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim()))
      errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    setRememberMe(remember);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        isSupabaseConfigured
          ? "Sign in to your Bahar-e-Madina account."
          : "Demo mode — any email & password will sign you in."
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
            <CircleAlert size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
            }}
            aria-invalid={!!fieldErrors.email}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand-700 hover:text-brand-800 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            aria-invalid={!!fieldErrors.password}
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
          />
          Remember me
        </label>

        <Button type="submit" className="w-full gap-2" disabled={submitting}>
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Signing in…" : "Log In"}
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-50 px-3 text-xs text-slate-400">
              or
            </span>
          </div>
        </div>

        <Link href="/signup">
          <Button type="button" variant="secondary" className="w-full">
            Create new account
          </Button>
        </Link>
      </form>
    </AuthShell>
  );
}
