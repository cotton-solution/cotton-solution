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
import { useSiteSettings } from "@/components/site-settings-provider";
import { isSupabaseConfigured, setRememberMe } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared field styling so the inputs match the design spec (48px height,
// 10px radius, 14px horizontal padding, 15px type) without touching the
// shared ui/Input & ui/PasswordInput components used elsewhere in the app.
const fieldBase =
  "h-12 rounded-[10px] px-3.5 text-[15px] transition-colors duration-150 ease-out " +
  "border-slate-300 focus:border-green-600 focus:ring-4 focus:ring-green-600/15";
const fieldError =
  "border-red-600 focus:border-red-600 focus:ring-4 focus:ring-red-600/10";

export default function LoginPage() {
  const { signIn } = useAuth();
  const { settings } = useSiteSettings();
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
          ? `Sign in to your ${settings.siteName} account.`
          : "Demo mode — any email & password will sign you in."
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-[10px] bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">
            <CircleAlert size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="email" className="mb-2 text-sm font-semibold text-slate-900">
            Email address
          </Label>
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
            className={`${fieldBase} ${fieldErrors.email ? fieldError : ""}`}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0 text-sm font-semibold text-slate-900">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-green-800 hover:text-green-900"
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
            className={`${fieldBase} ${fieldErrors.password ? fieldError : ""}`}
          />
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-green-700 focus:ring-green-600"
          />
          Remember me
        </label>

        <Button
          type="submit"
          disabled={submitting}
          className="mt-6 h-12 w-full gap-2 rounded-[10px] bg-green-800 text-[15px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-green-900 focus-visible:ring-4 focus-visible:ring-green-600/15"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Signing in…" : "Log In"}
        </Button>

        <div className="relative mt-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-slate-400">or</span>
          </div>
        </div>

        <Link href="/signup" className="mt-6 block">
          <Button
            type="button"
            variant="secondary"
            className="h-12 w-full rounded-[10px] border-slate-300 text-[15px] font-semibold text-green-800 transition-colors duration-150 ease-out hover:border-green-600 hover:bg-green-50"
          >
            Create new account
          </Button>
        </Link>
      </form>
    </AuthShell>
  );
}
