"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleAlert, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-3 bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0" />
          If an account exists for <strong className="mx-1">{email}</strong>,
          a reset link is on its way.
        </div>
        <Link href="/login" className="block mt-4">
          <Button type="button" variant="secondary" className="w-full">
            Back to Log In
          </Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
            <CircleAlert size={14} />
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="reset-email">Email address</Label>
          <Input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send Reset Link"}
        </Button>

        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-brand-700 hover:text-brand-800 font-medium"
          >
            Back to Log In
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
