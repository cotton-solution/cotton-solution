"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const result = await signUp(email, password, name, businessName, businessCategory);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    router.push("/");
  }

  if (needsConfirmation) {
    return (
      <AuthShell title="Check your email">
        <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-3 bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0" />
          We sent a confirmation link to <strong className="mx-1">{email}</strong>.
          Confirm your address, then log in.
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
      title="Create your account"
      subtitle="Set up access to the Account Management Portal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
            <CircleAlert size={14} />
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <Label htmlFor="business-name">Business / Company name</Label>
          <Input
            id="business-name"
            required
            autoComplete="organization"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Al-Barkat Cotton Factory"
          />
        </div>

        <div>
          <Label htmlFor="business-category">Business category</Label>
          <select
            id="business-category"
            required
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
            className="w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="" disabled>
              Select a category…
            </option>
            <option value="shopkeeper">Shopkeeper</option>
            <option value="wholesaler">Wholesaler</option>
            <option value="distributor">Distributor</option>
            <option value="trader">Trader</option>
            <option value="manufacturer">Manufacturer</option>
          </select>
        </div>

        <div>
          <Label htmlFor="signup-email">Email address</Label>
          <Input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <Label htmlFor="signup-password">Password</Label>
          <PasswordInput
            id="signup-password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm password</Label>
          <PasswordInput
            id="confirm-password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create Account"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-700 hover:text-brand-800 font-medium"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
