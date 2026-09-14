"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import {
  FormField,
  PasswordField,
  PrimaryButton,
  SecondaryButton,
} from "@/components/auth/auth-fields";
import { useAuth } from "@/components/auth-provider";
import { useSiteSettings } from "@/components/site-settings-provider";
import { isSupabaseConfigured, setRememberMe } from "@/lib/supabase/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-[var(--auth-error-soft)] px-3 py-2 text-xs font-medium text-[var(--auth-error)]">
            <CircleAlert size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <FormField
          label="Email address"
          id="email"
          type="email"
          autoComplete="email"
          icon={<Mail size={18} />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email)
              setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          error={fieldErrors.email}
          placeholder="you@example.com"
        />

        <PasswordField
          label="Password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password)
              setFieldErrors((f) => ({ ...f, password: undefined }));
          }}
          error={fieldErrors.password}
          placeholder="••••••••"
          rightSlot={
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[var(--auth-primary-800)] hover:text-[var(--auth-primary-900)]"
            >
              Forgot password?
            </Link>
          }
        />

        <label className="flex items-center gap-2 text-sm text-[var(--auth-text-secondary)] select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--auth-border-strong)] accent-[var(--auth-primary-800)] focus:ring-4 focus:ring-[var(--auth-primary-600)]/15"
          />
          Remember me
        </label>

        <PrimaryButton
          type="submit"
          disabled={submitting}
          loading={submitting}
          loadingText="Signing in…"
        >
          Log In
        </PrimaryButton>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--auth-border)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--auth-surface)] px-3 text-xs text-[var(--auth-text-disabled)]">
              or
            </span>
          </div>
        </div>

        <Link href="/signup">
          <SecondaryButton type="button">Create new account</SecondaryButton>
        </Link>
      </form>
    </AuthShell>
  );
}
